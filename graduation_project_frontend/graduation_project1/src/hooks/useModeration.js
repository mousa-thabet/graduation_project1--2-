import { useEffect, useState } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { REMOVED_KEY, contentKey, loadRemoved } from "./useRemovedContent.js";
import { useDecisionNotices, useStorageSync } from "./useSharedStorage.js";

// ----- الحجب وطلبات المراجعة -----
// المحتوى المحجوب نفسه بقائمة المحذوفات (REMOVED_KEY): "post:رقم" أو "exam:رقم"...
// BLOCKS_KEY: سجل حجب المنشورات (حتى يوصل لصاحب المنشور إشعار مرة وحدة)
// APPEALS_KEY: طلبات المراجعة من أصحاب المنشورات المحجوبة
// لاحقًا: كل هاد بالسيرفر، والسيرفر هو اللي بيتأكد إن اللي بيحجب أدمن فعلًا
export const BLOCKS_KEY = "areatk-community-blocks";
export const APPEALS_KEY = "areatk-community-appeals";

function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return [];
}

export const loadBlocks = () => loadList(BLOCKS_KEY);
export const loadAppeals = () => loadList(APPEALS_KEY);

// أول 80 حرف من نص المنشور (عنوانه عند الأدمن وبالإشعار)
export const postTitle = (post) => (post.text?.trim() || "").slice(0, 80);

/**
 * سجل حجب منشور: صاحبه بيوصله إشعار (isNotified: false)، ومنشورات غيري ما إلها إشعار عندي.
 * ownerId: صاحب المنشور
 */
export function blockEntry({ targetType, targetId, title, ownerId }) {
  return {
    id: `block-${crypto.randomUUID()}`,
    targetType,
    targetId,
    title,
    ownerId,
    createdAt: Date.now(),
    isNotified: ownerId === CURRENT_USER.id ? false : true,
  };
}

/**
 * قائمة محفوظة ومتزامنة مع باقي التبويبات (الأدمن بتبويب، والطالب بتبويب ثاني).
 */
function useSyncedList(key, load) {
  const [list, setList] = useState(load);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(list));
  }, [key, list]);

  useStorageSync(key, () => setList(load()));

  return [list, setList];
}

/**
 * الحجب والمراجعة بقسم التواصل:
 * - isBlocked(type, id): المحتوى محجوب (من الأدمن مباشرة، أو بعد بلاغ)
 * - block / unblock: للأدمن وهو بيتصفح المجتمعات (بدل الإبلاغ)
 * - appealFor(type, id): آخر طلب مراجعة على المحتوى • requestReview: صاحب المنشور بيطلب مراجعة
 * onBlocked(entry): انحجب منشور إلي (إشعار)  •  onAppealReviewed(appeal): الإدارة قررت بطلب مراجعتي (إشعار)
 */
export function useModeration({ onBlocked, onAppealReviewed } = {}) {
  const [removed, setRemoved] = useSyncedList(REMOVED_KEY, loadRemoved);
  const [blocks, setBlocks] = useSyncedList(BLOCKS_KEY, loadBlocks);
  const [appeals, setAppeals] = useSyncedList(APPEALS_KEY, loadAppeals);

  // الإشعارات مرة وحدة بس (نفس طريقة قرارات الأدمن)
  useDecisionNotices(blocks, onBlocked, setBlocks);
  useDecisionNotices(appeals, onAppealReviewed, setAppeals);

  const isBlocked = (targetType, targetId) => removed.includes(contentKey(targetType, targetId));

  // حجب: المحتوى بيختفي عن الناس (صاحبه بيشوفه محجوب وبيقدر يطلب مراجعة)
  function block({ targetType, targetId, title, ownerId }) {
    const key = contentKey(targetType, targetId);
    setRemoved((current) => (current.includes(key) ? current : [...current, key]));
    if (targetType === "post") setBlocks((current) => [blockEntry({ targetType, targetId, title, ownerId }), ...current]);
  }

  function unblock(targetType, targetId) {
    const key = contentKey(targetType, targetId);
    setRemoved((current) => current.filter((item) => item !== key));
  }

  // آخر طلب مراجعة (الأحدث أول)
  const appealFor = (targetType, targetId) =>
    appeals.find((appeal) => appeal.targetType === targetType && appeal.targetId === targetId) ?? null;

  // طلب مراجعة: بيوصل للأدمن "بيستنى قرار"
  function requestReview({ targetType, targetId, title, note }) {
    setAppeals((current) => [
      {
        id: `appeal-${crypto.randomUUID()}`,
        targetType,
        targetId,
        title,
        note,
        // صاحب الطلب (لاحقًا: من حساب تسجيل الدخول)
        owner: { id: CURRENT_USER.id, handle: CURRENT_USER.handle },
        status: "pending",
        createdAt: Date.now(),
      },
      ...current,
    ]);
  }

  return { isBlocked, block, unblock, appealFor, requestReview };
}