import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import { formatClock } from "../../../../utils/format.js";
import "./SessionScene.css";

// دائرة المؤقت
const RADIUS = 96;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// الخلفية: مشهد CSS متحرك، أو فيديو، أو صورة (mediaType: "image" للخلفيات اللي رفعها الطالب)
export function SceneBackground({ scene }) {
  const isImage = scene.mediaType === "image" && scene.src;

  return (
    <div
      className={`scene-bg scene-bg--${scene.id}`}
      style={isImage ? { background: `center / cover no-repeat url("${scene.src}")` } : undefined}
      aria-hidden="true"
    >
      {scene.src && !isImage && <video src={scene.src} autoPlay muted loop playsInline />}
    </div>
  );
}

// اختصارات الكيبورد: نستخدم event.code (مكان الزر) وليس event.key (الحرف)
// حتى تعمل الاختصارات والكيبورد عربي أيضًا
const SHORTCUTS = [
  { code: "Space", label: "Space", action: "playPause" },
  { code: "KeyF", label: "F", action: "fullscreen" },
  { code: "KeyM", label: "M", action: "mute" },
  { code: "KeyN", label: "N", action: "next" },
  { code: "KeyR", label: "R", action: "reset" },
];

/**
 * المشهد الرئيسي في جلستي: الخلفية، دائرة المؤقت، الهدف، المرحلة التالية، وأزرار التحكم.
 * وضع التركيز يعرض المشهد بملء الشاشة، والاختصارات تعمل من الكيبورد.
 *
 * الوضع المصغّر: لما تبدأ الجلسة يصغر المشهد لشريط ويثبت أعلى الشاشة (sticky)،
 * فتقدر تنزل لباقي الصفحة والمؤقت قدامك. زر التكبير/التصغير يبدّل بين الشكلين.
 */
