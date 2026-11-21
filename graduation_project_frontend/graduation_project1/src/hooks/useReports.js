import { useEffect, useMemo, useState } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { useDecisionNotices, useStorageSync } from "./useSharedStorage.js";

export const REPORTS_KEY = "areatk-community-reports";

// أسباب البلاغ
export const REPORT_REASONS = ["wrong", "inappropriate", "spam", "copyright", "other"];

export function loadReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(REPORTS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return [];
}

/**
 * البلاغات على الامتحانات والدورات والبثوث: البلاغ بيتحفظ "قيد المراجعة" وبيستنى الأدمن.
 * report: { id, targetType: "exam" | "course" | "live" | "post", targetId, title, reason, note, reporter, ownerId, status, createdAt }
 * ownerId: صاحب المنشور (للمنشورات: لو انحجب بيوصله إشعار وبيقدر يطلب مراجعة)
 * قرار الأدمن: status بيصير removed (انحذف المحتوى) أو dismissed (ما في مخالفة)، وبيوصلني إشعار.
 * كل مستخدم بيبلّغ مرة وحدة بس على نفس الشي، وبيشوف بلاغاته بس (وإشعارات قراراتها بتوصله هو بس).
 * onReviewed(report): يُستدعى عند وصول قرار الأدمن (لإرسال إشعار)
 * لاحقًا: البلاغات بتنبعت للسيرفر.
 */
export function useReports({ onReviewed } = {}) {
  // كل البلاغات (لكل الحسابات على هاد المتصفح) • الحساب اللي فتح الصفحة
  const [allReports, setReports] = useState(loadReports);
  const [handle] = useState(() => CURRENT_USER.handle);
  // بلاغاتي أنا بس
  const reports = useMemo(() => allReports.filter((item) => item.reporter?.handle === handle), [allReports, handle]);

  useEffect(() => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));
  }, [allReports]);

  // الأدمن قرر من تبويب ثاني: نقرأ البلاغات من جديد
  useStorageSync(REPORTS_KEY, () => setReports(loadReports()));

  // قرار جديد من الأدمن: إشعار مرة وحدة
  useDecisionNotices(reports, onReviewed, setReports);

  const hasReported = (targetType, targetId) =>
    reports.some((report) => report.targetType === targetType && report.targetId === targetId);

  // إرسال بلاغ: { targetType, targetId, title, reason, note, ownerId }
  function report({ targetType, targetId, title, reason, note, ownerId = null }) {
    setReports((current) =>
      current.some(
        (item) => item.reporter?.handle === handle && item.targetType === targetType && item.targetId === targetId
      )
        ? current
        : [
            {
              id: `report-${crypto.randomUUID()}`,
              targetType,
              targetId,
              title,
              reason,
              note,
              // صاحب البلاغ (لاحقًا: من حساب تسجيل الدخول)
              reporter: { id: CURRENT_USER.id, handle: CURRENT_USER.handle },
              ownerId,
              status: "pending",
              createdAt: Date.now(),
            },
            ...current,
          ]
    );
  }

  return { reports, hasReported, report };
}