// Xử lý tin nhắn — 2 chế độ:
//  - Chủ bot (OWNER_ID): trợ lý riêng đầy đủ (nhắc việc, ghi chú, AI tự do)
//  - Người khác (học viên): chế độ công khai — tư vấn khóa học, không thấy dữ liệu của anh
const { loadDb, saveDb } = require('./store');
const { sendMessage } = require('./tg');
const { askGemini } = require('./ai');
const { parseRemindTime, fmtTime } = require('./remind');
const {
  OWNER_SYSTEM_PROMPT,
  STUDENT_SYSTEM_PROMPT,
  PROMPT_BUILDER_SYSTEM,
  PUBLIC_HELP_TEXT,
  COURSE_TEXT,
  TEMPLATE_TEXT,
  PUBLIC_AI_DAILY_LIMIT,
  GROUP_INVITE_LINK,
  GROUP_TEXT,
  GROUP_HELP_TEXT,
} = require('./config');

// Nút bấm mở link vào group học viên (hiện dưới tin nhắn)
function groupButton() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: '👥 Vào group Học Viên Thịnh Nguyễn SI', url: GROUP_INVITE_LINK }]],
    },
  };
}

// Học viên này đã để lại lead qua /dangky chưa?
function isRegisteredLead(db, userId) {
  return (db.leads || []).some(l => String(l.userId) === String(userId));
}

// Trừ 1 lượt AI/ngày của 1 người (dùng trong group). Trả false nếu đã hết lượt.
async function consumeAiQuota(db, userId) {
  const today = todayVN();
  const cnt = db.aiCount[userId] && db.aiCount[userId].day === today ? db.aiCount[userId].n : 0;
  if (cnt >= PUBLIC_AI_DAILY_LIMIT) return false;
  db.aiCount[userId] = { day: today, n: cnt + 1 };
  await saveDb(db);
  return true;
}

const OWNER_HELP_TEXT =
  'Em là trợ lý riêng của anh 👋\n\n' +
  '• Nhắn tin tự do — hỏi em bất cứ gì (AI trả lời)\n' +
  '• /prompt <ý tưởng> — tạo câu lệnh AI chuẩn RCESF\n' +
  '• /nhac 30p <việc> — nhắc sau 30 phút\n' +
  '• /nhac 2h <việc> — nhắc sau 2 giờ\n' +
  '• /nhac 9h <việc> — nhắc lúc 9h (hôm nay, qua giờ thì mai)\n' +
  '• /nhac mai 8h <việc> — nhắc 8h sáng mai\n' +
  '• /dsnhac — xem việc sắp nhắc | /xoanhac <số>\n' +
  '• /ghichu <nội dung> — lưu ghi chú nhanh\n' +
  '• /dsnote — xem ghi chú | /xoanote <số>\n' +
  '• /dslead — xem danh sách học viên đăng ký\n' +
  '• /group — link vào group học viên Telegram\n' +
  '• /id — xem ID Telegram của anh';

const OWNER_ONLY_REPLY =
  'Tính năng này chỉ dành cho quản trị viên của bot thôi bạn nhé 🙂\n' +
  'Bạn có thể nhắn tin tự do để hỏi về AI/khóa học, hoặc dùng /khoahoc, /template, /dangky, /group.';

// Ngày hiện tại theo giờ VN, dùng để giới hạn AI/ngày
function todayVN() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

const PROMPT_USAGE =
  'Cú pháp: /prompt <ý tưởng>\nVí dụ: /prompt tạo ảnh chàng trai bên siêu xe\n' +
  'Em sẽ trả về câu lệnh hoàn chỉnh theo cấu trúc RCESF, copy dán vào công cụ AI là dùng ngay.';

// Kỹ năng tạo câu lệnh RCESF — dùng chung cho cả 2 chế độ
async function handlePrompt(chatId, rest) {
  if (!rest) {
    await sendMessage(chatId, PROMPT_USAGE);
    return;
  }
  const answer = await askGemini('Ý tưởng: ' + rest, PROMPT_BUILDER_SYSTEM);
  await sendMessage(chatId, answer);
}

