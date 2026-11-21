// بيانات تجريبية للبثوث إلى أن يجهز الباك إند
// العناوين والأسماء والرسائل محتوى يكتبه المستخدمون، لذلك لا تُترجم

// تقسيمات المؤقت المشترك للبث (دقائق تركيز / استراحة)
export const STREAM_PLANS = [
  { id: "25-5", focus: 25, break: 5 },
  { id: "50-10", focus: 50, break: 10 },
  { id: "90-15", focus: 90, break: 15 },
];

const minutesAgo = (minutes) => Date.now() - minutes * 60 * 1000;
const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

// كتّاب البثوث (نفس أشخاص المنشورات حتى يفتح الاسم حسابهم)
const LEEN = { id: "p1", name: "لين", handle: "leen.focus" };
const OMAR = { id: "p2", name: "Omar", handle: "omar_codes" };
const RAHAF = { id: "p3", name: "رهف", handle: "rahaf.db" };

/**
 * البثوث المباشرة الآن.
 * host: صاحب البث  •  participants: من فتح الكاميرا أو المايك معه  •  viewers: من يتفرج فقط
 * timer: المؤقت المشترك، يبدأ من startedAt  •  video: فيديو تجريبي بدل البث الحقيقي
 * thumbnail: صورة الواجهة (مثل يوتيوب). null ← نعرض لقطة من الفيديو، أو غلافًا افتراضيًا
 */
export const LIVE_ROOMS = [
  {
    id: "room-1",
    title: "مراجعة هياكل البيانات قبل الامتحان",
    host: LEEN,
    startedAt: minutesAgo(42),
    timer: { focus: 50, break: 10 },
    isRecorded: true,
    thumbnail: null,
    video: "/videos/study.mp4",
    viewers: 37,
    participants: [
      { id: "u2", name: "سارة", mic: false, cam: true },
      { id: "u3", name: "يوسف", mic: false, cam: false },
    ],
  },
  {
    id: "room-2",
    title: "React hooks — silent study",
    host: OMAR,
    startedAt: minutesAgo(27),
    timer: { focus: 25, break: 5 },
    isRecorded: false,
    thumbnail: null,
    video: "/videos/social.mp4",
    viewers: 18,
    participants: [{ id: "u5", name: "Dana", mic: false, cam: true }],
  },
  {
    id: "room-3",
    title: "تصميم قواعد البيانات - مشروع التخرج",
    host: RAHAF,
    startedAt: minutesAgo(78),
    timer: { focus: 50, break: 10 },
    isRecorded: true,
    thumbnail: null,
    video: null,
    viewers: 9,
    participants: [
      { id: "u7", name: "محمد", mic: false, cam: true },
      { id: "u8", name: "دانة", mic: false, cam: false },
      { id: "u9", name: "Ali", mic: true, cam: true },
    ],
  },
];

/**
 * بثوث مسجّلة انتهت (تُشاهد في أي وقت).
 * duration بالدقائق  •  src: الفيديو (تجريبي)  •  thumbnail: صورة الواجهة
 */
export const RECORDED_STREAMS = [
  {
    id: "rec-1",
    title: "حل أسئلة سنوات سابقة - خوارزميات",
    host: LEEN,
    endedAt: daysAgo(1),
    duration: 95,
    views: 412,
    likes: 58,
    thumbnail: null,
    src: "/videos/study.mp4",
  },
  {
    id: "rec-2",
    title: "Build a REST API with Express — study with me",
    host: OMAR,
    endedAt: daysAgo(3),
    duration: 120,
    views: 1290,
    likes: 211,
    thumbnail: null,
    src: "/videos/social.mp4",
  },
  {
    id: "rec-3",
    title: "تصميم شاشة تسجيل الدخول بـ Figma",
    host: RAHAF,
    endedAt: daysAgo(6),
    duration: 60,
    views: 233,
    likes: 41,
    thumbnail: null,
    src: "/videos/plan.mp4",
  },
];

// أشخاص ينضمون تلقائيًا إلى البث الذي تفتحه (محاكاة)
export const DEMO_JOINERS = [
  { id: "d1", name: "ريم", mic: false, cam: true },
  { id: "d2", name: "Khaled", mic: false, cam: false },
  { id: "d3", name: "نور", mic: true, cam: true },
];

// رسائل تجريبية تصل في الدردشة وقت الاستراحة
export const DEMO_MESSAGES = [
  "خلصت فصل كامل الحمدلله 💪",
  "حدا عنده تلخيص للمحاضرة الثالثة؟",
  "استراحة قهوة ☕",
  "الجولة الجاية رح أحل أسئلة",
  "Great session, thanks!",
  "كم ضايل للامتحان عندكم؟",
  "شكرًا على البث، بيحمّس 🔥",
];

// تفاعلات سريعة تطير فوق البث
export const REACTIONS = ["👏", "🔥", "💪", "❤️", "☕"];