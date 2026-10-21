// Gửi tin nhắn Telegram (dùng cho cả webhook và cron)
// extra: tuỳ chọn thêm, ví dụ { reply_markup: { inline_keyboard: [[{ text, url }]] } }
async function sendMessage(chat_id, text, extra) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ chat_id, text }, extra || {})),
  });
  return r.json();
}

module.exports = { sendMessage };
