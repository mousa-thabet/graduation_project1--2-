import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import UserBadge from "../../components/UserBadge/UserBadge.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import { findCommunity, localName } from "../../data/communities.js";
import { BADGE_REJECT_REASONS, filterByStatus } from "../../hooks/useAdmin.js";
import { MIN_ABOUT_LENGTH } from "../../hooks/useBadges.js";
import { useMediaUrl } from "../../hooks/useMediaUrl.js";
import { formatTimeAgo } from "../../utils/format.js";
import { AdminCheck, AdminHeader, DecisionBar, StatusChip, StatusFilter } from "./AdminShared.jsx";
import "./Admin.css";

const STATUSES = ["pending", "approved", "rejected"];

/**
 * ملف الإثبات: صورة بتنعرض مصغّرة، والـ PDF رابط بيفتح بتبويب ثاني.
 * الملف محفوظ في IndexedDB على نفس الجهاز (لاحقًا: رابط من السيرفر).
 */
function ProofPreview({ request }) {
  const { t } = useTranslation();
  const { url, isLoading } = useMediaUrl(request.proofMediaId);
  const isPdf = request.proofName?.toLowerCase().endsWith(".pdf");

  if (isLoading) return <p className="admin-proof is-missing">{t("admin.badges.proofLoading")}</p>;

  // طلب قديم أو الملف انحذف من المتصفح
  if (!url) {
    return (
      <p className="admin-proof is-missing">
        <Icon name="flag" size={15} />
        {t("admin.badges.proofMissing")} <bdi>{request.proofName}</bdi>
      </p>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener" className="admin-proof">
      {isPdf ? (
        <span className="admin-proof__pdf" aria-hidden="true">
          PDF
        </span>
      ) : (
        <img src={url} alt="" className="admin-proof__image" />
      )}
      <span className="admin-proof__text">
        <strong>{t("admin.badges.openProof")}</strong>
        <bdi>{request.proofName}</bdi>
      </span>
    </a>
  );
}

/**
 * طلبات الشارات: /admin/badges
 * كل طلب: الشارة، صاحبها، تعريفه بخبرته، ملف الإثبات، وفحص سريع، وأزرار القرار.
 */
function AdminBadges() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const admin = useOutletContext();
  const [status, setStatus] = useState("pending");

  const list = filterByStatus(admin.badgeRequests, status);

  function badgeName(request) {
    if (request.type === "scholar") return t("community.badges.scholar.title");
    const community = findCommunity(request.communityId);
    return t("community.badges.expert.in", { field: community ? localName(community, language) : "" });
  }

  const reasonLabel = (reason) => t(`community.badges.reasons.${reason}`);

  return (
    <>
      <AdminHeader title={t("admin.nav.badges")} text={t("admin.badges.text")}>
        <StatusFilter statuses={STATUSES} items={admin.badgeRequests} value={status} onChange={setStatus} />
      </AdminHeader>

      {list.length === 0 ? (
        <EmptyState icon="shield" title={t(`admin.empty.${status}`)} text={t("admin.badges.empty")} />
      ) : (
        <ul className="admin-list">
          {list.map((request) => (
            <li key={request.id} className={`admin-card is-${request.status}`}>
              <header className="admin-card__head">
                <span className="admin-card__icon">
                  <UserBadge badge={request} size={26} />
                </span>
                <div className="admin-card__heading">
                  <h2>{badgeName(request)}</h2>
                  <p>
                    <bdi dir="ltr">@{request.applicant?.handle ?? "student"}</bdi> ·{" "}
                    {formatTimeAgo(request.createdAt, language)}
                  </p>
                </div>
              </header>

              <h3 className="admin-card__label">{t("admin.badges.about")}</h3>
              <p className="admin-card__text" dir="auto">
                {request.about}
              </p>

              <h3 className="admin-card__label">{t("admin.badges.proof")}</h3>
              <ProofPreview request={request} />

              {/* فحص سريع قبل القرار */}
              <div className="admin-card__checks">
                <AdminCheck isOk={request.about.length >= MIN_ABOUT_LENGTH}>
                  {t("admin.badges.aboutLength", { count: request.about.length })}
                </AdminCheck>
                <AdminCheck isOk={Boolean(request.proofName)}>
                  {t(request.proofName ? "admin.badges.hasProof" : "admin.badges.noProof")}
                </AdminCheck>
              </div>

              {request.status === "pending" ? (
                <DecisionBar
                  reasons={BADGE_REJECT_REASONS}
                  reasonLabel={reasonLabel}
                  onApprove={() => admin.reviewBadge(request.id, true)}
                  onReject={(reason) => admin.reviewBadge(request.id, false, reason)}
                />
              ) : (
                <StatusChip
                  status={request.status}
                  reviewedAt={request.reviewedAt}
                  reasonLabel={request.reason && reasonLabel(request.reason)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default AdminBadges;