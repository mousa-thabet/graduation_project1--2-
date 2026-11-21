import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../../components/Icon/Icon.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";
import ReportDialog from "../../../../components/ReportDialog/ReportDialog.jsx";
import StudyHeader from "../../StudyHeader/StudyHeader.jsx";
import EmptyState from "../../EmptyState/EmptyState.jsx";
import StreamCard from "../StreamCard/StreamCard.jsx";
import { profilePath } from "../../../../data/studyPeople.js";
import { getMedia } from "../../../../utils/mediaStore.js";
import { formatDuration } from "../../../../utils/streams.js";
import { formatCount, formatTimeAgo } from "../../../../utils/format.js";
// ستايلات من صفحات ثانية (الصفحة بتنزل لحالها، فلازم تستوردهم بنفسها):
// رسالة "تم" من بطاقة المنشور، وصاحب البث (الصورة والاسم) من غرفة البث المباشر
import "../../Posts/PostCard/PostCard.css";
import "../StreamRoom/StreamRoom.css";
import "./StreamReplay.css";

const TOAST_TIME = 2500;
const MORE_COUNT = 4;

/**
 * فيديو مسجّل بالمتصفح: نقرأه من IndexedDB ونحوّله لرابط مؤقت (Object URL).
 * فيديو MediaRecorder لا يحفظ مدته، فالمتصفح يعرض مدة لا نهائية (Infinity)،
 * لذلك نقفز لآخر الفيديو مرة واحدة حتى يحسب المدة، ثم نرجع للبداية.
 */
