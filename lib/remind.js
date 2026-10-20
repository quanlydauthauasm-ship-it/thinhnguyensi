// Hiểu thời gian nhắc việc cho bot Vercel.
// Hỗ trợ: "30p", "2h", "1h30p", "9h", "9h30", "mai 9h"
process.env.TZ = 'Asia/Ho_Chi_Minh';

function parseRemindTime(s) {
  s = String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const now = new Date();
  let m;
  if ((m = s.match(/^(\d+)\s*(p|phút|phut)$/))) {
    const at = new Date(now.getTime() + parseInt(m[1], 10) * 60000);
    return { at: at.getTime(), label: `sau ${m[1]} phút` };
  }
  if ((m = s.match(/^(\d+)\s*(h|giờ|gio)(\s*(\d+)\s*(p|phút|phut))?$/))) {
    const mins = parseInt(m[1], 10) * 60 + (m[4] ? parseInt(m[4], 10) : 0);
    if (mins <= 0) return null;
    const at = new Date(now.getTime() + mins * 60000);
    return { at: at.getTime(), label: `sau ${m[1]} giờ${m[4] ? ' ' + m[4] + ' phút' : ''}` };
  }
  if ((m = s.match(/^(mai\s+|ngày mai\s+)?(\d{1,2})\s*h(\d{1,2})?$/))) {
    const isTomorrow = !!m[1];
    const hh = parseInt(m[2], 10), mm = m[3] ? parseInt(m[3], 10) : 0;
    if (hh > 23 || mm > 59) return null;
    const at = new Date(now);
    if (isTomorrow) at.setDate(at.getDate() + 1);
    at.setHours(hh, mm, 0, 0);
    if (!isTomorrow && at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
    const label = at.toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    return { at: at.getTime(), label };
  }
  return null;
}

const fmtTime = (ts) =>
  new Date(ts).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

module.exports = { parseRemindTime, fmtTime };
