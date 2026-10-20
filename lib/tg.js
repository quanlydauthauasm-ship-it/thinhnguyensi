// Gửi tin nhắn Telegram (dùng cho cả webhook và cron)
async function sendMessage(chat_id, text) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text }),
  });
  return r.json();
}

module.exports = { sendMessage };
