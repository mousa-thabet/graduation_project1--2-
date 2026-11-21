import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon/Icon.jsx";
import "./AudioPlayer.css";

// عدد أعمدة الموجة
const BAR_COUNT = 40;

// حدث نرسله عند التشغيل حتى تتوقف باقي المشغّلات
const PLAY_EVENT = "areatk-audio-play";

// أطوال أعمدة الموجة: تُحسب من اسم الملف، فنفس الملف له نفس الشكل دائمًا
function getBars(seed) {
  let hash = [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

  return Array.from({ length: BAR_COUNT }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0;
    return 0.25 + ((hash % 1000) / 1000) * 0.75;
  });
}

// 75 ← "1:15"
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

/**
 * مشغّل الألحان: زر تشغيل + موجة صوت يمكن الضغط عليها للتقديم.
 * title: اسم اللحن (يظهر فوق الموجة)
 */
function AudioPlayer({ src, title }) {
  const { t } = useTranslation();
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  const bars = getBars(title ?? src);
  const progress = duration ? currentTime / duration : 0;

  // مشغّل واحد فقط يعمل في نفس الوقت
  useEffect(() => {
    const audio = audioRef.current;

    function handleOtherPlay(event) {
      if (event.detail !== audio) audio.pause();
    }

    document.addEventListener(PLAY_EVENT, handleOtherPlay);
    return () => document.removeEventListener(PLAY_EVENT, handleOtherPlay);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;

    if (audio.paused) {
      document.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: audio }));
      audio.play().catch(() => setHasError(true));
    } else {
      audio.pause();
    }
  }

  function seekTo(time) {
    const audio = audioRef.current;
    audio.currentTime = Math.min(Math.max(time, 0), duration);
    setCurrentTime(audio.currentTime);
  }

  // الضغط على الموجة ينقل التشغيل لذلك المكان
  function handleWaveClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo(((event.clientX - rect.left) / rect.width) * duration);
  }

  // الأسهم تقدّم وترجّع 5 ثوانٍ
  function handleWaveKeyDown(event) {
    if (event.key === "ArrowRight") seekTo(currentTime + 5);
    if (event.key === "ArrowLeft") seekTo(currentTime - 5);
  }

  return (
    <div className={`audio-player ${isPlaying ? "is-playing" : ""}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.target.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setCurrentTime(0)}
        onError={() => setHasError(true)}
      />

      <button
        type="button"
        className="audio-player__play"
        aria-label={isPlaying ? t("studyApp.audio.pause") : t("studyApp.audio.play")}
        disabled={hasError}
        onClick={togglePlay}
      >
        <Icon name={isPlaying ? "pause" : "play"} size={20} />
      </button>

      <div className="audio-player__main">
        <span className="audio-player__title">
          <Icon name="music" size={14} />
          {hasError ? t("studyApp.audio.error") : title}
        </span>

        {/* الموجة: الأعمدة التي شُغّلت تتلوّن */}
        <div
          className="audio-player__wave"
          dir="ltr"
          role="slider"
          tabIndex={0}
          aria-label={t("studyApp.audio.seek")}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={formatTime(currentTime)}
          onClick={handleWaveClick}
          onKeyDown={handleWaveKeyDown}
        >
          {bars.map((height, index) => (
            <span
              key={index}
              className={`audio-player__bar ${(index + 0.5) / BAR_COUNT <= progress ? "is-played" : ""}`}
              style={{ "--height": height, "--index": index }}
            />
          ))}
        </div>
      </div>

      <span className="audio-player__time" dir="ltr">
        {formatTime(isPlaying || currentTime ? currentTime : duration)}
      </span>
    </div>
  );
}

export default AudioPlayer;