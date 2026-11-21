import { CURRENT_USER } from "./currentUser.js";

// قبل كم يوم انضم الشخص
const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

// كل الأشخاص (بيانات تجريبية إلى أن يجهز الباك إند)
// followsMe: هل يتابعني هذا الشخص  •  follows: أرقام الأشخاص الذين يتابعهم
// pinnedPostId: منشوره المثبّت في حسابه  •  studyMinutes / streak: إحصائيات دراسته
export const PEOPLE = [
  {
    id: "p1",
    name: "لين",
    handle: "leen.focus",
    bio: "طالبة هندسة برمجيات 💻 بحب الدراسة مع صوت المطر وبعزف بيانو بالاستراحة #تركيز",
    university: "جامعة النجاح الوطنية",
    location: "نابلس",
    website: "",
    joinedAt: daysAgo(210),
    verified: true,
    followsMe: true,
    follows: ["p2", "p3"],
    pinnedPostId: "post-5",
    studyMinutes: 4820,
    streak: 12,
  },
  {
    id: "p2",
    name: "Omar",
    handle: "omar_codes",
    bio: "CS student · React & databases · I share study tips every week #focus",
    university: "Birzeit University",
    location: "Ramallah",
    website: "https://github.com",
    joinedAt: daysAgo(400),
    verified: true,
    followsMe: false,
    follows: ["p1"],
    pinnedPostId: "post-3",
    studyMinutes: 9150,
    streak: 30,
  },
  {
    id: "p3",
    name: "رهف",
    handle: "rahaf.db",
    bio: "قواعد بيانات وقهوة ☕ بشارك إنجازاتي اليومية عشان أضل ملتزمة #إنجاز",
    university: "الجامعة العربية الأمريكية",
    location: "جنين",
    website: "",
    joinedAt: daysAgo(95),
    verified: false,
    followsMe: true,
    follows: ["p1", "p2"],
    pinnedPostId: null,
    studyMinutes: 2310,
    streak: 6,
  },
  {
    id: "p4",
    name: "يزن",
    handle: "yazan99",
    bio: "",
    university: "",
    location: "",
    website: "",
    joinedAt: daysAgo(3),
    verified: false,
    followsMe: false,
    follows: [],
    pinnedPostId: null,
    studyMinutes: 0,
    streak: 0,
  },
];

// اقتراحات للمتابعة في العمود الجانبي
export const SUGGESTED_PEOPLE = PEOPLE.filter((person) => ["p1", "p2", "p3"].includes(person.id));

export function findPersonByHandle(handle) {
  return PEOPLE.find((person) => person.handle === handle) ?? null;
}

// رابط حساب الشخص: حسابي على /profile، والآخرون على /profile/اسم_المستخدم
export function profilePath(handle) {
  return handle === CURRENT_USER.handle ? "/profile" : `/profile/${handle}`;
}