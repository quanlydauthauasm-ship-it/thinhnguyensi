// Hỏi AI (Gemini) — systemText quyết định "tính cách" trả lời.
// Mặc định dùng prompt trợ lý riêng; chế độ học viên truyền prompt riêng vào.
const { OWNER_SYSTEM_PROMPT } = require('./config');

async function askGemini(prompt, systemText) {
  const key = process.env.GEMINI_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const sys = systemText || OWNER_SYSTEM_PROMPT;
  if (!key) return 'Em chưa được gắn key Gemini nên chưa trả lời bằng AI được. Anh thêm GEMINI_KEY trong phần Environment Variables của Vercel rồi deploy lại nhé.';
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
        }),
      }
    );
    const j = await r.json();
    const text = j.candidates && j.candidates[0] &&
      j.candidates[0].content && j.candidates[0].content.parts
      ? j.candidates[0].content.parts.map(p => p.text || '').join('') : '';
    if (text) return text;
    console.error('Gemini lỗi:', JSON.stringify(j).slice(0, 300));
    return 'Em gọi AI bị lỗi, anh thử lại sau vài giây nhé.';
  } catch (e) {
    console.error('Gemini exception:', e.message);
    return 'Mạng gọi AI đang trục trặc, anh thử lại sau nhé.';
  }
}

module.exports = { askGemini };
