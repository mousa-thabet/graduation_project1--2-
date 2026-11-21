import { useEffect, useMemo, useState } from "react";
import { syncCustomBranches } from "../data/communities.js";
import { CURRENT_USER } from "../data/currentUser.js";
import { useDecisionNotices, useStorageSync } from "./useSharedStorage.js";

export const BRANCH_REQUESTS_KEY = "areatk-community-branch-requests";

// أقل عدد أحرف لسبب فتح الفرع حتى يُرسل الطلب
export const MIN_REASON_LENGTH = 30;

export function loadBranchRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem(BRANCH_REQUESTS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return [];
}

// الفرع الجديد بالشكل اللي بتفهمه المجتمعات (لما يوافق الأدمن)
export function branchFromRequest(request) {
  return { id: request.branchId, name: { ar: request.name, en: request.name }, tags: request.tags, isNew: true };
}

/**
 * طلبات فتح فرع جديد (لأصحاب الشارات فقط): استبيان فيه المجتمع، اسم الفرع، وصفه، أدواته، وسبب فتحه.
 * الطلب بيروح للأدمن، وإذا وافق من لوحة التحكم بينزل الفرع الجديد في مجتمعه.
 * لما يقرر (حتى لو من تبويب ثاني) بيوصلني إشعار مرة وحدة، وعند الموافقة بنضم للفرع.
 * كل حساب بيشوف طلباته بس (وإشعارات قراراتها بتوصله هو بس).
 * onReviewed(request): يُستدعى عند وصول القرار (لإرسال إشعار والانضمام للفرع)
 * لاحقًا: الطلب بيروح للسيرفر، والقرار بيرجع منه.
 */
export function useBranchRequests({ onReviewed } = {}) {
  // كل الطلبات (لكل الحسابات على هاد المتصفح) • الحساب اللي فتح الصفحة
  const [allRequests, setRequests] = useState(loadBranchRequests);
  const [handle] = useState(() => CURRENT_USER.handle);
  // طلباتي أنا بس
  const requests = useMemo(
    () => allRequests.filter((request) => request.applicant?.handle === handle),
    [allRequests, handle]
  );

  useEffect(() => {
    localStorage.setItem(BRANCH_REQUESTS_KEY, JSON.stringify(allRequests));
  }, [allRequests]);

  // الأدمن قرر من تبويب ثاني: نضيف الفروع الجديدة ونقرأ الطلبات من جديد
  useStorageSync(BRANCH_REQUESTS_KEY, () => {
    syncCustomBranches();
    setRequests(loadBranchRequests());
  });

  // قرار جديد من الأدمن: إشعار مرة وحدة
  useDecisionNotices(requests, onReviewed, setRequests);

  // إرسال الاستبيان: { communityId, name, description, tags, reason }
  function apply({ communityId, name, description, tags, reason }) {
    const request = {
      id: `branch-request-${crypto.randomUUID()}`,
      // رقم الفرع إذا انقبل
      branchId: `new-${Date.now().toString(36)}`,
      communityId,
      name,
      description,
      tags,
      reason,
      // صاحب الطلب (لاحقًا: من حساب تسجيل الدخول)
      applicant: { id: CURRENT_USER.id, handle: CURRENT_USER.handle },
      status: "pending",
      rejectReason: null,
      createdAt: Date.now(),
    };

    setRequests((current) => [request, ...current]);
  }

  // حذف طلب (المقبول يبقى لأن الفرع صار موجودًا)
  function remove(id) {
    setRequests((current) => current.filter((request) => request.id !== id));
  }

  // هل في طلب قيد المراجعة بنفس الاسم؟
  function isPending(communityId, name) {
    const wanted = name.trim().toLowerCase();
    return requests.some(
      (request) =>
        request.status === "pending" &&
        request.communityId === communityId &&
        request.name.trim().toLowerCase() === wanted
    );
  }

  return { requests, apply, remove, isPending };
}