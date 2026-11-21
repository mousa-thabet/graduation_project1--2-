// منشورات تجريبية لقسم ادرس معي
// النصوص محتوى يكتبه المستخدمون، لذلك لا تُترجم

const minutesAgo = (minutes) => Date.now() - minutes * 60 * 1000;

export const STUDY_POSTS = [
  {
    id: "post-1",
    author: { id: "p1", name: "لين", handle: "leen.focus" },
    createdAt: minutesAgo(12),
    text: "صوت المطر مع مؤقت 50/10 غيّر طريقة دراستي بالكامل، جربوه اليوم #تركيز",
    media: { type: "video", src: "/videos/study.mp4" },
    likes: 128,
    reports: 0,
    comments: [
      {
        id: "c1",
        author: { id: "p2", name: "Omar", handle: "omar_codes" },
        createdAt: minutesAgo(8),
        text: "جربته امبارح، فعلًا بيفرق 👌",
        likes: 3,
        reports: 0,
      },
      // ردّ على التعليق c1
      {
        id: "c2",
        parentId: "c1",
        replyTo: "omar_codes",
        author: { id: "p1", name: "لين", handle: "leen.focus" },
        createdAt: minutesAgo(6),
        text: "مبسوطة إنه فادك 😄",
        likes: 1,
        reports: 0,
      },
      // تعليق مزعج عليه بلاغان (البلاغ الثالث يخفيه)
      {
        id: "c3",
        author: { id: "p4", name: "يزن", handle: "yazan99" },
        createdAt: minutesAgo(4),
        text: "اربح 100$ يوميًا!! الرابط بحسابي 💸💸",
        likes: 0,
        reports: 2,
      },
    ],
  },
  {
    id: "post-2",
    kind: "achievement",
    author: { id: "p3", name: "رهف", handle: "rahaf.db" },
    createdAt: minutesAgo(45),
    text: "خلصت فصل التطبيع بقواعد البيانات أخيرًا، شكرًا @omar_codes على الشرح #إنجاز",
    achievement: { minutes: 150, task: "مراجعة التطبيع (Normalization)", streak: 6 },
    likes: 64,
    reports: 0,
    comments: [],
  },
  // منشور فيه استطلاع
  {
    id: "post-6",
    author: { id: "p3", name: "رهف", handle: "rahaf.db" },
    createdAt: minutesAgo(90),
    text: "شو أحسن وقت للدراسة عندكم؟ صوّتوا معنا #تركيز",
    poll: {
      options: [
        { id: "o1", text: "الصبح بكير", votes: 42 },
        { id: "o2", text: "بعد الظهر", votes: 18 },
        { id: "o3", text: "بالليل", votes: 57 },
      ],
    },
    likes: 33,
    reports: 0,
    comments: [],
  },
  {
    id: "post-3",
    author: { id: "p2", name: "Omar", handle: "omar_codes" },
    createdAt: minutesAgo(130),
    text: "Tip: put your phone in another room before you start. Best focus hack I know. #focus",
    likes: 210,
    reports: 0,
    comments: [],
  },
  {
    id: "post-4",
    author: { id: "p4", name: "يزن", handle: "yazan99" },
    createdAt: minutesAgo(200),
    text: "حدا بدو يشتري حسابات ألعاب رخيصة؟ راسلوني خاص!!!",
    likes: 2,
    reports: 2,
    comments: [],
  },
  {
    id: "post-5",
    author: { id: "p1", name: "لين", handle: "leen.focus" },
    createdAt: minutesAgo(380),
    text: "لحن هادئ عزفته على البيانو بعد الامتحان، بتمنى يساعدكم ترتاحوا #لحن #استرخاء",
    // ضع أي ملف صوتي في public/audio/melody.mp3
    media: { type: "audio", src: "/audio/melody.mp3", name: "لحن هادئ - بيانو" },
    likes: 95,
    reports: 0,
    comments: [],
  },
];

// الوسوم المقترحة عند الكتابة
export const SUGGESTED_TAGS = ["تركيز", "استرخاء", "لحن", "إنجاز"];

// عدد البلاغات الذي يُرسل المنشور أو التعليق إلى مراجعة الإدارة
export const REPORT_LIMIT = 3;

// أقصى عدد أحرف للمنشور (عند النشر والتعديل)
export const MAX_POST_LENGTH = 280;