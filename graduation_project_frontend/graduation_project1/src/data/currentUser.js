import { AUTH_KEY } from "../hooks/useAuth.js";

// المستخدم الحالي: مأخوذ من الحساب اللي سجّل فيه (تجريبي إلى أن يجهز تسجيل الدخول بالباك إند)
// الاسم والـ handle بينقروا كل مرة من جديد (getters)، فبعد ما يسجّل دخول بحساب ثاني بيتغيروا فورًا

// إذا ما في حساب (ما بيصير جوّا الأقسام لأنها محمية، بس احتياط)
const FALLBACK = "student";

// اسم الحساب كما كتبه: اسم مستخدم، أو إيميل فبناخد اللي قبل @
function readAccountName() {
  try {
    const account = JSON.parse(localStorage.getItem(AUTH_KEY))?.account ?? "";
    return String(account).trim().split("@")[0];
  } catch {
    // بيانات تالفة: كأنه ما في حساب
    return "";
  }
}

// الـ handle: أحرف إنجليزية صغيرة وأرقام و _ و . بس (نفس شروط اسم المستخدم بالتسجيل)
function toHandle(name) {
  return name.toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

export const CURRENT_USER = {
  id: "me",
  get name() {
    return readAccountName() || FALLBACK;
  },
  get handle() {
    return toHandle(readAccountName()) || FALLBACK;
  },
};