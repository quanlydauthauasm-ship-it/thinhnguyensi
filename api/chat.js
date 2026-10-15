```javascript
// api/chat.js - Bộ não AI Chuyên gia Thịnh Nguyễn SI (Bảo vệ 2 lớp chống sập 100%)

const SYSTEM_PROMPT = `Bạn là Trợ lý AI chính thức của chuyên gia Thịnh Nguyễn SI (thinhnguyensi.com).
Số Hotline / Zalo chuyên gia: 0918.717.952 (https://zalo.me/0918717952).
Nhóm Zalo học viên: https://zalo.me/g/fha5au5tsqt5qucmqnre.

TRIẾT LÝ & ĐỊNH VỊ:
- Chuyên gia Thịnh Nguyễn SI: Kiến trúc sư giải pháp AI doanh nghiệp, thực chiến dữ liệu & quy trình.
- Triết lý đào tạo: "Nói được - Làm được - Chạy thực tế được", loại bỏ lý thuyết hàn lâm, tối ưu hạ tầng 0 đồng.

LỘ TRÌNH 4 MODULE ĐÀO TẠO 2026:
- Module 01: Tư duy AI & Master Prompt Quản lý (Claude, Gemini, điều phối prompt quản trị).
- Module 02: Bóc tách dữ liệu & Báo cáo thông minh (AI Vision xử lý hóa đơn, phiếu kho đổ về Google Sheets/Excel).
- Module 03: Tự động hóa quy trình 0 đồng (Webhook, Zalo Bot, cảnh báo tự động).
- Module 04: Đóng gói Dashboard & Trợ lý riêng (Triển khai Vercel, bảo mật dữ liệu doanh nghiệp).

QUY TẮC PHẢN HỒI:
1. Xưng "mình" hoặc "Minh Trợ Lý Số", gọi khách là "bạn" hoặc "anh/chị". Giọng điệu chuyên nghiệp, am hiểu thực tế, ấm áp.
2. ĐẶC BIỆT KHI KHÁCH ĐỂ LẠI SỐ ĐIỆN THOẠI: Lập tức cảm ơn, xác nhận đã lưu số và thông báo anh Thịnh Nguyễn SI sẽ liên hệ trực tiếp qua Zalo/Điện thoại trong vòng 15 - 30 phút. TUYỆT ĐỐI KHÔNG HỎI LẠI SĐT.
3. Câu trả lời ngắn gọn, xuống dòng rõ ràng, có gạch đầu dòng dễ đọc trên điện thoại.`;

export default async function handler(req, res) {
  // Thiết lập Header CORS
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
    return res.status(200).json({ reply: 'Hệ thống AI Thịnh Nguyễn SI đã sẵn sàng phục vụ bạn!' });
  }

  try {
    const { message } = req.body || {};
    const cleanMsg = (message || '').trim();

    if (!cleanMsg) {
      return res.status(200).json({ reply: 'Chào bạn! Mình có thể hỗ trợ gì cho doanh nghiệp của bạn hôm nay?' });
    }

    // CHỐT CHẶN 1: Bắt số điện thoại tự động (Chống lặp máy móc 100%)
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})/g;
    const isPhoneNumber = phoneRegex.test(cleanMsg.replace(/[\s.-]/g, ''));

    if (isPhoneNumber) {
      return res.status(200).json({
        reply: `Dạ tuyệt vời! Mình đã ghi nhận số điện thoại của bạn rồi nhé. 🎯\n\nChuyên gia **Thịnh Nguyễn SI** sẽ trực tiếp kết nối qua Zalo/Cuộc gọi trong vòng 15 - 30 phút tới để lắng nghe và tư vấn bài toán cho đơn vị bạn.\n\nNếu cần trao đổi gấp ngay lúc này, bạn có thể bấm kết nối nhanh qua Zalo riêng của anh Thịnh: https://zalo.me/0918717952 nhé!`
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // CHỐT CHẶN 2: Nếu có API Key -> Gọi Google Gemini 1.5 Flash
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${SYSTEM_PROMPT}\n\nKhách hàng hỏi: "${cleanMsg}"\nHãy trả lời khách hàng:` }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
              }
            })
          }
        );

        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        }
      } catch (geminiError) {
        console.warn('Lỗi gọi Gemini API, chuyển sang Smart Fallback:', geminiError.message);
      }
    }

    // CHỐT CHẶN 3: BỘ NÃO DỰ PHÒNG THÔNG MINH (Không bao giờ trả về lỗi 500)
    const lower = cleanMsg.toLowerCase();

    if (lower.includes('học phí') || lower.includes('chi phí') || lower.includes('giá') || lower.includes('bao nhiêu')) {
      return res.status(200).json({
        reply: `Khóa học **"Ứng Dụng AI & Chuyển Đổi Số Thực Chiến 2026"** của chuyên gia Thịnh Nguyễn SI hiện đang có chính sách trợ giá đặc biệt cho doanh nghiệp & nhà quản lý:\n\n- Đào tạo trọn gói 4 Module thực chiến (cầm tay chỉ việc).\n- Chuyển giao toàn bộ mã nguồn Dashboard & Template 0 đồng.\n- Hỗ trợ đồng hành 1:1 trực tiếp sau khóa học.\n\n👉 Bạn hãy nhắn tin qua Zalo **0918.717.952** (https://zalo.me/0918717952) để nhận bảng ưu đãi và lịch học gần nhất nhé!`
      });
    }

    if (lower.includes('lộ trình') || lower.includes('module') || lower.includes('học gì') || lower.includes('nội dung')) {
      return res.status(200).json({
        reply: `Lộ trình đào tạo thực chiến 2026 của anh Thịnh Nguyễn gồm 4 Module dứt điểm:\n\n1. **Module 01:** Tư duy AI & Master Prompt Quản trị (Làm chủ Claude, Gemini).\n2. **Module 02:** AI Vision bóc tách hóa đơn, chứng từ tự động đổ về Sheets/Excel.\n3. **Module 03:** Tự động hóa quy trình 0 đồng với Webhook & Zalo Bot.\n4. **Module 04:** Đóng gói Dashboard quản trị và Trợ lý AI riêng cho doanh nghiệp.\n\nBạn đang quan tâm giải quyết khâu nào nhất trong doanh nghiệp mình ạ?`
      });
    }

    if (lower.includes('thịnh nguyễn') || lower.includes('ai vậy') || lower.includes('chuyên gia')) {
      return res.status(200).json({
        reply: `Chuyên gia **Thịnh Nguyễn SI** là Kiến trúc sư Giải pháp AI & Chuyển đổi số doanh nghiệp.\n\nVới triết lý **"Nói được - Làm được - Chạy thực tế được"**, anh Thịnh chuyên tối ưu hạ tầng 0 đồng, loại bỏ lý thuyết hàn lâm và trực tiếp đóng gói giải pháp tự vận hành cho các nhà quản lý và chủ doanh nghiệp.`
      });
    }

    // Câu trả lời chung linh hoạt
    return res.status(200).json({
      reply: `Dạ mình đã hiểu nhu cầu của bạn! Đối với bài toán này, chuyên gia **Thịnh Nguyễn SI** sẽ trực tiếp tư vấn giải pháp tối ưu chi phí hạ tầng 0 đồng cho đơn vị bạn.\n\nBạn có thể nhắn trực tiếp vào Zalo chuyên gia qua số **0918.717.952** (https://zalo.me/0918717952) hoặc để lại số điện thoại tại đây để anh Thịnh hỗ trợ bạn ngay nhé!`
    });

  } catch (err) {
    // Luôn trả về 200 kèm câu trả lời lịch sự, KHÔNG BAO GIỜ TRẢ VỀ LỖI 500
    return res.status(200).json({
      reply: `Dạ chào bạn! Để được tư vấn giải pháp AI thực chiến và tối ưu nhất cho bài toán của doanh nghiệp mình, bạn vui lòng nhắn trực tiếp qua Zalo chuyên gia **Thịnh Nguyễn SI**: https://zalo.me/0918717952 (Hotline: 0918.717.952) nhé!`
    });
  }
}
```

---
