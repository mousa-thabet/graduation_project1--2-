import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";

import Icon from "../../components/Icon/Icon.jsx";

import {
  findCommunity,
  localName,
} from "../../data/communities.js";

import { formatTimeAgo } from "../../utils/format.js";
import { AdminHeader } from "./AdminShared.jsx";

import "./Admin.css";

const RECENT_LIMIT = 6;

function AdminOverview() {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage;
  const admin = useOutletContext();

  const cards = [
    {
      id: "badges",
      icon: "shield",
      value: admin.pending.badges,
      to: "/admin/badges",
    },
    {
      id: "branches",
      icon: "layers",
      value: admin.pending.branches,
      to: "/admin/branches",
    },
    {
      id: "reports",
      icon: "flag",
      value: admin.pending.reports,
      to: "/admin/reports",
    },
    // طلبات الرفع: أصوات وخلفيات الطلاب
    {
      id: "uploads",
      icon: "upload",
      value: admin.pending.uploads,
      to: "/admin/requests",
      label: t("uploads.admin.card"),
    },
    {
      id: "removed",
      icon: "trash",
      value: admin.removedCount,
      to: "/admin/reports",
    },
  ];

  function badgeTitle(request) {
    if (request.type === "scholar") {
      return t("community.badges.scholar.title");
    }

    const community = findCommunity(request.communityId);

    return t("community.badges.expert.in", {
      field: community
        ? localName(community, language)
        : "",
    });
  }

  const recent = [
    ...admin.badgeRequests.map((item) => ({
      ...item,
      kind: "badge",
      label: badgeTitle(item),
    })),

    ...admin.branchRequests.map((item) => ({
      ...item,
      kind: "branch",
      label: item.name,
    })),

    ...admin.reports.map((item) => ({
      ...item,
      kind: "report",
      label: item.title,
    })),

    ...admin.soundRequests.map((item) => ({
      ...item,
      kind: "sound",
      label: item.name,
    })),

    ...admin.sceneRequests.map((item) => ({
      ...item,
      kind: "scene",
      label: item.name,
    })),
  ]
    .filter((item) => item.reviewedAt)
    .sort((a, b) => b.reviewedAt - a.reviewedAt)
    .slice(0, RECENT_LIMIT);

  const totalPending = Object.values(admin.pending).reduce(
    (total, count) => total + count,
    0
  );

  return (
    <>
      <AdminHeader
        title={t("admin.overview.title")}
        text={
          totalPending > 0
            ? t("admin.overview.waiting", {
                count: totalPending,
              })
            : t("admin.overview.allDone")
        }
      />

      <div className="admin-stats">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            className={`admin-stat admin-stat--${card.id}`}
          >
            <span
              className="admin-stat__icon"
              aria-hidden="true"
            >
              <Icon name={card.icon} size={22} />
            </span>

            <strong className="admin-stat__value">
              {card.value}
            </strong>

            <span className="admin-stat__label">
              {card.label ??
                t(`admin.overview.cards.${card.id}`)}
            </span>
          </Link>
        ))}
      </div>

      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t("admin.overview.recent")}
        </h2>

        {recent.length === 0 ? (
          <p className="admin-panel__empty">
            {t("admin.overview.noRecent")}
          </p>
        ) : (
          <ul className="admin-recent">
            {recent.map((item) => (
              <li
                key={item.id}
                className="admin-recent__item"
              >
                <span
                  className={`admin-recent__dot is-${item.status}`}
                  aria-hidden="true"
                />

                <span className="admin-recent__kind">
                  {item.kind === "sound" || item.kind === "scene"
                    ? t(`uploads.admin.kind.${item.kind}`)
                    : t(
                        `admin.overview.kinds.${item.kind}`
                      )}
                </span>

                <bdi className="admin-recent__label">
                  {item.label}
                </bdi>

                <span className="admin-recent__status">
                  {t(`admin.status.${item.status}`)}
                </span>

                <span className="admin-recent__time">
                  {formatTimeAgo(
                    item.reviewedAt,
                    language
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="admin-tip">
        <Icon name="link" size={16} />

        {t("admin.overview.tip")}
      </p>
    </>
  );
}

export default AdminOverview;