// ================= CHẾ ĐỘ CHỦ BOT =================
async function handleOwner(msg, db, chatId, text, cmd, rest) {
  const store = db.owner;

  if (cmd === '/start' || cmd === '/help') {
    await sendMessage(chatId, OWNER_HELP_TEXT);
    return;
  }

  if (cmd === '/nhac') {
    const tokens = rest.split(/\s+/).filter(Boolean);
    let parsed = null, content = '';
    for (const n of [2, 1]) {
      if (tokens.length < n) continue;
      const cand = tokens.slice(0, n).join(' ');
      const t = parseRemindTime(cand);
      if (t) { parsed = t; content = tokens.slice(n).join(' '); break; }
    }
    if (!parsed || !content) {
      await sendMessage(chatId, 'Cú pháp: /nhac 30p <việc>  — ví dụ: /nhac 30p gọi cho khách\nHoặc: /nhac 9h họp team, /nhac mai 8h đi công tác');
      return;
    }
    const item = { id: db.seq++, text: content, at: parsed.at, chatId };
    store.reminders.push(item);
    await saveDb(db);
    await sendMessage(chatId, `Đã nhớ ⏰\n"${content}"\n→ Nhắc ${parsed.label} (${fmtTime(parsed.at)})`);
    return;
  }

  if (cmd === '/dsnhac') {
    const upcoming = store.reminders.filter(r => r.at > Date.now()).sort((a, b) => a.at - b.at);
    if (!upcoming.length) { await sendMessage(chatId, 'Hiện không có việc nào chờ nhắc.'); return; }
    await sendMessage(chatId, 'Việc sắp nhắc:\n' + upcoming.map(r => `${r.id}. ${r.text} — ${fmtTime(r.at)}`).join('\n'));
    return;
  }

  if (cmd === '/xoanhac') {
    const id = parseInt(rest, 10);
    const i = store.reminders.findIndex(r => r.id === id);
    if (i < 0) { await sendMessage(chatId, 'Không tìm thấy mã nhắc việc này. Dùng /dsnhac để xem lại.'); return; }
    const [gone] = store.reminders.splice(i, 1);
    await saveDb(db);
    await sendMessage(chatId, `Đã xóa nhắc việc: "${gone.text}"`);
    return;
  }

  if (cmd === '/ghichu') {
    if (!rest) { await sendMessage(chatId, 'Cú pháp: /ghichu <nội dung cần lưu>'); return; }
    const note = { id: db.seq++, text: rest, at: Date.now() };
    store.notes.push(note);
    await saveDb(db);
    await sendMessage(chatId, `Đã lưu ghi chú #${note.id} 📝`);
    return;
  }

  if (cmd === '/dsnote') {
    if (!store.notes.length) { await sendMessage(chatId, 'Chưa có ghi chú nào.'); return; }
    const lines = store.notes.slice(-20).reverse()
      .map(n => `${n.id}. ${n.text} (${fmtTime(n.at)})`);
    await sendMessage(chatId, 'Ghi chú của anh:\n' + lines.join('\n'));
    return;
  }

  if (cmd === '/xoanote') {
    const id = parseInt(rest, 10);
    const i = store.notes.findIndex(n => n.id === id);
    if (i < 0) { await sendMessage(chatId, 'Không tìm thấy ghi chú này. Dùng /dsnote để xem lại.'); return; }
    const [gone] = store.notes.splice(i, 1);
    await saveDb(db);
    await sendMessage(chatId, `Đã xóa ghi chú #${gone.id}`);
    return;
  }

  if (cmd === '/dslead') {
    if (!db.leads.length) { await sendMessage(chatId, 'Chưa có học viên nào đăng ký.'); return; }
    const lines = db.leads.slice(-20).reverse()
      .map(l => `• ${l.name} — ${l.phone} (${l.tgUsername ? '@' + l.tgUsername : 'id ' + l.userId}, ${fmtTime(l.at)})`);
    await sendMessage(chatId, `Danh sách đăng ký (${db.leads.length}):\n` + lines.join('\n'));
    return;
  }

  if (cmd === '/prompt') {
    await handlePrompt(chatId, rest);
    return;
  }

  if (cmd === '/group') {
    await sendMessage(chatId, GROUP_TEXT, groupButton());
    return;
  }

  // Mọi tin nhắn khác: hỏi AI với "tính cách" trợ lý riêng
  const question = cmd === '/hoi' ? rest : text;
  if (!question) { await sendMessage(chatId, OWNER_HELP_TEXT); return; }
  const answer = await askGemini(question, OWNER_SYSTEM_PROMPT);
  await sendMessage(chatId, answer);
}

