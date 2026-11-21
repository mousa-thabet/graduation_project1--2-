// البث المباشر في التواصل: بث تجريبي شغال الآن، ورسائل دردشة تجريبية
// البث منشور من نوع "live" يظهر في الرئيسية مثل باقي المنشورات
// live: { status: "live" أو "ended", startedAt, endedAt }
// الصوت والصورة من الآخرين يحتاجان باك إند (WebRTC)، فالمشاهدة هنا محاكاة

import { withBadges } from "./badges.js";

const minutesAgo = (minutes) => Date.now() - minutes * 60 * 1000;

const LEEN = withBadges({ id: "p1", name: "لين", handle: "leen.focus" });

export const LIVE_POSTS = [
  {
    id: "live-1",
    type: "live",
    communityId: "ai",
    branchId: "llms",
    tags: ["LLMs", "Transformers"],
    author: LEEN,
    createdAt: minutesAgo(12),
    text: "شرح الـ Transformers من الصفر، وبعدها أسئلة وأجوبة 🎙️",
    live: { status: "live", startedAt: minutesAgo(12) },
    media: null,
    likes: 41,
    reports: 0,
    comments: [],
  },
];

// رسائل تجريبية تصل للدردشة أثناء البث (من أشخاص التواصل)
export const LIVE_CHAT_MESSAGES = [
  "السلام عليكم 👋",
  "الصوت واضح 👍",
  "ممكن تعيدي آخر نقطة؟",
  "شرح رائع، شكرًا!",
  "رح يكون في تسجيل للبث؟",
  "فهمت هلأ ليش بنستخدم attention 🔥",
  "في مصدر بتنصحوا فيه للبداية؟",
  "متابعين من الجامعة الأردنية 🙌",
  "🔥🔥🔥",
  "سؤال: الفرق بين encoder و decoder؟",
];