function SavedVideo({ mediaId }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let isCancelled = false;

    getMedia(mediaId).then((blob) => {
      if (isCancelled) return;
      if (!blob) {
        setIsMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    // عند الخروج نحرر الرابط المؤقت من الذاكرة
    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  function fixDuration(event) {
    const video = event.currentTarget;
    if (video.duration !== Infinity) return;

    video.currentTime = Number.MAX_SAFE_INTEGER;
    video.addEventListener(
      "timeupdate",
      () => {
        video.currentTime = 0;
      },
      { once: true }
    );
  }

  if (isMissing) {
    return (
      <div className="replay-player__state">
        <Icon name="videoOff" size={32} />
        <span>{t("studyApp.streams.replay.noVideo")}</span>
      </div>
    );
  }

  if (!url) return <div className="replay-player__state" aria-busy="true" />;

  return <video className="replay-player__video" src={url} controls playsInline onLoadedMetadata={fixDuration} />;
}

/**
 * صفحة مشاهدة بث مسجّل: الفيديو، صاحب البث، الإعجاب، نسخ الرابط، الإبلاغ أو الحذف، وتسجيلات أخرى.
 */
function StreamReplay() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { recordingId } = useParams();
  const { streams, profile } = useOutletContext();
  const [toast, setToast] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const language = i18n.resolvedLanguage;
  const recording = streams.recordings.find((item) => item.id === recordingId);

  // الرسالة الصغيرة تختفي وحدها
  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => setToast(null), TOAST_TIME);
    return () => clearTimeout(timeout);
  }, [toast]);

  // "متأكد؟" ترجع لطبيعتها بعد ثوانٍ
  useEffect(() => {
    if (!isConfirmingDelete) return;

    const timeout = setTimeout(() => setIsConfirmingDelete(false), 3000);
    return () => clearTimeout(timeout);
  }, [isConfirmingDelete]);

  if (!recording) {
    return (
      <>
        <StudyHeader title={t("studyApp.nav.streams")} backTo="/study/streams" />
        <EmptyState
          icon="film"
          title={t("studyApp.streams.replay.notFound")}
          text={t("studyApp.streams.replay.notFoundText")}
        >
          <Link to="/study/streams" className="room-ended__link">
            {t("studyApp.streams.room.backToStreams")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const host = recording.isMine ? profile.me : recording.host;

  // تسجيلات أخرى: من نفس المجال أولًا
  const more = streams.recordings
    .filter((item) => item.id !== recording.id)
    .sort((a, b) => Number(b.field === recording.field) - Number(a.field === recording.field) || b.endedAt - a.endedAt)
    .slice(0, MORE_COUNT);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast(t("studyApp.streams.replay.copied"));
    } catch {
      setToast(t("studyApp.streams.replay.copyFailed"));
    }
  }

  function handleDelete() {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    streams.deleteRecording(recording.id);
    navigate("/study/streams", { replace: true });
  }

  return (
    <>
      <StudyHeader title={recording.title} backTo="/study/streams" />

      {/* ----- الفيديو ----- */}
      <div className={`replay-player stream-cover--${recording.field}`}>
        {recording.src ? (
          <video className="replay-player__video" src={recording.src} controls playsInline />
        ) : recording.mediaId && !recording.isReady ? (
          // التسجيل ما زال يُحفظ (لحظات بعد إنهاء البث)
          <div className="replay-player__state">
            <span className="replay-player__spinner" aria-hidden="true" />
            <span>{t("studyApp.streams.replay.processing")}</span>
          </div>
        ) : recording.mediaId ? (
          <SavedVideo key={recording.mediaId} mediaId={recording.mediaId} />
        ) : (
          // بث بدون كاميرا: لا يوجد فيديو
          <div className="replay-player__state">
            <Icon name="videoOff" size={32} />
            <span>{t("studyApp.streams.replay.noVideo")}</span>
          </div>
        )}
      </div>

      {/* ----- المعلومات ----- */}
      <section className="replay-info">
        <h2 className="replay-info__title" dir="auto">
          {recording.title}
        </h2>
        <p className="replay-info__meta">
          {t("studyApp.streams.views", { count: recording.views })} · {formatTimeAgo(recording.endedAt, language)} ·{" "}
          <span dir="ltr">{formatDuration(Math.round(recording.duration * 60))}</span> ·{" "}
          {t(`studyApp.streams.fields.${recording.field}`)}
        </p>

        <div className="replay-info__bar">
          <Link to={profilePath(host.handle)} className="room-host">
            <span className="room-host__avatar" aria-hidden="true">
              <Avatar person={host} />
            </span>
            <span className="room-host__text">
              <strong dir="auto">{host.name}</strong>
              <span dir="ltr">@{host.handle}</span>
            </span>
          </Link>

          <div className="replay-actions">
            <button
              type="button"
              className={`replay-action ${recording.isLiked ? "is-liked" : ""}`}
              aria-pressed={recording.isLiked}
              aria-label={t("studyApp.streams.replay.like")}
              onClick={() => streams.toggleLike(recording.id)}
            >
              <Icon name="heart" size={18} />
              {formatCount(recording.likes, language)}
            </button>
            <button type="button" className="replay-action" onClick={copyLink}>
              <Icon name="link" size={18} />
              {t("studyApp.streams.replay.copy")}
            </button>
            {recording.isMine ? (
              <button type="button" className="replay-action is-danger" onClick={handleDelete}>
                <Icon name="trash" size={18} />
                {isConfirmingDelete ? t("studyApp.streams.replay.confirmDelete") : t("studyApp.streams.replay.delete")}
              </button>
            ) : (
              <button
                type="button"
                className="replay-action"
                aria-label={t("studyApp.streams.room.report")}
                title={t("studyApp.streams.room.report")}
                onClick={() => setIsReporting(true)}
              >
                <Icon name="flag" size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ----- تسجيلات أخرى ----- */}
      {more.length > 0 && (
        <section className="replay-more">
          <h2 className="replay-more__title">{t("studyApp.streams.replay.more")}</h2>
          <div className="stream-grid">
            {more.map((item) => (
              <StreamCard key={item.id} stream={item} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {toast && (
        <div className="post-toast" role="status">
          {toast}
        </div>
      )}

      {isReporting && (
        <ReportDialog
          onSubmit={() => {
            setIsReporting(false);
            setToast(t("studyApp.profile.reported"));
          }}
          onClose={() => setIsReporting(false)}
        />
      )}
    </>
  );
}

export default StreamReplay;