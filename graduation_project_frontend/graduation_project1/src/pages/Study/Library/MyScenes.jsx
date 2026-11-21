import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import { SceneBackground } from "../Session/SessionScene/SessionScene.jsx";
import { SCENE_ACCEPT, sceneMediaType } from "../../../hooks/useMyScenes.js";
import "./MyScenes.css";

const MAX_NAME = 40;

// أيقونة كل حالة
const STATUS_ICONS = { pending: "clock", approved: "check", rejected: "x" };

const toMegabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * نموذج رفع خلفية: صورة أو فيديو (بدون حد للحجم) مع معاينة، والاسم.
 * onUpload(file, name): الرفع نفسه  •  onClose: إلغاء
 */
function UploadSceneForm({ onUpload, onClose }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // رابط المعاينة بيتحرّر من الذاكرة لما يتغيّر الملف أو يتسكّر النموذج
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFile(event) {
    const chosen = event.target.files[0];
    // حتى لو اختار نفس الملف مرة ثانية يوصلنا الحدث
    event.target.value = "";
    if (!chosen) return;

    if (!sceneMediaType(chosen)) {
      setError(t("uploads.scenes.errors.type"));
      return;
    }

    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
    setError(null);
    // اسم الملف بدون الامتداد كاسم مبدئي
    if (!name) setName(chosen.name.replace(/\.[^.]+$/, "").slice(0, MAX_NAME));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError(t("uploads.scenes.errors.file"));
      return;
    }
    if (!name.trim()) {
      setError(t("uploads.scenes.errors.name"));
      return;
    }

    setIsSending(true);
    try {
      await onUpload(file, name.trim());
    } catch {
      setError(t("uploads.scenes.errors.save"));
      setIsSending(false);
    }
  }

  const mediaType = file ? sceneMediaType(file) : null;

  return (
    <form className="upload-form" noValidate onSubmit={handleSubmit}>
      <label className={`upload-form__file ${file ? "has-file" : ""}`}>
        <Icon name={file ? (mediaType === "image" ? "image" : "film") : "upload"} size={22} />
        <span>
          <strong dir="auto">{file ? file.name : t("uploads.scenes.choose")}</strong>
          <span>
            {file ? `${t(`uploads.scenes.${mediaType}`)} · ${toMegabytes(file.size)}` : t("uploads.scenes.formats")}
          </span>
        </span>
        <input type="file" accept={SCENE_ACCEPT} hidden onChange={handleFile} />
      </label>

      {/* معاينة الخلفية زي ما رح تبين بالجلسة */}
      {previewUrl && (
        <span className="my-scene-preview">
          <SceneBackground scene={{ id: "preview", src: previewUrl, mediaType }} />
        </span>
      )}

      <label className="upload-form__field">
        <span>
          {t("uploads.scenes.name")}
          <span className="upload-form__count">
            {name.length}/{MAX_NAME}
          </span>
        </span>
        <input
          type="text"
          value={name}
          maxLength={MAX_NAME}
          dir="auto"
          placeholder={t("uploads.scenes.namePlaceholder")}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
      </label>

      <p className="upload-form__note">
        <Icon name="shield" size={14} />
        {t("uploads.scenes.note")}
      </p>

      {error && (
        <p className="upload-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="upload-form__actions">
        <button type="button" className="upload-form__cancel" onClick={onClose}>
          {t("studyApp.library.upload.cancel")}
        </button>
        <button type="submit" className="upload-form__send" disabled={isSending}>
          <Icon name="send" size={16} />
          {t("studyApp.library.upload.send")}
        </button>
      </div>
    </form>
  );
}

/**
 * خلفية رفعتها: معاينة صغيرة، الاسم، الحالة (وسبب الرفض)، وحذف بضغطتين.
 */
function MySceneCard({ scene, onDelete }) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  // التأكيد بيرجع لحاله بعد 3 ثواني
  useEffect(() => {
    if (!isConfirming) return;
    const timeout = setTimeout(() => setIsConfirming(false), 3000);
    return () => clearTimeout(timeout);
  }, [isConfirming]);

  return (
    <li className={`my-scene is-${scene.status}`}>
      <span className="my-scene__preview">
        {scene.url ? (
          <SceneBackground scene={{ id: scene.id, src: scene.url, mediaType: scene.mediaType }} />
        ) : (
          <Icon name={scene.mediaType === "image" ? "image" : "film"} size={24} />
        )}
        <span className="my-scene__type">
          <Icon name={scene.mediaType === "image" ? "image" : "video"} size={12} />
          {t(`uploads.scenes.${scene.mediaType}`)}
        </span>
      </span>

      <div className="my-scene__info">
        <strong dir="auto">{scene.name}</strong>
        <span className={`my-sound__status is-${scene.status}`}>
          <Icon name={STATUS_ICONS[scene.status]} size={12} strokeWidth={2.5} />
          {t(`studyApp.library.status.${scene.status}`)}
        </span>

        {scene.status === "approved" && <span className="my-scene__hint">{t("uploads.scenes.approvedHint")}</span>}
        {scene.status === "rejected" && (
          <span className="my-scene__hint">
            {t([`uploads.reasons.${scene.reason}`, "studyApp.library.status.rejected"])}
          </span>
        )}
      </div>

      <button
        type="button"
        className={`my-sound__delete my-scene__delete ${isConfirming ? "is-confirming" : ""}`}
        aria-label={t("uploads.scenes.delete")}
        title={t("uploads.scenes.delete")}
        onClick={() => (isConfirming ? onDelete(scene.id) : setIsConfirming(true))}
      >
        {isConfirming ? t("studyApp.library.upload.confirmDelete") : <Icon name="trash" size={16} />}
      </button>
    </li>
  );
}

/**
 * خلفياتي بتبويب "الخلفيات" بالمكتبة: رفع خلفية جديدة (صورة أو فيديو) والخلفيات اللي رفعتها مع حالتها.
 * myScenes: من useMyScenes  •  onSent: بعد ما توصل الخلفية للإدارة (لرسالة التأكيد)
 */
function MyScenes({ myScenes, onSent }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file, name) {
    await myScenes.upload(file, name);
    setIsUploading(false);
    onSent();
  }

  return (
    <>
      <h2 className="library-group">{t("uploads.scenes.mine")}</h2>

      {isUploading ? (
        <UploadSceneForm onUpload={handleUpload} onClose={() => setIsUploading(false)} />
      ) : (
        <button type="button" className="library-upload" onClick={() => setIsUploading(true)}>
          <span className="library-upload__icon">
            <Icon name="upload" size={22} />
          </span>
          <span className="library-upload__text">
            <strong>{t("uploads.scenes.uploadTitle")}</strong>
            <span>{t("uploads.scenes.uploadText")}</span>
          </span>
          <Icon name="plus" size={20} />
        </button>
      )}

      {myScenes.scenes.length > 0 ? (
        <ul className="my-scenes">
          {myScenes.scenes.map((scene) => (
            <MySceneCard key={scene.id} scene={scene} onDelete={myScenes.remove} />
          ))}
        </ul>
      ) : (
        !isUploading && <p className="library-empty">{t("uploads.scenes.empty")}</p>
      )}
    </>
  );
}

export default MyScenes;