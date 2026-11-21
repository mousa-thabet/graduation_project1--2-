import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import { filterByStatus } from "../../hooks/useAdmin.js";
import { formatTimeAgo } from "../../utils/format.js";
import { AdminHeader, DecisionBar, StatusChip, StatusFilter } from "./AdminShared.jsx";
import "./Admin.css";

// بيستنى قرار، رجع المنشور (approved)، ضل محجوب (rejected)
const STATUSES = ["pending", "approved", "rejected"];

/**
 * طلبات المراجعة: /admin/appeals
 * صاحب منشور محجوب (من الأدمن أو بعد بلاغ) بيطلب مراجعة مع رسالة اختيارية.
 * القرار: "ارجع المنشور" (بيلغي الحجب) أو "يضل محجوب"، وصاحبه بيوصله إشعار بالقرار.
 * "افتح المنشور" بنفس التبويب حتى تضل بوضع الإدارة (بتشوف المحجوب).
 */
function AdminAppeals() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const admin = useOutletContext();
  const [status, setStatus] = useState("pending");

  const list = filterByStatus(admin.appeals, status);

  return (
    <>
      <AdminHeader title={t("moderation.admin.title")} text={t("moderation.admin.text")}>
        <StatusFilter statuses={STATUSES} items={admin.appeals} value={status} onChange={setStatus} />
      </AdminHeader>

      {list.length === 0 ? (
        <EmptyState icon="message" title={t(`admin.empty.${status}`)} text={t("moderation.admin.empty")} />
      ) : (
        <ul className="admin-list">
          {list.map((appeal) => (
            <li key={appeal.id} className={`admin-card is-${appeal.status}`}>
              <header className="admin-card__head">
                <span className="admin-card__icon">
                  <Icon name="comment" size={22} />
                </span>
                <div className="admin-card__heading">
                  <h2 dir="auto">{appeal.title || t("moderation.admin.noText")}</h2>
                  <p>
                    {t(`moderation.admin.types.${appeal.targetType}`)} ·{" "}
                    <bdi dir="ltr">@{appeal.owner?.handle ?? "student"}</bdi> · {formatTimeAgo(appeal.createdAt, language)}
                  </p>
                </div>
              </header>

              {/* رسالة صاحب المنشور */}
              <p className="admin-card__reason">
                <Icon name="message" size={15} />
                {t("moderation.admin.note")}
              </p>
              <p className="admin-card__text" dir="auto">
                {appeal.note || t("moderation.admin.noNote")}
              </p>

              <Link to={`/community/post/${appeal.targetId}`} className="admin-link">
                {t("moderation.admin.open")}
              </Link>

              {appeal.status === "pending" ? (
                <DecisionBar
                  approveLabel={t("moderation.admin.restore")}
                  rejectLabel={t("moderation.admin.keep")}
                  onApprove={() => admin.reviewAppeal(appeal.id, true)}
                  onReject={() => admin.reviewAppeal(appeal.id, false)}
                />
              ) : (
                <div className="admin-card__done">
                  <StatusChip status={appeal.status} reviewedAt={appeal.reviewedAt} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default AdminAppeals;