// ================= CHẾ ĐỘ CÔNG KHAI (học viên) =================
async function handlePublic(msg, db, chatId, text, cmd, rest) {
  const fromId = String(msg.from.id);
  const ownerId = String(process.env.OWNER_ID || '');

  // Đang trong luồng /dangky mà nhắn tin thường (không phải lệnh) → nhận theo bước
  const pending = db.pending[fromId];
  if (pending && !text.startsWith('/')) {
    if (pending.step === 'ask_name') {
      db.pending[fromId] = { step: 'ask_phone', name: text.slice(0, 100) };
      await saveDb(db);
      await sendMessage(chatId, `Dạ em ghi nhận anh/chị ${text.slice(0, 100)}.\nCho em xin số điện thoại/Zalo để thầy liên hệ tư vấn nhé:`);
      return;
    }
    if (pending.step === 'ask_phone') {
      const lead = {
        name: pending.name, phone: text.slice(0, 30),
        userId: fromId, tgUsername: msg.from.username || '',
        at: Date.now(),
      };
      db.leads.push(lead);
      delete db.pending[fromId];
      await saveDb(db);
      await sendMessage(chatId, 'Em đã ghi nhận thông tin! ✅ Thầy sẽ liên hệ tư vấn trong thời gian sớm nhất.\nHotline/Zalo: 0918 717 952\n\nMời bạn vào luôn group học viên của mình trên Telegram để nhận lịch học, tài liệu và template mới nhất 👇', groupButton());
      // Báo ngay cho anh
      if (ownerId) {
        await sendMessage(ownerId, `🎓 Học viên đăng ký mới qua bot:\n- Họ tên: ${lead.name}\n- SĐT: ${lead.phone}\n- Telegram: ${lead.tgUsername ? '@' + lead.tgUsername : 'id ' + fromId}`);
      }
      return;
    }
  }

  if (cmd === '/start' || cmd === '/help') {
    await sendMessage(chatId, PUBLIC_HELP_TEXT);
    return;
  }

  if (cmd === '/khoahoc') {
    await sendMessage(chatId, COURSE_TEXT);
    return;
  }

  if (cmd === '/template') {
    await sendMessage(chatId, TEMPLATE_TEXT);
    return;
  }

  if (cmd === '/dangky') {
    db.pending[fromId] = { step: 'ask_name' };
    await saveDb(db);
    await sendMessage(chatId, 'Để đăng ký tư vấn, cho em xin **họ tên** của anh/chị nhé:');
    return;
  }

  if (cmd === '/group') {
    // Chỉ gửi link cho học viên đã đăng ký — giữ group sạch, tránh spam/người lạ
    if (isRegisteredLead(db, fromId)) {
      await sendMessage(chatId, GROUP_TEXT, groupButton());
    } else {
      await sendMessage(chatId, 'Group học viên dành cho bạn đã đăng ký tư vấn, để thầy giữ group sạch và hỗ trợ đúng người 😊\n\nBạn dùng lệnh /dangky, để lại họ tên + SĐT (chỉ mất khoảng 30 giây) là em gửi nút vào group ngay trong tin nhắn xác nhận nhé.');
    }
    return;
  }

  if (cmd === '/prompt') {
    // Tính vào giới hạn AI/ngày như tin nhắn AI thường
    if (!rest) { await handlePrompt(chatId, rest); return; }
    const today = todayVN();
    const cnt = db.aiCount[fromId] && db.aiCount[fromId].day === today ? db.aiCount[fromId].n : 0;
    if (cnt >= PUBLIC_AI_DAILY_LIMIT) {
      await sendMessage(chatId, 'Hôm nay bạn đã hỏi khá nhiều rồi, mai quay lại em trả lời tiếp nhé 😊\nCần gấp thì liên hệ trực tiếp Zalo 0918 717 952.');
      return;
    }
    db.aiCount[fromId] = { day: today, n: cnt + 1 };
    await saveDb(db);
    await handlePrompt(chatId, rest);
    return;
  }

  // Các lệnh riêng của chủ bot → từ chối lịch sự
  const ownerOnly = ['/nhac', '/dsnhac', '/xoanhac', '/ghichu', '/dsnote', '/xoanote', '/dslead', '/hoi'];
  if (ownerOnly.includes(cmd)) {
    await sendMessage(chatId, OWNER_ONLY_REPLY);
    return;
  }

  // Tin nhắn tự do → AI với "tính cách" trợ lý học viên + giới hạn chống lạm dụng
  const question = text;
  if (!question) { await sendMessage(chatId, PUBLIC_HELP_TEXT); return; }
  const today = todayVN();
  const cnt = db.aiCount[fromId] && db.aiCount[fromId].day === today ? db.aiCount[fromId].n : 0;
  if (cnt >= PUBLIC_AI_DAILY_LIMIT) {
    await sendMessage(chatId, 'Hôm nay bạn đã hỏi khá nhiều rồi, mai quay lại em trả lời tiếp nhé 😊\nCần gấp thì liên hệ trực tiếp Zalo 0918 717 952.');
    return;
  }
  db.aiCount[fromId] = { day: today, n: cnt + 1 };
  await saveDb(db);
  const answer = await askGemini(question, require('./config').STUDENT_SYSTEM_PROMPT);
  await sendMessage(chatId, answer);
}

