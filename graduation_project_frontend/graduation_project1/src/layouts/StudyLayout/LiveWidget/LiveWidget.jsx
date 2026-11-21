import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StreamThumb from "../../../pages/Study/Streams/StreamThumb/StreamThumb.jsx";
import { useNow } from "../../../hooks/useNow.js";
import { formatDuration, getRoomTimer } from "../../../utils/streams.js";
import "./LiveWidget.css";

/**
 * "أنت في بث": بطاقة صغيرة عائمة تظهر في باقي الصفحات وأنت داخل بث.
 * الضغط عليها يرجعك للبث، والزر يخرجك منه (أو ينهيه إن كان بثك).
 * isStacked: جلستي شغالة أيضًا، فنرفع البطاقة فوق مؤقت الجلسة
 */
function LiveWidget({ streams, isStacked }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const room = streams.activeRoom;
  const now = useNow();
  const timer = getRoomTimer(room, now);

  // "متأكد؟" ترجع لطبيعتها بعد ثوانٍ
  useEffect(() => {
    if (!isConfirming) return;

    const timeout = setTimeout(() => setIsConfirming(false), 3000);
    return () => clearTimeout(timeout);
  }, [isConfirming]);

  function handleExit() {
    if (!room.isMine) {
      streams.leave();
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    const recordingId = streams.endStream();
    if (recordingId) navigate(`/study/streams/replay/${recordingId}`);
  }

  return (
    <div className={`live-widget ${isStacked ? "is-stacked" : ""}`} role="status">
      <Link to={`/study/streams/live/${room.id}`} className="live-widget__link" aria-label={t("studyApp.streams.widget.open")}>
        <StreamThumb stream={room} className="live-widget__thumb" />
        <span className="live-widget__text">
          <strong dir="auto">{room.title}</strong>
          <span>
            <span className="live-widget__dot" aria-hidden="true" />
            {t(`studyApp.streams.phases.${timer.phase}`)} · <span dir="ltr">{formatDuration(timer.secondsLeft)}</span>
          </span>
        </span>
      </Link>

      <button
        type="button"
        className={`live-widget__exit ${isConfirming ? "is-confirming" : ""}`}
        aria-label={room.isMine ? t("studyApp.streams.room.end") : t("studyApp.streams.room.leave")}
        title={room.isMine ? t("studyApp.streams.room.end") : t("studyApp.streams.room.leave")}
        onClick={handleExit}
      >
        {isConfirming ? t("studyApp.streams.room.confirmEnd") : <Icon name={room.isMine ? "x" : "logOut"} size={18} />}
      </button>
    </div>
  );
}

export default LiveWidget;