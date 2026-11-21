import { useEffect, useState } from "react";
import { addBranch } from "../data/communities.js";
import { BADGE_REQUESTS_KEY, loadBadgeRequests } from "./useBadges.js";
import { BRANCH_REQUESTS_KEY, branchFromRequest, loadBranchRequests } from "./useBranchRequests.js";
import { REPORTS_KEY, loadReports } from "./useReports.js";
import { REMOVED_KEY, contentKey, loadRemoved } from "./useRemovedContent.js";
import { APPEALS_KEY, BLOCKS_KEY, blockEntry, loadAppeals, loadBlocks } from "./useModeration.js";
import { useStorageSync } from "./useSharedStorage.js";

// ----- دخول الأدمن -----
// الآن: حساب تجريبي، والجلسة بتنتهي لما تسكّر المتصفح (sessionStorage)
// لاحقًا: تسجيل دخول حقيقي بالسيرفر، والصلاحية (role = admin) بتنفحص هناك مش بالمتصفح
const SESSION_KEY = "areatk-admin-session";
export const DEMO_ADMIN = { account: "admin", password: "Areatk@2026" };

// أسباب الرفض اللي بيختار منها الأدمن
export const BADGE_REJECT_REASONS = ["notEnough", "proofUnclear"];
export const BRANCH_REJECT_REASONS = ["notEnough", "exists"];

// الطلبات حسب فلتر الحالة: اللي بيستنى قرار أول، وبعدين الأحدث
export function filterByStatus(items, status) {
  const list = status === "all" ? items : items.filter((item) => item.status === status);
  return [...list].sort((a, b) => (b.status === "pending") - (a.status === "pending") || b.createdAt - a.createdAt);
}

export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(SESSION_KEY) === "yes");

  // يرجع true إذا البيانات صحيحة
  // دخول بحساب طالب بينهي وضع الإدارة (لو الأدمن ما طلع من اللوحة قبل)
  function login(account, password) {
    const isValid = account.trim().toLowerCase() === DEMO_ADMIN.account && password === DEMO_ADMIN.password;
    if (isValid) {
      sessionStorage.setItem(SESSION_KEY, "yes");
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setIsAdmin(isValid);
    return isValid;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  }

  return { isAdmin, login, logout };
}

/**
 * قائمة محفوظة بـ localStorage ومتزامنة مع باقي التبويبات
 * (لو الطالب بعت طلب بتبويب ثاني، بيظهر عند الأدمن فورًا).
 */
function useSyncedList(key, load) {
  const [list, setList] = useState(load);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(list));
  }, [key, list]);

  useStorageSync(key, () => setList(load()));

  return [list, setList];
}

// القرار: وقته، و isNotified: false حتى يوصل إشعار لصاحب الطلب مرة وحدة
const decision = () => ({ reviewedAt: Date.now(), isNotified: false });

/**
 * بيانات لوحة الأدمن: طلبات الشارات، طلبات الفروع، البلاغات، وطلبات المراجعة، مع قرارات الأدمن عليها.
 * نفس مفاتيح التخزين اللي بيستخدمها قسم التواصل، فالقرار بيوصل للطالب (حتى لو بتبويب ثاني).
 * لاحقًا: كل هاد بيصير طلبات للسيرفر (GET للقوائم و PATCH للقرارات).
 */
export function useAdminData() {
  // ترتيب التعريف مهم: المحذوفات بتنحفظ قبل البلاغات، فلما يوصل قرار البلاغ يكون المحتوى انحذف
  const [removed, setRemoved] = useSyncedList(REMOVED_KEY, loadRemoved);
  const [badgeRequests, setBadgeRequests] = useSyncedList(BADGE_REQUESTS_KEY, loadBadgeRequests);
  const [branchRequests, setBranchRequests] = useSyncedList(BRANCH_REQUESTS_KEY, loadBranchRequests);
  const [reports, setReports] = useSyncedList(REPORTS_KEY, loadReports);
  // سجل حجب المنشورات (لإشعار أصحابها) وطلبات المراجعة منهم
  const [, setBlocks] = useSyncedList(BLOCKS_KEY, loadBlocks);
  const [appeals, setAppeals] = useSyncedList(APPEALS_KEY, loadAppeals);

  // طلب شارة: قبول، أو رفض مع السبب
  function reviewBadge(id, isApproved, reason = null) {
    setBadgeRequests((current) =>
      current.map((request) =>
        request.id === id
          ? { ...request, status: isApproved ? "approved" : "rejected", reason: isApproved ? null : reason, ...decision() }
          : request
      )
    );
  }

  // طلب فرع: القبول بينزّل الفرع بمجتمعه، والرفض مع السبب
  function reviewBranch(id, isApproved, reason = null) {
    const request = branchRequests.find((item) => item.id === id);
    if (!request) return;
    if (isApproved) addBranch(request.communityId, branchFromRequest(request));

    setBranchRequests((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: isApproved ? "approved" : "rejected", rejectReason: isApproved ? null : reason, ...decision() }
          : item
      )
    );
  }

  // بلاغ: حذف المحتوى أو "ما في مخالفة" (كل البلاغات المعلّقة على نفس المحتوى بتاخد نفس القرار)
  function reviewReport(id, shouldRemove) {
    const report = reports.find((item) => item.id === id);
    if (!report) return;

    const key = contentKey(report.targetType, report.targetId);
    if (shouldRemove) setRemoved((current) => (current.includes(key) ? current : [...current, key]));
    // منشور انحجب بعد بلاغ: صاحبه بيوصله إشعار وبيقدر يطلب مراجعة
    if (shouldRemove && report.targetType === "post") {
      setBlocks((current) => [
        blockEntry({ targetType: "post", targetId: report.targetId, title: report.title, ownerId: report.ownerId }),
        ...current,
      ]);
    }

    setReports((current) =>
      current.map((item) =>
        contentKey(item.targetType, item.targetId) === key && item.status === "pending"
          ? { ...item, status: shouldRemove ? "removed" : "dismissed", ...decision() }
          : item
      )
    );
  }

  // تراجع: المحتوى المحذوف بيرجع يظهر
  function restoreContent(targetType, targetId) {
    const key = contentKey(targetType, targetId);
    setRemoved((current) => current.filter((item) => item !== key));
  }

  // طلب مراجعة: "ارجع المنشور" بيلغي الحجب، و"يضل محجوب" بيرفض الطلب (وبيوصل إشعار لصاحبه)
  function reviewAppeal(id, shouldRestore) {
    const appeal = appeals.find((item) => item.id === id);
    if (!appeal) return;
    if (shouldRestore) restoreContent(appeal.targetType, appeal.targetId);

    setAppeals((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: shouldRestore ? "approved" : "rejected", ...decision() } : item
      )
    );
  }

  const isRemoved = (targetType, targetId) => removed.includes(contentKey(targetType, targetId));

  // عدد اللي بيستنى قرار بكل قسم (للقائمة والنظرة العامة)
  const pending = {
    badges: badgeRequests.filter((request) => request.status === "pending").length,
    branches: branchRequests.filter((request) => request.status === "pending").length,
    reports: reports.filter((report) => report.status === "pending").length,
    appeals: appeals.filter((appeal) => appeal.status === "pending").length,
  };

  return {
    badgeRequests,
    branchRequests,
    reports,
    appeals,
    removedCount: removed.length,
    pending,
    reviewBadge,
    reviewBranch,
    reviewReport,
    restoreContent,
    reviewAppeal,
    isRemoved,
  };
}