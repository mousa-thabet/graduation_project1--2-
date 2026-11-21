// أدوات التحقق من الحقول
// كل دالة ترجع مفتاح رسالة الخطأ، أو نصًا فارغًا إذا كانت القيمة صحيحة

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

export function isEmail(value) {
  return EMAIL_PATTERN.test(value);
}

// اسم الحساب أو البريد الإلكتروني (صفحة الدخول)
export function validateAccount(value) {
  const account = value.trim();

  if (account === "") return "errors.accountRequired";

  if (account.includes("@")) {
    return isEmail(account) ? "" : "errors.emailInvalid";
  }

  return account.length >= MIN_USERNAME_LENGTH ? "" : "errors.accountShort";
}

// حقل إجباري
export function validateRequired(value, errorKey) {
  return value.trim() === "" ? errorKey : "";
}

// اسم الحساب: أحرف إنجليزية وأرقام و _ و . فقط
export function validateUsername(value) {
  const username = value.trim();

  if (username === "") return "errors.usernameRequired";
  if (!USERNAME_PATTERN.test(username)) return "errors.usernameInvalid";
  if (username.length < MIN_USERNAME_LENGTH) return "errors.accountShort";

  return "";
}

// البريد الإلكتروني
export function validateEmail(value) {
  const email = value.trim();

  if (email === "") return "errors.emailRequired";

  return isEmail(email) ? "" : "errors.emailInvalid";
}

// كلمة المرور: 8 أحرف على الأقل مع حرف كبير ورقم
export function validatePassword(value) {
  if (value === "") return "errors.passwordRequired";

  const isStrongEnough =
    value.length >= MIN_PASSWORD_LENGTH && /[A-Z]/.test(value) && /[0-9]/.test(value);

  return isStrongEnough ? "" : "errors.passwordWeak";
}

// تأكيد كلمة المرور
export function validateConfirmPassword(value, password) {
  if (value === "") return "errors.confirmRequired";

  return value === password ? "" : "errors.confirmMismatch";
}

// قوة كلمة المرور من 0 (فارغة) إلى 4 (قوية)
export function getPasswordStrength(password) {
  if (password === "") return 0;

  let score = 0;

  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.max(1, score);
}

// رمز التحقق: أرقام فقط وبالطول المطلوب
export function validateCode(code, length) {
  if (code === "") return "errors.codeRequired";

  return code.length === length ? "" : "errors.codeIncomplete";
}

// مدة المهمة بالدقائق: رقم صحيح بين الحد الأدنى والأعلى
export function validateMinutes(value, min, max) {
  const minutes = Number(value);

  if (value === "" || !Number.isInteger(minutes) || minutes < min || minutes > max) {
    return "errors.taskMinutes";
  }

  return "";
}