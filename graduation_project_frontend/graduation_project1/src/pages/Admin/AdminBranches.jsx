import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import { communityPath, findCommunity, hasBranchNamed, localName } from "../../data/communities.js";
import { BRANCH_REJECT_REASONS, filterByStatus } from "../../hooks/useAdmin.js";
import { MIN_REASON_LENGTH } from "../../hooks/useBranchRequests.js";
import { formatTimeAgo } from "../../utils/format.js";
import { AdminCheck, AdminHeader, DecisionBar, StatusChip, StatusFilter } from "./AdminShared.jsx";
import "./Admin.css";

const STATUSES = ["pending", "approved", "rejected"];

/**
 * طلبات فتح الفروع: /admin/branches
 * كل طلب: المجتمع والفرع، الوصف والأدوات، سبب فتحه، وفحص إذا الاسم مكرر.
 * الموافقة بتنزّل الفرع بمجتمعه فورًا، وصاحب الطلب بينضم له تلقائيًا.
 */
function AdminBranches() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const admin = useOutletContext();
  const [status, setStatus] = useState("pending");

  const list = filterByStatus(admin.branchRequests, status);
  const reasonLabel = (reason) => t(`community.branchRequests.reasons.${reason}`);

  return (
    <>
      <AdminHeader title={t("admin.nav.branches")} text={t("admin.branches.text")}>
        <StatusFilter statuses={STATUSES} items={admin.branchRequests} value={status} onChange={setStatus} />
      </AdminHeader>

      {list.length === 0 ? (
        <EmptyState icon="layers" title={t(`admin.empty.${status}`)} text={t("admin.branches.empty")} />
      ) : (
        <ul className="admin-list">
          {list.map((request) => {
            const community = findCommunity(request.communityId);
            // الاسم مكرر؟ (قبل الموافقة بس، لأنه بعدها الفرع نفسه صار موجود)
            const isDuplicate = request.status === "pending" && hasBranchNamed(request.communityId, request.name);

            return (
              <li key={request.id} className={`admin-card is-${request.status}`}>
                <header className="admin-card__head">
                  <span className="admin-card__icon" style={{ color: community?.color }}>
                    <Icon name="layers" size={22} />
                  </span>
                  <div className="admin-card__heading">
                    <h2>
                      {community ? localName(community, language) : ""} › <bdi>{request.name}</bdi>
                    </h2>
                    <p>
                      <bdi dir="ltr">@{request.applicant?.handle ?? "student"}</bdi> ·{" "}
                      {formatTimeAgo(request.createdAt, language)}
                    </p>
                  </div>
                </header>

                {request.description && (
                  <>
                    <h3 className="admin-card__label">{t("admin.branches.description")}</h3>
                    <p className="admin-card__text" dir="auto">
                      {request.description}
                    </p>
                  </>
                )}

                {request.tags.length > 0 && (
                  <ul className="admin-tags">
                    {request.tags.map((tag) => (
                      <li key={tag} dir="ltr">
                        #{tag}
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="admin-card__label">{t("admin.branches.reason")}</h3>
                <p className="admin-card__text" dir="auto">
                  {request.reason}
                </p>

                {request.status === "pending" && (
                  <div className="admin-card__checks">
                    <AdminCheck isOk={!isDuplicate}>
                      {t(isDuplicate ? "admin.branches.duplicate" : "admin.branches.unique")}
                    </AdminCheck>
                    <AdminCheck isOk={request.reason.length >= MIN_REASON_LENGTH}>
                      {t("admin.branches.reasonLength", { count: request.reason.length })}
                    </AdminCheck>
                  </div>
                )}

                {request.status === "pending" ? (
                  <DecisionBar
                    reasons={BRANCH_REJECT_REASONS}
                    reasonLabel={reasonLabel}
                    onApprove={() => admin.reviewBranch(request.id, true)}
                    onReject={(reason) => admin.reviewBranch(request.id, false, reason)}
                  />
                ) : (
                  <div className="admin-card__done">
                    <StatusChip
                      status={request.status}
                      reviewedAt={request.reviewedAt}
                      reasonLabel={request.rejectReason && reasonLabel(request.rejectReason)}
                    />
                    {request.status === "approved" && (
                      <Link
                        to={communityPath(request.communityId, request.branchId)}
                        target="_blank"
                        rel="noopener"
                        className="admin-link"
                      >
                        {t("admin.branches.open")}
                      </Link>
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

export default AdminBranches;