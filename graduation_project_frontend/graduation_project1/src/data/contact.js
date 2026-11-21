// معلومات التواصل مع فريق المنصة (الدعم الفني)
// ⚠️ حط رقم الواتساب الرسمي هون: مفتاح الدولة بدون + وبدون صفر البداية (مثال الأردن: 9627XXXXXXXX)
export const WHATSAPP_NUMBER = "962700000000";

// رابط واتساب جاهز مع رسالة أولى (wa.me بيفتح التطبيق على الموبايل، والموقع على الكمبيوتر)
export function whatsappUrl(message = "") {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${WHATSAPP_NUMBER}${text}`;
}

// تاريخ آخر تحديث لسياسة الاستخدام والخصوصية
export const PRIVACY_UPDATED_AT = "2026-11-09";