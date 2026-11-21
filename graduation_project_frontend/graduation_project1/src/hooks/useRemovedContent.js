import { useState } from "react";
import { useStorageSync } from "./useSharedStorage.js";

export const REMOVED_KEY = "areatk-community-removed";

// المحتوى اللي حذفه الأدمن: ["exam:exam-1", "live:live-2", ...]
export function loadRemoved() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMOVED_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نتجاهلها
  }

  return [];
}

// مفتاح المحتوى: "نوعه:رقمه"
export const contentKey = (targetType, targetId) => `${targetType}:${targetId}`;

/**
 * المحتوى اللي حذفه الأدمن بعد بلاغ (امتحان، دورة، أو بث): بيختفي من كل الأقسام.
 * الأدمن بيكتب القائمة، وهون بس بنقرأها (وبتتحدث لو الأدمن بتبويب ثاني).
 * لاحقًا: المحتوى المحذوف ما بيرجع من السيرفر أصلًا.
 */
export function useRemovedContent() {
  const [removed, setRemoved] = useState(loadRemoved);

  useStorageSync(REMOVED_KEY, () => setRemoved(loadRemoved()));

  const isRemoved = (targetType, targetId) => removed.includes(contentKey(targetType, targetId));

  return { isRemoved };
}