// ================= TRONG GROUP HỌC VIÊN =================
// Bot chào thành viên mới vừa vào group (tin sự kiện của Telegram, không có text)
async function handleNewMembers(msg) {
  const chatId = msg.chat.id;
  const humans = (msg.new_chat_members || []).filter(u => !u.is_bot);
  if (!humans.length) return;
  const names = humans.map(u => u.username ? '@' + u.username : (u.first_name || 'bạn mới')).join(', ');
  await sendMessage(chatId,
    `Chào mừng ${names} đến với group Học Viên Thịnh Nguyễn SI 👋🎓\n\n` +
    '• Bạn xem tin nhắn ghim ở đầu group để nắm nội quy + tài liệu nhé.\n' +
    '• Cần hỗ trợ: nhắn thầy trong group, hoặc chat riêng với em @thinhnguyensi_bot (gõ /khoahoc, /template, /prompt).\n' +
    '• Hotline/Zalo: 0918 717 952\n\n' +
    'Chúc bạn học hiệu quả và ứng dụng AI vào công việc thật tốt!');
}

// Xử lý tin nhắn TRONG group: chỉ phản hồi lệnh và khi được nhắc tên (@tag),
// tuyệt đối không tự chen vào mọi câu chuyện của group (tránh spam + tốn quota AI)
async function handleGroup(msg, db, chatId, text, cmd, rest) {
  if (msg.from && msg.from.is_bot) return; // bỏ qua bot khác, tránh vòng lặp

  if (cmd === '/start' || cmd === '/help') { await sendMessage(chatId, GROUP_HELP_TEXT); return; }
  if (cmd === '/khoahoc') { await sendMessage(chatId, COURSE_TEXT); return; }
  if (cmd === '/template') { await sendMessage(chatId, TEMPLATE_TEXT); return; }
  if (cmd === '/group') { await sendMessage(chatId, 'Bạn đang ở trong group Học Viên Thịnh Nguyễn SI rồi đó 😊 Xem tin nhắn ghim ở đầu group để lấy tài liệu nhé.'); return; }
  if (cmd === '/prompt') { await handlePrompt(chatId, rest); return; }
  if (cmd === '/dangky') { await sendMessage(chatId, 'Đăng ký tư vấn thì bạn chat riêng với em @thinhnguyensi_bot rồi gõ /dangky nhé — để tránh lộ số điện thoại trong group đông người.'); return; }

  // Được nhắc tên trong câu hỏi thường → trả lời bằng AI học viên (có giới hạn/ngày)
  const mention = '@thinhnguyensi_bot';
  if (text.toLowerCase().includes(mention)) {
    const question = text.replace(/@thinhnguyensi_bot/gi, '').trim();
    if (!question) { await sendMessage(chatId, GROUP_HELP_TEXT); return; }
    const fromId = String(msg.from.id);
    if (!(await consumeAiQuota(db, fromId))) {
      await sendMessage(chatId, 'Hôm nay bạn đã hỏi em khá nhiều rồi, mai em trả lời tiếp nhé 😊 Cần gấp: Zalo 0918 717 952.');
      return;
    }
    const answer = await askGemini(question, STUDENT_SYSTEM_PROMPT);
    await sendMessage(chatId, answer);
  }
  // Tin thường trong group không có lệnh/tag → bỏ qua
}

// ================= ĐIỀU PHỐI =================
async function handleMessage(msg) {
  const chatId = msg.chat.id;

  // Thành viên mới vào group (kể cả group của anh) → bot chào mừng
  if (msg.new_chat_members && msg.new_chat_members.length) {
    await handleNewMembers(msg);
    return;
  }
  if (msg.left_chat_member) return;

  const fromId = String(msg.from.id);
  const text = (msg.text || '').trim();
  if (!text) return;

  // Lệnh /id mở cho mọi người (để lấy ID lúc setup)
  if (text.startsWith('/id')) {
    await sendMessage(chatId, `ID Telegram của bạn: ${fromId}`);
    return;
  }

  const firstWord = text.split(' ')[0];
  const cmd = firstWord.split('@')[0].toLowerCase();
  const rest = text.slice(firstWord.length).trim();
  const db = await loadDb();

  // Tin trong group/supergroup → xử lý theo chế độ group (kể cả tin của anh,
  // để anh nhắn trong group không bị bot hiểu nhầm là chat riêng với trợ lý)
  if (msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup')) {
    await handleGroup(msg, db, chatId, text, cmd, rest);
    return;
  }

  // Hủy luồng /dangky nếu người ta gửi lệnh khác giữa chừng
  if (text.startsWith('/') && db.pending[fromId] && cmd !== '/dangky') {
    delete db.pending[fromId];
    await saveDb(db);
  }

  if (fromId === String(process.env.OWNER_ID || '')) {
    await handleOwner(msg, db, chatId, text, cmd, rest);
  } else {
    await handlePublic(msg, db, chatId, text, cmd, rest);
  }
}

module.exports = { handleMessage };
