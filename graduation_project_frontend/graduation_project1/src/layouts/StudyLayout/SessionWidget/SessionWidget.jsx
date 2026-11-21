import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import { formatClock } from "../../../utils/format.js";
import "./SessionWidget.css";

/**
 * "جلستك شغالة": مؤقت صغير عائم يظهر في باقي الصفحات أثناء الجلسة.
 * الضغط عليه يرجع لصفحة جلستي.
 */
function SessionWidget({ timer }) {
  const { t } = useTranslation();
  const isRunning = timer.status === "running";
  const progress = 1 - timer.secondsLeft / timer.totalSeconds;

  return (
    <div className={`session-widget session-widget--${timer.phase}`} role="status">
      <Link to="/study/session" className="session-widget__link" aria-label={t("studyApp.session.widget.open")}>
        {/* دائرة صغيرة تمتلئ مع الوقت */}
        <span className="session-widget__ring" style={{ "--progress": progress }} aria-hidden="true" />
        <span className="session-widget__text">
          <strong dir="ltr">{formatClock(timer.secondsLeft)}</strong>
          <span>{t(`studyApp.session.phases.${timer.phase}`)}</span>
        </span>
      </Link>

      <button
        type="button"
        className="session-widget__button"
        aria-label={isRunning ? t("studyApp.session.pause") : t("studyApp.session.resume")}
        onClick={isRunning ? timer.pause : timer.start}
      >
        <Icon name={isRunning ? "pause" : "play"} size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default SessionWidget;