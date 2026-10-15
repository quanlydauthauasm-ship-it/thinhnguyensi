```javascript
// api/chat.js - Bộ não AI Trợ lý Thịnh Nguyễn SI (Zero-Dependency & Multi-Fallback)
export default async function handler(req, res) {
  // Cấu hình CORS mở rộng cho mọi domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ reply: 'Trợ lý AI Thịnh Nguyễn SI sẵn sàng hỗ trợ bạn 24/7!' });
  }

  try {
    const { message } = req.body || {};
    const text = (message || '').trim();

    if (!text) {
      return res.status(200).json({ reply: 'Chào bạn! Mình có thể hỗ trợ gì cho bạn về giải pháp AI và tự động hóa hôm nay ạ?' });
    }

    const lower = text.toLowerCase();

    // 1. CHỐT CHẶN: KHÁCH NHẬP SỐ ĐIỆN THOẠI
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})\b/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      const sdt = phoneMatch[0];
      return res.status(200).json({
        reply: `Dạ em đã ghi nhận số điện thoại **${sdt}** của anh/chị rồi ạ! Chuyên gia Thịnh Nguyễn SI sẽ trực tiếp liên hệ lại qua Zalo/Điện thoại trong vòng 15 - 30 phút để hỗ trợ tư vấn giải pháp thực chiến cho mình. Cảm ơn anh/chị rất nhiều ạ!`
      });
    }

    // 2. CHỐT CHẶN: KHÁCH BÁO ĐÃ ĐIỀN FORM / ĐÃ ĐĂNG KÝ
    if (
      lower.includes('điền form') ||
      lower.includes('dien form') ||
      lower.includes('đã đăng ký') ||
      lower.includes('da dang ky') ||
      lower.includes('đăng ký rồi') ||
      lower.includes('gửi thông tin rồi')
    ) {
      return res.status(200).json({
        reply: `Dạ tuyệt vời quá ạ! Em đã đồng bộ thông tin của anh/chị từ Form đăng ký về hệ thống rồi. Chuyên gia Thịnh Nguyễn SI sẽ rà soát bài toán thực tế và kết nối lại ngay qua Zalo/Hotline **0918.717.952** trong hôm nay để trao đổi chi tiết nhé!`
      });
    }

    // 3. CHỐT CHẶN: KHÁCH XIN SĐT / ZALO CỦA CHUYÊN GIA THỊNH NGUYỄN
    if (
      lower.includes('sđt') ||
      lower.includes('sdt') ||
      lower.includes('số điện thoại') ||
      lower.includes('so dien thoai') ||
      lower.includes('hotline') ||
      lower.includes('zalo') ||
      lower.includes('liên hệ')
    ) {
      if (
        lower.includes('thịnh') ||
        lower.includes('chuyên gia') ||
        lower.includes('cho') ||
        lower.includes('xin') ||
        lower.includes('đâu') ||
        lower.includes('của')
      ) {
        return res.status(200).json({
          reply: `Dạ số Hotline và Zalo trực tiếp của chuyên gia Thịnh Nguyễn SI là: **0918.717.952** ạ! Anh/chị có thể gọi điện hoặc nhắn tin Zalo trực tiếp cho anh Thịnh bất cứ lúc nào để được hỗ trợ nhanh nhất nhé!`
        });
      }
    }

    // 4. KẾT NỐI GOOGLE GEMINI NẾU CÓ KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const systemPrompt = `Bạn là Trợ lý AI của Chuyên gia Thịnh Nguyễn SI (website thinhnguyensi.com).
Thông tin chuyên gia:
- Thịnh Nguyễn SI: Kiến Trúc Sư Giải Pháp AI Doanh Nghiệp, chuyên gia thực chiến dữ liệu và quy trình.
- Hotline/Zalo: 0918.717.952.
- Triết lý: "Nói được – Làm được – Chạy thực tế được", tối ưu hạ tầng 0 đồng, bảo mật dữ liệu tuyệt đối.
- 4 Module đào tạo:
  + Module 1: Tư Duy AI & Master Prompt Quản Lý.
  + Module 2: Bóc Tách Dữ Liệu & Báo Cáo Thông Minh (AI Vision xử lý hóa đơn, phiếu kho đổ về Sheet/Excel).
  + Module 3: Tự Động Hóa Quy Trình 0 Đồng (Webhook, cảnh báo Zalo/Email tức thì).
  + Module 4: Đóng Gói Dashboard & Trợ Lý Riêng trên Vercel.
