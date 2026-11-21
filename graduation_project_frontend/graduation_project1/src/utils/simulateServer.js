// محاكاة لما سيفعله السيرفر لاحقًا (للعرض فقط)
// عند ربط الباك إند يُحذف هذا الملف، وتصل الإشعارات الحقيقية من السيرفر
import { SUGGESTED_PEOPLE } from "../data/studyPeople.js";

// بعد كم ثانية يصل الإعجاب
const LIKE_DELAY = 5000;

// بعد نشر منشور: شخص عشوائي يعجب به بعد ثوانٍ
export function simulateLike(onLike) {
  const person = SUGGESTED_PEOPLE[Math.floor(Math.random() * SUGGESTED_PEOPLE.length)];
  setTimeout(() => onLike(person), LIKE_DELAY);
}