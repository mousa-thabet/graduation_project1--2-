import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon/Icon.jsx";
import { useMySounds } from "../../hooks/useMySounds.js";
import { useMyScenes } from "../../hooks/useMyScenes.js";
import { filterByStatus } from "../../hooks/useAdmin.js";
import { formatClock, formatTimeAgo } from "../../utils/format.js";
import { AdminHeader, DecisionBar, StatusChip, StatusFilter } from "./AdminShared.jsx";
import "./Admin.css";
import "./AdminRequests.css";

// فلتر النوع: الكل، الأصوات، الخلفيات
const KINDS = ["all", "sound", "scene"];

// أسباب الرفض لكل نوع (نصوصها بـ uploads.reasons)
const REASONS = {
  sound: ["unsuitable", "quality", "rights"],
  scene: ["unsuitable", "quality", "rights", "inappropriate"],
};

const toMegabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// أيقونة الطلب: صوت، صورة، أو فيديو
const iconOf = (item) => (item.kind === "sound" ? "music" : item.mediaType === "image" ? "image" : "film");

/**
 * معاينة الملف: مشغّل للصوت، والخلفية صورة أو فيديو (بتنفتح كاملة بتبويب جديد).
 */
function RequestPreview({ item }) {
  const { t } = useTranslation();

  if (!item.url) return <p className="admin-card__text">{t("uploads.admin.missing")}</p>;

  if (item.kind === "sound") {
    return <audio className="upload-request__audio" controls preload="metadata" src={item.url} aria-label={item.name} />;
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener"
      className="upload-request__media"
      aria-label={t("uploads.admin.open")}
      title={t("uploads.admin.open")}
    >
      {item.mediaType === "image" ? (
        <img src={item.url} alt={item.name} />
      ) : (
        <video src={item.url} controls muted loop playsInline preload="metadata" />
      )}
    </a>
  );
}

/**
 * طلب واحد: الاسم، مين رفعه، النوع والحجم والوقت، المعاينة، الحالة، وأزرار القرار.
 * onReview(isApproved, reason)
 */
function RequestCard({ item, onReview }) {
  const { t, i18n } = useTranslation();

  const meta = [
    item.uploader?.name ?? item.uploader?.handle ?? t("uploads.admin.unknown"),
    item.kind === "sound" ? t("uploads.admin.kind.sound") : t(`uploads.scenes.${item.mediaType}`),
    item.kind === "sound" && item.duration != null && formatClock(item.duration),
    toMegabytes(item.size),
    formatTimeAgo(item.createdAt, i18n.resolvedLanguage),
  ].filter(Boolean);

  // سبب الرفض: مفتاح (الجديد) أو نص جاهز (الطلبات القديمة)
  const reasonLabel = item.reasonText || (item.reason ? t(`uploads.reasons.${item.reason}`) : null);

  return (
    <li className={`admin-card upload-request is-${item.status}`}>
      <div className="admin-card__head">
        <span className="admin-card__icon" aria-hidden="true">
          <Icon name={iconOf(item)} size={22} />
        </span>
        <div className="admin-card__heading">
          <h2 dir="auto">{item.name}</h2>
          <p>
            <bdi>{meta.join(" · ")}</bdi>
          </p>
        </div>
        <span className={`upload-request__kind is-${item.kind}`}>{t(`uploads.admin.kind.${item.kind}`)}</span>
      </div>

      <RequestPreview item={item} />

      <StatusChip status={item.status} reviewedAt={item.reviewedAt} reasonLabel={reasonLabel} />

      {item.status === "pending" && (
        <DecisionBar
          reasons={REASONS[item.kind]}
          reasonLabel={(reason) => t(`uploads.reasons.${reason}`)}
          onApprove={() => onReview(true)}
          onReject={(reason) => onReview(false, reason)}
        />
      )}
    </li>
  );
}

/**
 * طلبات الرفع: /admin/requests
 * كل الأصوات والخلفيات اللي رفعها الطلاب بمكان واحد، مع فلتر للنوع وللحالة.
 * القبول بيضيف الملف لمكتبة الطالب وجلسته، والرفض بيحتاج سبب. وبالحالتين بيوصله إشعار.
 */
function AdminRequests() {
  const { t } = useTranslation();
  const sounds = useMySounds();
  const scenes = useMyScenes();
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("pending");

  const all = [
    ...sounds.sounds.map((item) => ({ ...item, kind: "sound" })),
    ...scenes.scenes.map((item) => ({ ...item, kind: "scene" })),
  ];
  const ofKind = kind === "all" ? all : all.filter((item) => item.kind === kind);
  const visible = filterByStatus(ofKind, status);
  const pendingOf = (value) =>
    all.filter((item) => item.status === "pending" && (value === "all" || item.kind === value)).length;

  function review(item, isApproved, reason) {
    if (item.kind === "sound") sounds.reviewSound(item.id, isApproved, reason);
    else scenes.reviewScene(item.id, isApproved, reason);
  }

  return (
    <>
      <AdminHeader title={t("uploads.admin.title")} text={t("uploads.admin.text")}>
        {/* النوع (مع عدد اللي بيستنى قرار بكل نوع) */}
        <div className="admin-filter" role="tablist" aria-label={t("uploads.admin.kindLabel")}>
          {KINDS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              className={`admin-filter__chip ${kind === item ? "is-active" : ""}`}
              onClick={() => setKind(item)}
            >
              {item !== "all" && <Icon name={item === "sound" ? "music" : "image"} size={14} />}
              {t(`uploads.admin.kinds.${item}`)}
              {pendingOf(item) > 0 && <span className="admin-filter__count">{pendingOf(item)}</span>}
            </button>
          ))}
        </div>

        <StatusFilter statuses={["pending", "approved", "rejected"]} items={ofKind} value={status} onChange={setStatus} />
      </AdminHeader>

      {visible.length > 0 ? (
        <ul className="admin-list">
          {visible.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              onReview={(isApproved, reason) => review(item, isApproved, reason)}
            />
          ))}
        </ul>
      ) : (
        <p className="admin-panel__empty">{t("uploads.admin.empty")}</p>
      )}
    </>
  );
}

export default AdminRequests;