- Khách không biết lập trình: Hoàn toàn làm được vì cầm tay chỉ việc, dùng No-code và công cụ trực quan.

Quy tắc trả lời:
- Luôn thân thiện, trả lời tự nhiên, xưng "em", gọi khách là "anh/chị".
- Trả lời đúng trọng tâm câu hỏi của khách, ngắn gọn 2 - 4 câu.
- Khách đã cho SĐT hoặc đã điền form: Tuyệt đối KHÔNG đòi lại SĐT nữa.
- Khách hỏi số điện thoại chuyên gia: Cung cấp Hotline/Zalo 0918.717.952.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nKhách hỏi: "${text}"\nTrả lời:` }]
                }
              ],
              generationConfig: {
                maxOutputTokens: 400,
                temperature: 0.7
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiReply) {
            return res.status(200).json({ reply: aiReply.trim() });
          }
        }
      } catch (err) {
        console.error('Lỗi gọi Gemini:', err);
      }
    }

    // 5. BỘ NÃO DỰ PHÒNG THÔNG MINH (KHI GEMINI NGHẼN HOẶC CHƯA CÓ KEY)
    let smartReply = 'Dạ em chào anh/chị! Chuyên gia Thịnh Nguyễn SI chuyên chuyển giao các giải pháp ứng dụng AI & tự động hóa quy trình thực chiến cho doanh nghiệp với chi phí tối ưu 0 đồng. Anh/chị đang cần giải quyết bài toán nào tại đơn vị mình ạ?';

    if (lower.includes('học phí') || lower.includes('giá') || lower.includes('chi phí') || lower.includes('bao nhiêu')) {
      smartReply = 'Dạ lộ trình 4 Module được may đo sát với bài toán thực tế của từng đơn vị. Anh/chị vui lòng để lại SĐT hoặc nhắn trực tiếp Hotline/Zalo **0918.717.952** để nhận khung học phí ưu đãi tốt nhất nhé!';
    } else if (lower.includes('module') || lower.includes('lộ trình') || lower.includes('nội dung') || lower.includes('học gì')) {
      smartReply = 'Dạ chương trình gồm 4 Module thực chiến: 1. Tư Duy AI & Master Prompt Quản Lý; 2. Bóc Tách Dữ Liệu Hóa Đơn/Phiếu Kho (AI Vision); 3. Tự Động Hóa Quy Trình 0 Đồng; 4. Đóng Gói Dashboard & Trợ Lý Riêng trên Vercel. Anh/chị quan tâm học phần nào nhất ạ?';
    } else if (lower.includes('code') || lower.includes('lập trình') || lower.includes('không biết')) {
      smartReply = 'Dạ hoàn toàn yên tâm ạ! Chương trình được thiết kế "Cầm tay chỉ việc", ứng dụng hoàn toàn công cụ trực quan và hạ tầng 0 đồng, không cần biết lập trình vẫn tự tay làm chủ và đóng gói hệ thống được ngay!';
    } else if (lower.includes('thịnh nguyễn là ai') || lower.includes('thịnh nguyễn si')) {
      smartReply = 'Dạ chuyên gia Thịnh Nguyễn SI là Kiến Trúc Sư Giải Pháp AI Doanh Nghiệp, chuyên gia thực chiến dữ liệu và quy trình, đồng hành cùng các đơn vị tối ưu vận hành theo triết lý "Nói được - Làm được - Chạy thực tế được".';
    }

    return res.status(200).json({ reply: smartReply });
  } catch (error) {
    return res.status(200).json({
      reply: 'Dạ em đã ghi nhận câu hỏi của anh/chị! Anh/chị có thể để lại SĐT hoặc liên hệ trực tiếp Hotline/Zalo **0918.717.952** để chuyên gia Thịnh Nguyễn SI tư vấn bài toán cho mình nhé!'
    });
  }
}
```

---
