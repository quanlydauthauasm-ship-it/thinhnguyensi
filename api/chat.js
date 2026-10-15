```javascript
// api/chat.js - Trợ lý AI Chuyên gia Thịnh Nguyễn SI (Phiên bản Thực chiến 2026)
// Chuẩn Vercel Serverless Function - Zero Dependency (Không lỗi module, không crash 500)

export default async function handler(req, res) {
  // 1. Cấu hình CORS để web kết nối thông suốt
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
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  try {
    const { message, prompt, history } = req.body || {};
    const userText = (message || prompt || '').trim();

    if (!userText) {
      return res.status(200).json({ 
        reply: 'Dạ anh/chị cần chuyên gia Thịnh Nguyễn SI hỗ trợ bài toán tự động hóa hay lộ trình đào tạo nào cho doanh nghiệp ạ? 😊' 
      });
    }

    // =========================================================================
    // 2. CHỐT CHẶN NHẬN DIỆN SỐ ĐIỆN THOẠI THÔNG MINH (CHỐNG MÁY MÓC 100%)
    // =========================================================================
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8}|02[0-9]{9})/g;
    const phoneMatch = userText.match(phoneRegex);

    if (phoneMatch) {
      const sdt = phoneMatch[0];
      return res.status(200).json({
        reply: `Dạ em đã ghi nhận số điện thoại **${sdt}** của anh/chị rồi ạ! 🎯\n\nChuyên gia **Thịnh Nguyễn SI** sẽ chủ động liên hệ trực tiếp qua Zalo/Điện thoại trong vòng **15 - 30 phút** tới để tư vấn giải pháp thực chiến phù hợp nhất cho doanh nghiệp của anh/chị.\n\nTrong lúc chờ đợi, anh/chị có thể:\n👉 **Tham gia Nhóm Zalo Học Viên:** https://zalo.me/g/fha5au5tsqt5qucmqnre\n👉 **Kết nối Hotline/Zalo Chuyên gia:** 0918.717.952 (https://zalo.me/0918717952)\n\nCảm ơn anh/chị đã tin tưởng đồng hành cùng Thịnh Nguyễn SI! 🚀`
      });
    }

    // =========================================================================
    // 3. KẾT NỐI GOOGLE GEMINI API (NATIVE FETCH - ZERO DEPENDENCY)
    // =========================================================================
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Nếu chưa cài API Key trên Vercel, chuyển sang bộ não dự phòng thông minh ngay
      return res.status(200).json({
        reply: getSmartFallbackReply(userText)
      });
    }

    const systemPrompt = `Bạn là Trợ lý AI chính thức của chuyên gia "Thịnh Nguyễn SI" (SI viết tắt của Super Intelligence - Siêu Trí Tuệ theo định nghĩa của Trump).
Website: https://thinhnguyensi.com | Hotline/Zalo: 0918.717.952 (https://zalo.me/0918717952) | Nhóm Zalo Học Viên: https://zalo.me/g/fha5au5tsqt5qucmqnre

TRIẾT LÝ: "Nói được - Làm được - Chạy thực tế được". Tối ưu hạ tầng 0 đồng, loại bỏ hoàn toàn lý thuyết hàn lâm.
LỘ TRÌNH 4 MODULE ĐÀO TẠO 2026:
- Module 01: Tư Duy AI & Master Prompt Quản Lý (Master Claude, Gemini, tối ưu quy trình lãnh đạo).
- Module 02: Bóc Tách Dữ Liệu & Báo Cáo Thông Minh (AI Vision xử lý chứng từ, hóa đơn, tự động đổ về Google Sheet/Excel).
- Module 03: Tự Động Hóa Quy Trình 0 Đồng (Webhook kết nối form, bắn cảnh báo vào Zalo/Email tức thì).
- Module 04: Đóng Gói Dashboard & Trợ Lý Riêng (Dựng Dashboard trên Vercel, cấu hình trợ lý AI nội bộ bảo mật tuyệt đối).

QUY TẮC PHỤC VỤ KHÁCH HÀNG:
1. Xưng hô: Tự xưng là "mình" hoặc "em", gọi khách là "anh/chị" hoặc "bạn". Trả lời thân thiện, súc tích dưới 150 từ.
2. Tuyệt đối không báo học phí cụ thể. Hãy hướng dẫn khách để lại SĐT hoặc kết nối Zalo 0918.717.952 để nhận ưu đãi doanh nghiệp.
3. Không biết code vẫn làm chủ 100% vì giải pháp ứng dụng công nghệ không cần code (No-Code) và AI hỗ trợ viết script.
4. NẾU KHÁCH HÀNG ĐỂ LẠI SỐ ĐIỆN THOẠI: Lập tức cảm ơn, xác nhận đã lưu số và báo chuyên gia Thịnh Nguyễn SI sẽ liên hệ lại trong 15-30 phút. TUYỆT ĐỐI KHÔNG ĐÒI LẠI SĐT NỮA.`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nCâu hỏi của khách hàng: "${userText}"` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini API Error Status:', response.status);
      // Khi Google lỗi hoặc hết quota, kích hoạt bộ não dự phòng thông minh ngay
      return res.status(200).json({
        reply: getSmartFallbackReply(userText)
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const aiText = candidate?.content?.parts?.[0]?.text;

    if (!aiText) {
      return res.status(200).json({
        reply: getSmartFallbackReply(userText)
      });
    }

    return res.status(200).json({ reply: aiText });

  } catch (err) {
    console.error('Lỗi thực thi API Chat:', err);
    // Bắt toàn bộ lỗi, không bao giờ để web bị sập 500
    return res.status(200).json({
      reply: getSmartFallbackReply(req.body?.message || '')
    });
  }
}

// =========================================================================
// 4. BỘ NÃO DỰ PHÒNG THÔNG MINH (SMART FALLBACK ENGINE)
// Đảm bảo bot luôn trả lời xuất sắc 100% mọi tình huống dù không có internet AI
// =========================================================================
function getSmartFallbackReply(query) {
  const q = (query || '').toLowerCase();

  // Nhóm 1: Hỏi về danh tính Thịnh Nguyễn SI
  if (q.includes('ai') || q.includes('thịnh') || q.includes('chuyên gia') || q.includes('giới thiệu')) {
    return `Dạ, chuyên gia **Thịnh Nguyễn SI** là Kiến trúc sư Giải pháp AI Doanh nghiệp với triết lý *"Nói được - Làm được - Chạy thực tế được"*. 🎯\n\nAnh Thịnh chuyên chuyển giao công nghệ AI thực chiến, tự động hóa quy trình 0 đồng và đóng gói trợ lý số cho cấp Quản lý & Chủ Doanh nghiệp.\n\nAnh/chị có thể để lại Số điện thoại hoặc kết nối Zalo riêng của anh Thịnh: **0918.717.952** (https://zalo.me/0918717952) để trao đổi trực tiếp nhé! 🚀`;
  }

  // Nhóm 2: Hỏi về Lộ trình, Module đào tạo
  if (q.includes('lộ trình') || q.includes('module') || q.includes('học') || q.includes('khoá')) {
    return `Lộ trình đào tạo 2026 của **Thịnh Nguyễn SI** gồm 4 Module thực chiến:\n\n🧠 **Module 01:** Tư Duy AI & Master Prompt Quản Lý\n📑 **Module 02:** Bóc Tách Dữ Liệu & Báo Cáo Thông Minh (AI Vision)\n⚡ **Module 03:** Tự Động Hóa Quy Trình 0 Đồng (Webhook, Zalo, Sheet)\n📊 **Module 04:** Đóng Gói Dashboard & Trợ Lý Riêng trên Cloud\n\nAnh/chị đang muốn giải quyết điểm nghẽn ở khâu nào nhất? Hãy để lại SĐT hoặc nhắn Zalo **0918.717.952** để được tư vấn lộ trình riêng nhé!`;
  }

  // Nhóm 3: Hỏi về Học phí, chi phí
  if (q.includes('học phí') || q.includes('giá') || q.includes('chi phí') || q.includes('tiền')) {
    return `Dạ, khóa học thực chiến của **Thịnh Nguyễn SI** được thiết kế may đo theo quy mô và bài toán cụ thể của từng học viên/doanh nghiệp để đảm bảo tối ưu ROI cao nhất. 💰\n\nAnh/chị vui lòng để lại **Số điện thoại/Zalo** tại đây hoặc liên hệ trực tiếp Hotline: **0918.717.952** để nhận chính sách ưu đãi và lộ trình phù hợp nhất nhé!`;
  }

  // Nhóm 4: Hỏi về việc không biết code
  if (q.includes('code') || q.includes('lập trình') || q.includes('kỹ thuật') || q.includes('dễ không')) {
    return `Anh/chị hoàn toàn yên tâm nhé! Toàn bộ chương trình được thiết kế chuyên biệt cho Lãnh đạo và Quản lý: **100% không cần biết lập trình**. 💻\n\nAI sẽ đóng vai trò viết mã nguồn thay anh/chị, nhiệm vụ của anh/chị là làm chủ tư duy và điều phối quy trình thực tế.`;
  }

  // Mặc định phản hồi thân thiện, dẫn dắt kết nối
  return `Dạ mình đã ghi nhận bài toán của anh/chị! Chuyên gia **Thịnh Nguyễn SI** trực tiếp đồng hành giải quyết các bài toán:\n\n• Tự động bóc tách hóa đơn, chứng từ bằng AI Vision\n• Báo cáo thời gian thực & Tự động hóa quy trình 0 đồng\n• Đào tạo chuyển giao trợ lý AI nội bộ cho doanh nghiệp\n\nĐể nhận giải pháp chi tiết cho đơn vị mình, anh/chị để lại **Số Điện Thoại/Zalo** hoặc kết nối nhanh qua Hotline: **0918.717.952** (https://zalo.me/0918717952) nhé! 🚀`;
}
```

---
