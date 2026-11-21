import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import { STREAM_PLANS } from "../../../../data/studyRooms.js";
import { deviceErrorKey } from "../../../../utils/streams.js";
import { MAX_IMAGE_SIZE, makeThumbnail, thumbnailFromFile } from "../../../../utils/thumbnail.js";
import "./GoLiveDialog.css";

const MAX_TITLE = 80;

/**
 * نافذة "ابدأ بث": العنوان، صورة الواجهة، المؤقت المشترك، التسجيل، ومعاينة الكاميرا والمايك.
 * الكاميرا لا تعمل إلا إذا ضغطت "شغّل الكاميرا" (خصوصيتك أولًا).
 * onStart({ title, thumbnail, planId, isRecorded, stream }): stream كاميرتي/مايكي أو null
 * withPlan: المؤقت المشترك (بثوث ادرس معي). بث التواصل بيستخدم نفس النافذة بدونه.
 */
function GoLiveDialog({ onStart, onClose, withPlan = true }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  // صورة الواجهة (data URL) أو null
  const [thumbnail, setThumbnail] = useState(null);
  const [planId, setPlanId] = useState(STREAM_PLANS[1].id);
  const [isRecorded, setIsRecorded] = useState(true);
  // stream: الكاميرا والمايك معًا في MediaStream واحد
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  // بعد "ابدأ البث" ينتقل الـ stream للبث، فلا نطفيه عند إغلاق النافذة
  const handedOffRef = useRef(false);

  const hasCam = Boolean(stream?.getVideoTracks().length);
  const hasMic = Boolean(stream?.getAudioTracks().length);

  // عرض الكاميرا في المعاينة
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = hasCam ? stream : null;
  }, [stream, hasCam]);

  // الإغلاق بزر Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // إطفاء الكاميرا إن أُغلقت النافذة بدون بدء البث.
  // في effect منفصل بدون اعتماديات ([]) حتى لا يعمل إلا عند إغلاق النافذة فعلًا،
  // لأن onClose دالة جديدة مع كل رسم للصفحة، ولو كان هنا لأطفأ الكاميرا كل ثانية
  useEffect(() => {
    return () => {
      if (!handedOffRef.current) streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function updateStream(tracks) {
    const next = tracks.length ? new MediaStream(tracks) : null;
    streamRef.current = next;
    setStream(next);
  }

  // kind: "video" للكاميرا أو "audio" للمايك
  async function toggleDevice(kind) {
    setError(null);
    const current = stream?.getTracks() ?? [];
    const existing = current.find((track) => track.kind === kind);

    if (existing) {
      existing.stop();
      updateStream(current.filter((track) => track !== existing));
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({ [kind]: true });
      updateStream([...current, ...media.getTracks()]);
    } catch (deviceError) {
      setError(t(`studyApp.streams.goLive.errors.${deviceErrorKey(deviceError)}`));
    }
  }

  // رفع صورة واجهة من الجهاز
  async function handleThumbnailFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) {
      setError(t("studyApp.streams.goLive.errors.image"));
      return;
    }

    try {
      setThumbnail(await thumbnailFromFile(file));
      setError(null);
    } catch {
      setError(t("studyApp.streams.goLive.errors.image"));
    }
  }

  // لقطة من الكاميرا (إن كانت الصورة جاهزة)
  function takeSnapshot() {
    const video = videoRef.current;
    if (video?.videoWidth) setThumbnail(makeThumbnail(video));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError(t("studyApp.streams.goLive.errors.title"));
      return;
    }

    // بدون صورة واجهة والكاميرا شغالة: نأخذ لقطة منها تلقائيًا
    const video = videoRef.current;
    const finalThumbnail = thumbnail ?? (hasCam && video?.videoWidth ? makeThumbnail(video) : null);

    handedOffRef.current = true;
    onStart({ title: title.trim(), thumbnail: finalThumbnail, planId, isRecorded, stream });
  }

  return (
    <div className="go-live" onClick={onClose}>
      <form
        className="go-live__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="go-live-title"
        noValidate
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="go-live__head">
          <span className="go-live__icon">
            <Icon name="radio" size={22} />
          </span>
          <h2 id="go-live-title">{t("studyApp.streams.goLive.title")}</h2>
          <button
            type="button"
            className="go-live__close"
            aria-label={t("studyApp.streams.goLive.cancel")}
            onClick={onClose}
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        {/* معاينة الكاميرا: لا يراها أحد غيرك */}
        <div className="go-live__preview">
          {hasCam ? (
            <video ref={videoRef} autoPlay muted playsInline />
          ) : (
            <div className="go-live__no-cam">
              <Icon name="videoOff" size={32} />
              <span>{t("studyApp.streams.goLive.noCamera")}</span>
            </div>
          )}

          <div className="go-live__devices">
            <button
              type="button"
              className={`go-live__device ${hasCam ? "is-on" : ""}`}
              aria-pressed={hasCam}
              onClick={() => toggleDevice("video")}
            >
              <Icon name={hasCam ? "video" : "videoOff"} size={18} />
              {hasCam ? t("studyApp.streams.goLive.cameraOff") : t("studyApp.streams.goLive.cameraOn")}
            </button>
            <button
              type="button"
              className={`go-live__device ${hasMic ? "is-on" : ""}`}
              aria-pressed={hasMic}
              onClick={() => toggleDevice("audio")}
            >
              <Icon name={hasMic ? "mic" : "micOff"} size={18} />
              {hasMic ? t("studyApp.streams.goLive.micOff") : t("studyApp.streams.goLive.micOn")}
            </button>
          </div>
          {hasCam && <span className="go-live__private">{t("studyApp.streams.goLive.preview")}</span>}
        </div>

        {/* العنوان */}
        <label className="go-live__field">
          <span className="go-live__label">
            {t("studyApp.streams.goLive.name")}
            <span className="go-live__count">
              {title.length}/{MAX_TITLE}
            </span>
          </span>
          <input
            type="text"
            value={title}
            maxLength={MAX_TITLE}
            dir="auto"
            autoFocus
            placeholder={t("studyApp.streams.goLive.namePlaceholder")}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
          />
        </label>

        {/* صورة الواجهة (مثل يوتيوب) */}
        <div className="go-live__field">
          <span className="go-live__label">{t("studyApp.streams.goLive.thumbnail")}</span>
          <div className="go-live__thumb-row">
            <div className="go-live__thumb">
              {thumbnail ? (
                <img src={thumbnail} alt={t("studyApp.streams.goLive.thumbnail")} />
              ) : (
                <span className="go-live__thumb-empty">
                  <Icon name="image" size={24} />
                  {t("studyApp.streams.goLive.noThumbnail")}
                </span>
              )}
            </div>

            <div className="go-live__thumb-actions">
              {/* label يفتح اختيار الملف عند الضغط عليه */}
              <label className="go-live__thumb-button">
                <Icon name="upload" size={16} />
                {t("studyApp.streams.goLive.upload")}
                <input type="file" accept="image/*" hidden onChange={handleThumbnailFile} />
              </label>
              {hasCam && (
                <button type="button" className="go-live__thumb-button" onClick={takeSnapshot}>
                  <Icon name="camera" size={16} />
                  {t("studyApp.streams.goLive.snapshot")}
                </button>
              )}
              {thumbnail && (
                <button type="button" className="go-live__thumb-button is-danger" onClick={() => setThumbnail(null)}>
                  <Icon name="trash" size={16} />
                  {t("studyApp.streams.goLive.removeThumbnail")}
                </button>
              )}
            </div>
          </div>
          <span className="go-live__hint">{t("studyApp.streams.goLive.thumbnailHint")}</span>
        </div>

        {/* المؤقت المشترك (ادرس معي بس) */}
        {withPlan && (
          <fieldset className="go-live__field">
            <legend className="go-live__label">{t("studyApp.streams.goLive.plan")}</legend>
            <div className="go-live__chips">
              {STREAM_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className="go-live__chip"
                  aria-pressed={planId === plan.id}
                  onClick={() => setPlanId(plan.id)}
                >
                  {t("studyApp.streams.goLive.planOption", { focus: plan.focus, break: plan.break })}
                </button>
              ))}
            </div>
            <span className="go-live__hint">{t("studyApp.streams.goLive.planHint")}</span>
          </fieldset>
        )}

        {/* التسجيل */}
        <label className="go-live__switch">
          <span>
            <strong>{t("studyApp.streams.goLive.record")}</strong>
            <span className="go-live__hint">{t("studyApp.streams.goLive.recordHint")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={isRecorded}
            onChange={(event) => setIsRecorded(event.target.checked)}
          />
        </label>

        {error && (
          <p className="go-live__error" role="alert">
            {error}
          </p>
        )}

        <div className="go-live__actions">
          <button type="button" className="go-live__cancel" onClick={onClose}>
            {t("studyApp.streams.goLive.cancel")}
          </button>
          <button type="submit" className="go-live__start">
            <span className="go-live__dot" aria-hidden="true" />
            {t("studyApp.streams.goLive.start")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GoLiveDialog;