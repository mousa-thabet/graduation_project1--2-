import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Link,
  useOutletContext,
  useSearchParams,
} from "react-router";

import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import MyScenes from "./MyScenes.jsx";
import MyLibraryTab, { SaveButton } from "./MyLibraryTab.jsx";

import {
  SceneBackground,
} from "../Session/SessionScene/SessionScene.jsx";

import {
  COMMUNITY_SOUNDS,
  SESSION_SOUNDS,
} from "../../../data/sessionSounds.js";

import { getSceneName } from "../../../data/sessionScenes.js";
import { profilePath } from "../../../data/studyPeople.js";
import { formatClock } from "../../../utils/format.js";

import {
  getSoundName,
  readAudioDuration,
} from "../../../utils/sounds.js";

// رسالة "تم" (post-toast) ستايلها مع بطاقة المنشور (الصفحة بتنزل لحالها، فلازم تستورده بنفسها)
import "../Posts/PostCard/PostCard.css";
import "./Library.css";

// الأصوات، الخلفيات، ومكتبتي (اللي اخترته وبنقله لجلستي)
const TABS = ["sounds", "scenes", "mine"];

const MAX_SOUND_SIZE = 15 * 1024 * 1024;
const MAX_NAME = 40;
const TOAST_TIME = 2500;

const STATUS_ICONS = {
  pending: "clock",
  approved: "check",
  rejected: "x",
};

function SoundRow({ sound, mixer, myLibrary }) {
  const { t } = useTranslation();
  const isPlaying = mixer.isPlaying(sound.id);
  const name = getSoundName(sound, t);

  return (
    <li
      className={`library-sound ${
        isPlaying ? "is-playing" : ""
      }`}
    >
      <span className="library-sound__icon">
        <Icon name={sound.icon} size={20} />
      </span>

      <span className="library-sound__text">
        <strong dir="auto">
          {getSoundName(sound, t)}
        </strong>

        {sound.uploader ? (
          <span>
            {t("studyApp.library.uploadedBy")}{" "}

            <Link
              to={profilePath(sound.uploader.handle)}
              className="library-sound__uploader"
            >
              <bdi>{sound.uploader.name}</bdi>
            </Link>
          </span>
        ) : (
          <span>
            {t("studyApp.library.platformSound")}
          </span>
        )}
      </span>

      <div className="library-sound__actions">
        <button
          type="button"
          className="library-sound__play"
          aria-pressed={isPlaying}
          onClick={() => mixer.toggle(sound)}
        >
          <Icon
            name={isPlaying ? "pause" : "play"}
            size={16}
            strokeWidth={2.5}
          />

          {isPlaying
            ? t("studyApp.library.stop")
            : t("studyApp.library.try")}
        </button>

        {/* أضف لمكتبتي */}
        <SaveButton
          myLibrary={myLibrary}
          kind="sounds"
          id={sound.id}
          name={name}
        />
      </div>
    </li>
  );
}

