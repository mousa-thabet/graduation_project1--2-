import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import Icon from "../../components/Icon/Icon.jsx";

import {
  OFFICIAL_LIMITS,
  useOfficialLibrary,
} from "../../hooks/useOfficialLibrary.js";

import {
  formatClock,
  formatTimeAgo,
} from "../../utils/format.js";

import { readAudioDuration } from "../../utils/sounds.js";

import { AdminHeader } from "./AdminShared.jsx";

import "./Admin.css";

const KINDS = ["sound", "scene"];
const MAX_NAME = 40;

const toMegabytes = (bytes) =>
  `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const libraryPath = (kind) =>
  `/study/library?tab=${kind === "sound" ? "sounds" : "scenes"}`;

// رفع الأصوات والخلفيات الرسمية باسم المنصة.
function UploadForm({ kind, onAdd }) {
  const { t } = useTranslation();

  const limits = OFFICIAL_LIMITS[kind];

  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleFile(event) {
    const chosen = event.target.files[0];

    event.target.value = "";

    if (!chosen) return;

    if (!chosen.type.startsWith(limits.type)) {
      setError(t(`admin.library.errors.type.${kind}`));
      return;
    }

    if (chosen.size > limits.maxSize) {
      setError(t("admin.library.errors.size"));
      return;
    }

    let seconds = null;

    if (kind === "sound") {
      seconds = await readAudioDuration(chosen);

      if (seconds === null) {
        setError(t("admin.library.errors.broken"));
        return;
      }
    }

    setFile(chosen);
    setDuration(seconds);
    setError(null);

    if (!nameAr) {
      setNameAr(
        chosen.name
          .replace(/\.[^.]+$/, "")
          .slice(0, MAX_NAME)
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError(t("admin.library.errors.file"));
      return;
    }

    if (!nameAr.trim()) {
      setError(t("admin.library.errors.name"));
      return;
    }

    setIsSaving(true);

    await onAdd({
      kind,
      file,
      duration,
      name: {
        ar: nameAr.trim(),
        en: nameEn.trim() || nameAr.trim(),
      },
    });

    setIsSaving(false);
    setFile(null);
    setDuration(null);
    setNameAr("");
    setNameEn("");
  }

  return (
    <form
      className="admin-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <label
        className={`admin-file ${file ? "has-file" : ""}`}
      >
        <span className="admin-file__icon">
          <Icon
            name={
              file
                ? kind === "sound"
                  ? "music"
                  : "film"
                : "upload"
            }
            size={22}
          />
        </span>

        <span className="admin-file__text">
          <strong dir="auto">
            {file
              ? file.name
              : t(`admin.library.choose.${kind}`)}
          </strong>

          <span>
            {file
              ? [
                  duration !== null && formatClock(duration),
                  toMegabytes(file.size),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : t(`admin.library.formats.${kind}`)}
          </span>
        </span>

        <input
          type="file"
          accept={limits.accept}
          hidden
          onChange={handleFile}
        />
      </label>

      <div className="admin-form__row">
        <label className="admin-field">
          <span>{t("admin.library.nameAr")}</span>

          <input
            dir="rtl"
            maxLength={MAX_NAME}
            value={nameAr}
            onChange={(event) => {
              setNameAr(event.target.value);
              setError(null);
            }}
          />
        </label>

        <label className="admin-field">
          <span>
            {t("admin.library.nameEn")}

            <small>
              {" · "}
              {t("admin.communities.optional")}
            </small>
          </span>

          <input
            dir="ltr"
            maxLength={MAX_NAME}
            value={nameEn}
            onChange={(event) =>
              setNameEn(event.target.value)
            }
          />
        </label>
      </div>

      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="admin-button"
        disabled={isSaving}
      >
        <Icon name="upload" size={16} strokeWidth={2.5} />

        {isSaving
          ? t("admin.library.saving")
          : t(`admin.library.add.${kind}`)}
      </button>
    </form>
  );
}

// الملفات الرسمية التي رفعتها الإدارة.
function MediaCard({
  item,
  isPlaying,
  onTogglePlay,
  onDelete,
}) {
  const { t, i18n } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;

    const timeout = setTimeout(
      () => setIsConfirming(false),
      3000
    );

    return () => clearTimeout(timeout);
  }, [isConfirming]);

  const meta = [
    t(`admin.library.kinds.${item.kind}`),
    item.duration !== null && formatClock(item.duration),
    toMegabytes(item.size),
    formatTimeAgo(item.createdAt, i18n.resolvedLanguage),
  ].filter(Boolean);

  return (
    <li className={`admin-media admin-media--${item.kind}`}>
      <div className="admin-media__preview">
        {item.kind === "scene" && item.url ? (
          <video
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          <Icon
            name={item.kind === "sound" ? "music" : "film"}
            size={28}
          />
        )}
      </div>

      <div className="admin-media__info">
        <strong dir="auto">
          {item.label}
        </strong>

        <span className="admin-media__meta">
          {meta.join(" · ")}
        </span>
      </div>

      <div className="admin-media__actions">
        {item.kind === "sound" && item.url && (
          <button
            type="button"
            className="admin-button admin-button--ghost"
            aria-pressed={isPlaying}
            onClick={onTogglePlay}
          >
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={14}
              strokeWidth={2.5}
            />

            {isPlaying
              ? t("admin.library.stop")
              : t("admin.library.try")}
          </button>
        )}

        <button
          type="button"
          className="admin-button admin-button--bad"
          aria-label={
            isConfirming
              ? undefined
              : t("admin.library.delete")
          }
          onClick={() =>
            isConfirming
              ? onDelete()
              : setIsConfirming(true)
          }
        >
          <Icon name="trash" size={14} />

          {isConfirming
            ? t("admin.library.confirmDelete")
            : t("admin.library.delete")}
        </button>
      </div>
    </li>
  );
}

function AdminLibrary() {
  const { t } = useTranslation();

  const library = useOfficialLibrary();

  const [kind, setKind] = useState("sound");
  const [added, setAdded] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  function togglePlay(item) {
    audioRef.current?.pause();

    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(item.url);

    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));

    audioRef.current = audio;
    setPlayingId(item.id);
  }

  async function handleAdd(data) {
    const item = await library.add(data);

    setAdded({
      name: data.name.ar,
      kind: item.kind,
    });
  }

  function handleDelete(id) {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }

    library.remove(id);
  }

  return (
    <>
      <AdminHeader
        title={t("admin.nav.library")}
        text={t("admin.library.text")}
      >
        <div
          className="admin-filter"
          role="tablist"
          aria-label={t("admin.library.modeLabel")}
        >
          {KINDS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              className={`admin-filter__chip ${
                kind === item ? "is-active" : ""
              }`}
              onClick={() => {
                setKind(item);
                setAdded(null);
              }}
            >
              <Icon
                name={item === "sound" ? "music" : "film"}
                size={14}
              />

              {t(`admin.library.modes.${item}`)}
            </button>
          ))}
        </div>
      </AdminHeader>

      <section className="admin-panel">
        <UploadForm
          key={kind}
          kind={kind}
          onAdd={handleAdd}
        />

        {added && (
          <p className="admin-form__success" role="status">
            <Icon
              name="check"
              size={16}
              strokeWidth={2.5}
            />

            {t("admin.library.added", {
              name: added.name,
            })}

            <Link
              to={libraryPath(added.kind)}
              target="_blank"
              rel="noopener"
              className="admin-link"
            >
              {t("admin.library.open")}
            </Link>
          </p>
        )}
      </section>

      <h2 className="admin-section-title">
        {t("admin.library.uploaded", {
          count: library.items.length,
        })}
      </h2>

      {library.items.length > 0 ? (
        <ul className="admin-medias">
          {library.items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              isPlaying={playingId === item.id}
              onTogglePlay={() => togglePlay(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="admin-panel__empty">
          {t("admin.library.empty")}
        </p>
      )}
    </>
  );
}

export default AdminLibrary;