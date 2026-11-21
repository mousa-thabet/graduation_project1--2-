import { useLocation } from "react-router";
import { profilePath } from "../data/studyPeople.js";
import { communityProfilePath } from "../data/communityPeople.js";

/**
 * رابط حساب الشخص حسب القسم المفتوح الآن:
 * في التواصل ← /community/profile/اسم_المستخدم  •  في ادرس معي ← /profile/اسم_المستخدم
 * حتى تبقى المكونات المشتركة (المنشور، التعليقات) داخل قسمها.
 */
export function useProfilePath() {
  const { pathname } = useLocation();
  return pathname.startsWith("/community") ? communityProfilePath : profilePath;
}