import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import { filterByStatus } from "../../hooks/useAdmin.js";
import { contentKey } from "../../hooks/useRemovedContent.js";
import { formatTimeAgo } from "../../utils/format.js";
import { AdminHeader, DecisionBar, StatusChip, StatusFilter } from "./AdminShared.jsx";
import "./Admin.css";

const STATUSES = ["pending", "removed", "dismissed"];

// نوع المحتوى: أيقونته ورابطه بالمنصة
const TARGETS = {
  exam: { icon: "checkSquare", path: (id) => `/community/exams/${id}` },
  course: { icon: "graduation", path: (id) => `/community/courses/${id}` },
  live: { icon: "radio", path: (id) => `/community/live/${id}` },
  // منشور عادي بالتواصل
  post: { icon: "comment", path: (id) => `/community/post/${id}` },
};

/**
 * البلاغات: /admin/reports
 * كل بلاغ: نوع المحتوى وعنوانه، السبب والتفاصيل، كم بلاغ على نفس المحتوى، ورابط يفتحه.
 * القرار: "احذف المحتوى" (بيختفي من المنصة) أو "ما في مخالفة"، وبعد الحذف فيك ترجّعه.
 * المنشور المحذوف بيصير محجوب: صاحبه بيوصله إشعار وبيقدر يطلب مراجعة (بصفحة طلبات المراجعة).
 */
function AdminReports() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const admin = useOutletContext();
  const [status, setStatus] = useState("pending");

  const list = filterByStatus(admin.reports, status);

  // كم بلاغ على نفس المحتوى (لترتيب الأولويات)
  const countOn = (report) =>
    admin.reports.filter((item) => contentKey(item.targetType, item.targetId) === contentKey(report.targetType, report.targetId))
      .length;

  return (
    <>
      <AdminHeader title={t("admin.nav.reports")} text={t("admin.reports.text")}>
        <StatusFilter statuses={STATUSES} items={admin.reports} value={status} onChange={setStatus} />
      </AdminHeader>

      {list.length === 0 ? (
        <EmptyState icon="flag" title={t(`admin.empty.${status}`)} text={t("admin.reports.empty")} />
      ) : (
        <ul className="admin-list">
          {list.map((report) => {
            const target = TARGETS[report.targetType];
            const isRemoved = admin.isRemoved(report.targetType, report.targetId);
            const count = countOn(report);

            return (
              <li key={report.id} className={`admin-card is-${report.status}`}>
                <header className="admin-card__head">
                  <span className="admin-card__icon">
                    <Icon name={target.icon} size={22} />
                  </span>
                  <div className="admin-card__heading">
                    <h2 dir="auto">{report.title}</h2>
                    <p>
                      {t([`admin.reports.types.${report.targetType}`, `moderation.admin.types.${report.targetType}`])} ·{" "}
                      <bdi dir="ltr">@{report.reporter?.handle ?? "student"}</bdi> ·{" "}
                      {formatTimeAgo(report.createdAt, language)}
                    </p>
                  </div>
                  {count > 1 && <span className="admin-card__count">{t("admin.reports.count", { count })}</span>}
                </header>

                <p className="admin-card__reason">
                  <Icon name="flag" size={15} />
                  {/* أسباب بلاغ المنشورات غير أسباب الامتحانات والدورات */}
                  {t([`community.reports.reasons.${report.reason}`, `studyApp.report.reasons.${report.reason}`])}
                </p>
                {report.note && (
                  <p className="admin-card__text" dir="auto">
                    {report.note}
                  </p>
                )}

                {/* المحتوى نفسه (بتبويب ثاني) */}
                {!isRemoved && (
                  <Link to={target.path(report.targetId)} target="_blank" rel="noopener" className="admin-link">
                    {t("admin.reports.open")}
                  </Link>
                )}

                {report.status === "pending" ? (
                  <DecisionBar
                    approveTone="bad"
                    approveLabel={t("admin.reports.remove")}
                    rejectLabel={t("admin.reports.dismiss")}
                    onApprove={() => admin.reviewReport(report.id, true)}
                    onReject={() => admin.reviewReport(report.id, false)}
                  />
                ) : (
                  <div className="admin-card__done">
                    <StatusChip status={report.status} reviewedAt={report.reviewedAt} />
                    {/* تراجع عن الحذف */}
                    {isRemoved && (
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => admin.restoreContent(report.targetType, report.targetId)}
                      >
                        {t("admin.reports.restore")}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default AdminReports;