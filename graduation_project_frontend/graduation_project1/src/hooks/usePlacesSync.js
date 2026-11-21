import { useState } from "react";
import {
  CUSTOM_BRANCHES_KEY,
  CUSTOM_COMMUNITIES_KEY,
  syncCustomBranches,
  syncCustomCommunities,
} from "../data/communities.js";
import { useStorageSync } from "./useSharedStorage.js";

/**
 * المجتمعات والفروع الجديدة اللي ضافها الأدمن (حتى لو من تبويب ثاني) بتظهر فورًا.
 * قائمة المجتمعات مش state (ملف بيانات)، فبعد ما نضيف الجديد بنزيد رقم صغير
 * حتى React يعيد رسم الصفحة.
 * يرجع: refresh() لإعادة الرسم بعد إضافة من نفس التبويب
 */
export function usePlacesSync() {
  const [, setVersion] = useState(0);

  function refresh() {
    syncCustomCommunities();
    syncCustomBranches();
    setVersion((version) => version + 1);
  }

  useStorageSync(CUSTOM_COMMUNITIES_KEY, refresh);
  useStorageSync(CUSTOM_BRANCHES_KEY, refresh);

  return refresh;
}