function UploadSoundForm({ onUpload, onClose }) {
  const { t } = useTranslation();

  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  async function handleFile(event) {
    const chosen = event.target.files[0];

    event.target.value = "";

    if (!chosen) return;

    if (!chosen.type.startsWith("audio/")) {
      setError(t("studyApp.library.upload.errors.type"));
      return;
    }

    if (chosen.size > MAX_SOUND_SIZE) {
      setError(t("studyApp.library.upload.errors.size"));
      return;
    }

    const seconds = await readAudioDuration(chosen);

    if (seconds === null) {
      setError(t("studyApp.library.upload.errors.broken"));
      return;
    }

    setFile(chosen);
    setDuration(seconds);
    setError(null);

    if (!name) {
      setName(
        chosen.name
          .replace(/\.[^.]+$/, "")
          .slice(0, MAX_NAME)
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError(t("studyApp.library.upload.errors.file"));
      return;
    }

    if (!name.trim()) {
      setError(t("studyApp.library.upload.errors.name"));
      return;
    }

    setIsSending(true);

    await onUpload(file, name.trim(), duration);
  }

  return (
    <form
      className="upload-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <label
        className={`upload-form__file ${
          file ? "has-file" : ""
        }`}
      >
        <Icon
          name={file ? "music" : "upload"}
          size={22}
        />

        <span>
          <strong dir="auto">
            {file
              ? file.name
              : t("studyApp.library.upload.choose")}
          </strong>

          <span>
            {file
              ? `${formatClock(duration)} · ${(
                  file.size /
                  1024 /
                  1024
                ).toFixed(1)} MB`
              : t("studyApp.library.upload.formats")}
          </span>
        </span>

        <input
          type="file"
          accept="audio/*"
          hidden
          onChange={handleFile}
        />
      </label>

      <label className="upload-form__field">
        <span>
          {t("studyApp.library.upload.name")}

          <span className="upload-form__count">
            {name.length}/{MAX_NAME}
          </span>
        </span>

        <input
          type="text"
          value={name}
          maxLength={MAX_NAME}
          dir="auto"
          placeholder={t(
            "studyApp.library.upload.namePlaceholder"
          )}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
      </label>

      <p className="upload-form__note">
        <Icon name="shield" size={14} />

        {t("studyApp.library.upload.note")}
      </p>

      {error && (
        <p className="upload-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="upload-form__actions">
        <button
          type="button"
          className="upload-form__cancel"
          onClick={onClose}
        >
          {t("studyApp.library.upload.cancel")}
        </button>

        <button
          type="submit"
          className="upload-form__send"
          disabled={isSending}
        >
          <Icon name="send" size={16} />

          {t("studyApp.library.upload.send")}
        </button>
      </div>
    </form>
  );
}

function MySoundRow({
  sound,
  myLibrary,
  isPreviewing,
  onPreview,
  onDelete,
}) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;

    const timeout = setTimeout(
      () => setIsConfirming(false),
      3000
    );

    return () => clearTimeout(timeout);
  }, [isConfirming]);

  return (
    <li
      className={`library-sound my-sound is-${sound.status} ${
        isPreviewing ? "is-playing" : ""
      }`}
    >
      <span className="library-sound__icon">
        <Icon name="music" size={20} />
      </span>

      <span className="library-sound__text">
        <strong dir="auto">
          {sound.name}
        </strong>

        <span className="my-sound__meta">
          <span dir="ltr">
            {formatClock(sound.duration)}
          </span>

          <span
            className={`my-sound__status is-${sound.status}`}
          >
            <Icon
              name={STATUS_ICONS[sound.status]}
              size={12}
              strokeWidth={2.5}
            />

            {t(`studyApp.library.status.${sound.status}`)}
          </span>
        </span>

        {sound.status !== "pending" && (
          <span className="my-sound__hint">
            {sound.status === "approved"
              ? t("studyApp.library.status.approvedHint")
              : sound.reasonText ||
                t([
                  `uploads.reasons.${sound.reason}`,
                  `studyApp.library.status.reasons.${sound.reason}`,
                  "studyApp.library.status.rejected",
                ])}
          </span>
        )}
      </span>

      <div className="my-sound__actions">
        {/* المقبول بس بينضاف لمكتبتي */}
        {sound.status === "approved" && (
          <SaveButton
            myLibrary={myLibrary}
            kind="sounds"
            id={sound.id}
            name={sound.name}
          />
        )}

        {sound.url && (
          <button
            type="button"
            className="library-sound__play"
            aria-pressed={isPreviewing}
            onClick={() => onPreview(sound)}
          >
            <Icon
              name={isPreviewing ? "pause" : "play"}
              size={16}
              strokeWidth={2.5}
            />

            {isPreviewing
              ? t("studyApp.library.stop")
              : t("studyApp.library.try")}
          </button>
        )}

        <button
          type="button"
          className={`my-sound__delete ${
            isConfirming ? "is-confirming" : ""
          }`}
          aria-label={t("studyApp.library.upload.delete")}
          title={t("studyApp.library.upload.delete")}
          onClick={() =>
            isConfirming
              ? onDelete(sound.id)
              : setIsConfirming(true)
          }
        >
          {isConfirming ? (
            t("studyApp.library.upload.confirmDelete")
          ) : (
            <Icon name="trash" size={16} />
          )}
        </button>
      </div>
    </li>
  );
}