function SessionScene({ timer, mixer, scene, goal }) {
  const { t } = useTranslation();
  const sceneRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevStatus, setPrevStatus] = useState(timer.status);

  const isRunning = timer.status === "running";
  const progress = 1 - timer.secondsLeft / timer.totalSeconds;

  // كل جلسة جديدة (من idle إلى running) تبدأ مصغّرة.
  // نعدّل الحالة أثناء الـ render عند تغيّر status (بدل useEffect) كما توصي React.
  if (prevStatus !== timer.status) {
    setPrevStatus(timer.status);
    if (prevStatus === "idle" && timer.status === "running") setIsExpanded(false);
  }

  // مصغّر: الجلسة شغالة أو موقوفة مؤقتًا، والمستخدم لم يكبّره، وليس بملء الشاشة
  const isCompact = timer.isActive && !isExpanded && !isFullscreen;

  // نعرف متى دخل أو خرج المستخدم من ملء الشاشة (حتى بزر Escape)
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === sceneRef.current);
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else sceneRef.current.requestFullscreen();
  }

  // تنفيذ اختصار الكيبورد
  useEffect(() => {
    function handleKeyDown(event) {
      // لا نتدخل أثناء الكتابة أو مع Ctrl/Alt
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.("input, textarea, select")) return;

      const shortcut = SHORTCUTS.find((item) => item.code === event.code);
      if (!shortcut) return;

      // Space على زر يضغط الزر نفسه (السلوك الطبيعي للمتصفح)
      if (shortcut.code === "Space" && event.target.closest?.("button, a, [role='slider']")) return;

      event.preventDefault();

      if (shortcut.action === "playPause") {
        if (timer.status === "running") timer.pause();
        else timer.start();
      } else if (shortcut.action === "fullscreen") {
        toggleFullscreen();
      } else if (shortcut.action === "mute") {
        mixer.toggleMute();
      } else if (shortcut.action === "next" && timer.isActive) {
        timer.skip();
      } else if (shortcut.action === "reset" && timer.status !== "idle") {
        timer.reset();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [timer, mixer]);

  // نص الزر الرئيسي حسب حالة المؤقت
  const mainLabel = isRunning
    ? t("studyApp.session.pause")
    : timer.status === "paused"
      ? t("studyApp.session.resume")
      : t("studyApp.session.start");

  return (
    <section
      ref={sceneRef}
      className={`session-scene session-scene--${timer.phase} ${isCompact ? "is-compact" : ""}`}
    >
      <SceneBackground scene={scene} />

      {/* رقم المرحلة وحالة الكتم */}
      <div className="session-scene__badges">
        <span className="session-scene__badge">
          {t("studyApp.session.segmentOf", { current: timer.index + 1, total: timer.plan.segments.length })}
        </span>
        {mixer.isMuted && (
          <span className="session-scene__badge is-muted">{t("studyApp.session.muted")}</span>
        )}
      </div>

      {/* تكبير/تصغير المؤقت: يظهر فقط والجلسة شغالة */}
      {timer.isActive && !isFullscreen && (
        <button
          type="button"
          className="session-scene__size"
          aria-label={isCompact ? t("studyApp.session.expand") : t("studyApp.session.collapse")}
          title={isCompact ? t("studyApp.session.expand") : t("studyApp.session.collapse")}
          onClick={() => setIsExpanded(isCompact)}
        >
          <Icon name={isCompact ? "chevronDown" : "chevronUp"} size={18} />
        </button>
      )}

      <button
        type="button"
        className="session-scene__fullscreen"
        aria-label={isFullscreen ? t("studyApp.session.exitFullscreen") : t("studyApp.session.fullscreen")}
        title={isFullscreen ? t("studyApp.session.exitFullscreen") : t("studyApp.session.fullscreen")}
        onClick={toggleFullscreen}
      >
        <Icon name={isFullscreen ? "x" : "maximize"} size={18} />
      </button>

      <div className="session-scene__content">
        {/* دائرة المؤقت: stroke-dashoffset يرسم الجزء المنتهي */}
        <div className="session-scene__clock">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle className="session-scene__track" cx="110" cy="110" r={RADIUS} />
            <circle
              className="session-scene__progress"
              cx="110"
              cy="110"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>

          <div className="session-scene__time">
            <span className="session-scene__phase">{t(`studyApp.session.phases.${timer.phase}`)}</span>
            <strong dir="ltr" role="timer">
              {formatClock(timer.secondsLeft)}
            </strong>
          </div>
        </div>

        {goal && <p className="session-scene__goal">{goal}</p>}

        {/* المرحلة التالية */}
        {timer.nextSegment && (
          <p className="session-scene__next">
            {t("studyApp.session.next")}{" "}
            <strong>
              {t(`studyApp.session.phases.${timer.nextSegment.kind}`)} ·{" "}
              {t("studyApp.session.minutes", { count: timer.nextSegment.minutes })}
            </strong>
          </p>
        )}

        {/* أزرار التحكم */}
        <div className="session-scene__controls">
          <button
            type="button"
            className="session-scene__control"
            aria-label={t("studyApp.session.reset")}
            title={t("studyApp.session.reset")}
            disabled={timer.status === "idle"}
            onClick={timer.reset}
          >
            <Icon name="reset" size={20} />
          </button>

          <button
            type="button"
            className="session-scene__main"
            aria-label={mainLabel}
            onClick={isRunning ? timer.pause : timer.start}
          >
            <Icon name={isRunning ? "pause" : "play"} size={26} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="session-scene__control"
            aria-label={t("studyApp.session.skip")}
            title={t("studyApp.session.skip")}
            disabled={!timer.isActive}
            onClick={timer.skip}
          >
            <Icon name="skip" size={20} />
          </button>
        </div>

        {/* دليل الاختصارات (يختفي على الموبايل) */}
        <p className="session-scene__keys">
          {SHORTCUTS.map((shortcut) => (
            <span key={shortcut.code}>
              <kbd>{shortcut.label}</kbd> {t(`studyApp.session.keys.${shortcut.action}`)}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

export default SessionScene;