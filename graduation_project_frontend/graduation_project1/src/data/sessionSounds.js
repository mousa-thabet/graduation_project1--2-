// أصوات المنصة: كلها مولَّدة داخل المتصفح (recipe) فلا تحتاج ملفات
export const SESSION_SOUNDS = [
  { id: "rain", icon: "cloudRain", recipe: "rain" },
  { id: "waves", icon: "waves", recipe: "waves" },
  { id: "wind", icon: "wind", recipe: "wind" },
  { id: "fire", icon: "flame", recipe: "fire" },
  { id: "stream", icon: "waves", recipe: "stream" },
  { id: "brown", icon: "radio", recipe: "brown" },
  { id: "white", icon: "radio", recipe: "white" },
];

// أصوات رفعها طلبة ووافقت عليها الإدارة (تجريبية، لذلك مولَّدة أيضًا)
// الاسم محتوى كتبه الطالب، لذلك لا يُترجم
export const COMMUNITY_SOUNDS = [
  {
    id: "c-forest",
    name: "جدول ماء في الغابة",
    uploader: { name: "لين", handle: "leen.focus" },
    icon: "waves",
    recipe: "stream",
  },
  {
    id: "c-library",
    name: "Night rain on the library window",
    uploader: { name: "Omar", handle: "omar_codes" },
    icon: "cloudRain",
    recipe: "rain",
  },
  {
    id: "c-cabin",
    name: "مدفأة كوخ هادئ",
    uploader: { name: "رهف", handle: "rahaf.db" },
    icon: "flame",
    recipe: "fire",
  },
];