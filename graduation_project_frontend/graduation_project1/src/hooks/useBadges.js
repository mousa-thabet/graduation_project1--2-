import { useEffect, useMemo, useState } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { deleteMedia, saveMedia } from "../utils/mediaStore.js";
import { useDecisionNotices, useStorageSync } from "./useSharedStorage.js";

export const BADGE_REQUESTS_KEY = "areatk-community-badges";

// أقل عدد أحرف للتعريف بخبرتك حتى يُقبل الطلب
export const MIN_ABOUT_LENGTH = 40;

export function loadBadgeRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem(BADGE_REQUESTS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return [];
}

// نفس الشارة: نفس النوع، ولشارة الخبرة نفس المسار
const isSameBadge = (a, b) => a.type === b.type && (a.type === "scholar" || a.communityId === b.communityId);

/**
 * طلبات الشارات: تقديم طلب (النوع، المسار، التعريف، وملف إثبات)، والأدمن بيقرر من لوحة التحكم.
 * request: { id, type, communityId, about, proofName, proofMediaId, applicant, status, reason, createdAt, reviewedAt, isNotified }
 * ملف الإثبات بيتحفظ في IndexedDB حتى الأدمن يفتحه ويتأكد منه.
 * لما الأدمن يقرر (حتى لو من تبويب ثاني) بيوصلني إشعار مرة وحدة.
 * كل حساب بيشوف طلباته بس، وشاراته هي طلباته المقبولة (الحساب الجديد بيبلّش بدون شارات).
 * onReviewed(request): يُستدعى عند وصول القرار (لإرسال إشعار)
 * لاحقًا: الطلب والملف بيروحوا للسيرفر، والقرار بيرجع منه.
 */
export function useBadges({ onReviewed } = {}) {
  // كل الطلبات (لكل الحسابات على هاد المتصفح) • الحساب اللي فتح الصفحة (القسم بيتركّب من جديد بعد كل تسجيل دخول)
  const [allRequests, setRequests] = useState(loadBadgeRequests);
  const [handle] = useState(() => CURRENT_USER.handle);
  // طلباتي أنا بس
  const requests = useMemo(
    () => allRequests.filter((request) => request.applicant?.handle === handle),
    [allRequests, handle]
  );

  useEffect(() => {
    localStorage.setItem(BADGE_REQUESTS_KEY, JSON.stringify(allRequests));
  }, [allRequests]);

  // الأدمن قرر من تبويب ثاني: نقرأ الطلبات من جديد
  useStorageSync(BADGE_REQUESTS_KEY, () => setRequests(loadBadgeRequests()));

  // قرار جديد من الأدمن: إشعار مرة وحدة
  useDecisionNotices(requests, onReviewed, setRequests);

  // تقديم طلب: { type, communityId, about, proof (الملف) }
  function apply({ type, communityId, about, proof }) {
    const id = `badge-${crypto.randomUUID()}`;
    const proofMediaId = `${id}-proof`;

    // الملف بيتحفظ بالمتصفح حتى يفتحه الأدمن (لو فشل الحفظ، الطلب بيضل وفيه اسم الملف)
    saveMedia(proofMediaId, proof).catch(() => {});

    const request = {
      id,
      type,
      communityId: type === "expert" ? communityId : null,
      about,
      proofName: proof.name,
      proofMediaId,
      // صاحب الطلب (لاحقًا: من حساب تسجيل الدخول)
      applicant: { id: CURRENT_USER.id, handle: CURRENT_USER.handle },
      status: "pending",
      reason: null,
      createdAt: Date.now(),
    };

    setRequests((current) => [request, ...current]);
  }

  // حذف طلب (وملف إثباته)
  function remove(id) {
    const request = requests.find((item) => item.id === id);
    if (request?.proofMediaId) deleteMedia(request.proofMediaId).catch(() => {});
    setRequests((current) => current.filter((item) => item.id !== id));
  }

  // شاراتي: طلباتي المقبولة (بنفس شكل شارات الأشخاص، وبدون تكرار)
  const approved = requests
    .filter((request) => request.status === "approved")
    .map(({ type, communityId }) => (type === "expert" ? { type, communityId } : { type }));
  const myBadges = approved.filter(
    (badge, index, all) => all.findIndex((other) => isSameBadge(other, badge)) === index
  );

  // هل أملك الشارة أو طلبها قيد المراجعة؟ (حتى لا يتكرر الطلب)
  function hasOrPending(badge) {
    return requests.some((request) => request.status !== "rejected" && isSameBadge(request, badge));
  }

  // آخر طلب مقبول لهاي الشارة (لصفحة الخبرات)
  const approvedRequestFor = (badge) =>
    requests.find((request) => request.status === "approved" && isSameBadge(request, badge)) ?? null;

  // شارة القيمة العلمية: نشر الامتحانات والدورات والبث  •  أي شارة: طلب فتح فرع جديد
  const isScholar = myBadges.some((badge) => badge.type === "scholar");
  const hasBadge = myBadges.length > 0;

  return { requests, myBadges, isScholar, hasBadge, apply, remove, hasOrPending, approvedRequestFor };
}