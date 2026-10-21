// Lưu trữ trên Upstash Redis qua REST API (không cần cài thêm thư viện).
// Cần 2 biến môi trường: UPSTASH_REDIS_REST_URL và UPSTASH_REDIS_REST_TOKEN
const KEY = 'tl_assistant_db_v1';

function cfg() {
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) throw new Error('Thiếu UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN');
  return { url, token };
}

async function upstash(cmd, ...args) {
  const { url, token } = cfg();
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  });
  const j = await r.json();
  if (j.error) throw new Error('Upstash: ' + j.error);
  return j.result;
}

// Cấu trúc db v2: dữ liệu của anh nằm riêng trong db.owner (không ai khác thấy được)
const emptyDb = () => ({
  seq: 1,
  owner: { notes: [], reminders: [] },
  leads: [],
  pending: {},   // trạng thái đang nhập /dangky: { userId: { step, name } }
  aiCount: {},   // đếm tin AI/người/ngày: { userId: { day, n } }
});

async function loadDb() {
  const raw = await upstash('GET', KEY);
  if (!raw) return emptyDb();
  try {
    const db = Object.assign(emptyDb(), JSON.parse(raw));
    // Tự chuyển dữ liệu bản cũ (v1): notes/reminders nằm ngoài → đưa vào db.owner
    if (!db.owner && (db.notes || db.reminders)) {
      db.owner = { notes: db.notes || [], reminders: db.reminders || [] };
      delete db.notes; delete db.reminders;
    }
    if (!db.owner) db.owner = { notes: [], reminders: [] };
    return db;
  } catch (e) {
    return emptyDb();
  }
}

async function saveDb(db) {
  await upstash('SET', KEY, JSON.stringify(db));
}

module.exports = { loadDb, saveDb };