function Library() {
  const { t } = useTranslation();

  const {
    session,
    mySounds,
    myScenes,
    myLibrary,
    librarySounds,
    officialSounds,
    scenes,
  } = useOutletContext();

  const [searchParams, setSearchParams] = useSearchParams();

  const [isUploading, setIsUploading] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [toast, setToast] = useState(null);

  const previewRef = useRef(null);
  const { mixer } = session;

  const requestedTab = searchParams.get("tab");

  const tab = TABS.includes(requestedTab)
    ? requestedTab
    : "sounds";

  function changeTab(next) {
    setSearchParams(
      { tab: next },
      { replace: true }
    );
  }

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(
      () => setToast(null),
      TOAST_TIME
    );

    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => previewRef.current?.pause();
  }, []);

  function togglePreview(sound) {
    previewRef.current?.pause();

    if (previewId === sound.id) {
      setPreviewId(null);
      return;
    }

    const audio = new Audio(sound.url);

    audio.onended = () => setPreviewId(null);
    audio.play().catch(() => setPreviewId(null));

    previewRef.current = audio;
    setPreviewId(sound.id);
  }

  async function handleUpload(file, name, duration) {
    await mySounds.upload(file, name, duration);

    setIsUploading(false);
    setToast(t("studyApp.library.upload.sent"));
  }

  function handleDelete(id) {
    if (previewId === id) {
      previewRef.current?.pause();
      setPreviewId(null);
    }

    mySounds.remove(id);
  }

  return (
    <>
      <StudyHeader title={t("studyApp.nav.library")}>
        <div className="study-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => changeTab(item)}
            >
              {t(
                item === "mine"
                  ? "library.tab"
                  : `studyApp.library.tabs.${item}`
              )}
            </button>
          ))}
        </div>
      </StudyHeader>

      {tab === "sounds" && (
        <section className="library-section">
          <p className="library-hint">
            {t("studyApp.library.soundsHint")}
          </p>

          <h2 className="library-group">
            {t("studyApp.library.groups.platform")}
          </h2>

          <ul className="library-sounds">
            {[...SESSION_SOUNDS, ...officialSounds].map(
              (sound) => (
                <SoundRow
                  key={sound.id}
                  sound={sound}
                  mixer={mixer}
                  myLibrary={myLibrary}
                />
              )
            )}
          </ul>

          <h2 className="library-group">
            {t("studyApp.library.groups.community")}
          </h2>

          <ul className="library-sounds">
            {COMMUNITY_SOUNDS.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                mixer={mixer}
                myLibrary={myLibrary}
              />
            ))}
          </ul>

          <h2 className="library-group">
            {t("studyApp.library.groups.mine")}
          </h2>

          {isUploading ? (
            <UploadSoundForm
              onUpload={handleUpload}
              onClose={() => setIsUploading(false)}
            />
          ) : (
            <button
              type="button"
              className="library-upload"
              onClick={() => setIsUploading(true)}
            >
              <span className="library-upload__icon">
                <Icon name="upload" size={22} />
              </span>

              <span className="library-upload__text">
                <strong>
                  {t("studyApp.library.uploadTitle")}
                </strong>

                <span>
                  {t("studyApp.library.uploadText")}
                </span>
              </span>

              <Icon name="plus" size={20} />
            </button>
          )}

          {mySounds.sounds.length > 0 ? (
            <ul className="library-sounds">
              {mySounds.sounds.map((sound) => (
                <MySoundRow
                  key={sound.id}
                  sound={sound}
                  myLibrary={myLibrary}
                  isPreviewing={previewId === sound.id}
                  onPreview={togglePreview}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          ) : (
            !isUploading && (
              <p className="library-empty">
                {t("studyApp.library.mineEmpty")}
              </p>
            )
          )}
        </section>
      )}

      {tab === "scenes" && (
        <section className="library-section">
          <p className="library-hint">
            {t("studyApp.library.scenesHint")}
          </p>

          <ul className="scene-grid">
            {scenes.map((scene) => {
              // خلفية جلستي: المختارة وموجودة بجلستي
              const isActive =
                session.sceneId === scene.id &&
                myLibrary.inSession("scenes", scene.id);

              return (
                <li
                  key={scene.id}
                  className={`scene-card ${
                    isActive ? "is-active" : ""
                  }`}
                >
                  <span className="scene-card__preview">
                    <SceneBackground scene={scene} />

                    {/* نوع الخلفية: صورة، فيديو، أو مشهد متحرك */}
                    <span className="scene-card__badge">
                      <Icon
                        name={
                          scene.mediaType === "image"
                            ? "image"
                            : scene.src
                              ? "video"
                              : "film"
                        }
                        size={12}
                      />

                      {scene.mediaType === "image"
                        ? t("uploads.scenes.image")
                        : scene.src
                          ? t("studyApp.library.video")
                          : t("studyApp.library.animated")}
                    </span>
                  </span>

                  <div className="scene-card__info">
                    <strong dir="auto">
                      {getSceneName(scene, t)}
                    </strong>

                    <div className="my-library__actions">
                      {/* استخدمها بجلستي: بتنتقل لجلستي (ومكتبتي) وبتصير الخلفية */}
                      <button
                        type="button"
                        className="theme-option__apply"
                        aria-pressed={isActive}
                        disabled={isActive}
                        onClick={() => {
                          if (!myLibrary.inSession("scenes", scene.id)) {
                            myLibrary.toggleSession("scenes", scene.id);
                          }

                          session.updatePrefs({
                            sceneId: scene.id,
                          });
                        }}
                      >
                        {isActive && (
                          <Icon
                            name="check"
                            size={16}
                            strokeWidth={2.5}
                          />
                        )}

                        {isActive
                          ? t("studyApp.library.sceneActive")
                          : t("studyApp.library.useScene")}
                      </button>

                      {/* أضف لمكتبتي */}
                      <SaveButton
                        myLibrary={myLibrary}
                        kind="scenes"
                        id={scene.id}
                        name={getSceneName(scene, t)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* خلفياتي: رفع خلفية (صورة أو فيديو) والإدارة بتراجعها */}
          <MyScenes
            myScenes={myScenes}
            onSent={() => setToast(t("uploads.scenes.sent"))}
          />

          <Link
            to="/study/session"
            className="library-link"
          >
            {t("studyApp.library.openSession")}

            <Icon
              name="arrowRight"
              size={16}
              className="library-link__arrow"
            />
          </Link>
        </section>
      )}

      {/* مكتبتي: اللي اخترته، وبنقله لجلستي */}
      {tab === "mine" && (
        <MyLibraryTab
          myLibrary={myLibrary}
          sounds={librarySounds}
          scenes={scenes}
          mixer={mixer}
          activeSceneId={session.sceneId}
        />
      )}

      {toast && (
        <div className="post-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

export default Library;