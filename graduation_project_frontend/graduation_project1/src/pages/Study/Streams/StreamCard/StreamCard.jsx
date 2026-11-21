import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../../components/Icon/Icon.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";
import StreamThumb from "../StreamThumb/StreamThumb.jsx";
import { formatCount, formatTimeAgo } from "../../../../utils/format.js";
import { formatDuration, getRoomTimer } from "../../../../utils/streams.js";
import "./StreamCard.css";

/**
 * بطاقة بث مثل يوتيوب: صورة الواجهة، ثم صاحب البث والعنوان.
 * مباشر: المؤقت المشترك وعدد المشاهدين  •  مسجّل: المدة والمشاهدات
 * stream: البث أو التسجيل  •  isLive: مباشر أم مسجّل  •  now: الوقت الحالي (للمؤقت)
 */
function StreamCard({ stream, isLive, now }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const timer = isLive ? getRoomTimer(stream, now) : null;
  const path = isLive ? `/study/streams/live/${stream.id}` : `/study/streams/replay/${stream.id}`;

  return (
    <Link to={path} className={`stream-card ${stream.isMine ? "is-mine" : ""}`}>
      <StreamThumb stream={stream} className="stream-card__cover">
        {isLive ? (
          <>
            <span className="stream-badge stream-badge--live">{t("studyApp.streams.live")}</span>
            <span className="stream-card__viewers">
              <Icon name="eye" size={14} />
              {formatCount(stream.viewers, language)}
            </span>
            <span className={`stream-card__timer is-${timer.phase}`}>
              {t(`studyApp.streams.phases.${timer.phase}`)} ·{" "}
              <span dir="ltr">{formatDuration(timer.secondsLeft)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="stream-card__play" aria-hidden="true">
              <Icon name="play" size={22} />
            </span>
            <span className="stream-card__duration" dir="ltr">
              {formatDuration(Math.round(stream.duration * 60))}
            </span>
          </>
        )}

        {stream.isMine && (
          <span className={`stream-card__mine ${isLive ? "is-live" : ""}`}>{t("studyApp.streams.yours")}</span>
        )}
      </StreamThumb>

      {/* المعلومات */}
      <div className="stream-card__body">
        <span className="stream-card__avatar" aria-hidden="true">
          <Avatar person={stream.host} />
        </span>
        <div className="stream-card__text">
          <strong className="stream-card__title" dir="auto">
            {stream.title}
          </strong>
          <span className="stream-card__meta">
            <bdi>{stream.host.name}</bdi> ·{" "}
            {isLive
              ? t("studyApp.streams.plan", { focus: stream.timer.focus, break: stream.timer.break })
              : `${t("studyApp.streams.views", { count: stream.views })} · ${formatTimeAgo(stream.endedAt, language)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default StreamCard;