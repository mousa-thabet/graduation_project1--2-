import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { ExamAuthor } from "../Exams/Exams.jsx";
import { GENERAL_ID, findCommunity, localName } from "../../../data/communities.js";
import { COURSE_LEVELS } from "../../../data/communityCourses.js";
import { useMediaUrl } from "../../../hooks/useMediaUrl.js";
import { STUDIO_PATH, coursePath, editCoursePath, isDraft } from "./courseUtils.js";
import { CourseCover, StatusChip, useLengthLabel } from "./CourseStudio.jsx";
import "../../Study/Search/Search.css";
import "../Exams/Exams.css";
import "./CourseStudio.css";

// حدود الدورة
const MAX_LESSONS = 30;
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_NOTES_LENGTH = 2000;
const MAX_VIDEO_SIZE = 300 * 1024 * 1024;
const TOAST_TIME = 2400;
const CONFIRM_TIME = 3000;
const STEPS = ["info", "curriculum"];

// درس فاضي (file: فيديو جديد اختاره  •  video: الفيديو المحفوظ من قبل)
const newLesson = () => ({ key: crypto.randomUUID(), title: "", duration: 10, notes: "", file: null, video: null });

// درس محفوظ ← شكل المحرّر (رقمه بيضل حتى ما يضيع تقدّم الطلاب)
const toFormLesson = (lesson) => ({ ...newLesson(), ...lesson, key: lesson.id, file: null, video: lesson.video ?? null });

const hasVideo = (lesson) => Boolean(lesson.file || lesson.video);
const hasContent = (lesson) => hasVideo(lesson) || lesson.notes.trim() !== "";

// بصمة المحرّر: حتى نعرف إذا في تعديلات ما انحفظت (الملف بنقارنه باسمه وحجمه)
const fingerprint = (info, lessons) =>
  JSON.stringify({
    info,
    // key للمحرّر بس (مش من محتوى الدرس)
    lessons: lessons.map(({ key: _key, file, ...lesson }) => ({ ...lesson, file: file ? `${file.name}:${file.size}` : null })),
  });

// مدة الفيديو بالدقائق (من معلومات الملف نفسه)
function readVideoMinutes(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.round(video.duration / 60)));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}

// رابط مؤقت لملف اختاره (قبل الحفظ)
function useFileUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return file ? url : null;
}

/**
 * فيديو الدرس: مكان سحب وإفلات (أو ضغط) للاختيار، أو معاينة الفيديو مع "بدّل" و"شيل".
 * onFile(file): اختار ملف  •  onRemove(): شيل الفيديو
 */
function LessonVideo({ lesson, onFile, onRemove }) {
  const { t } = useTranslation();
  const [isOver, setIsOver] = useState(false);
  const fileUrl = useFileUrl(lesson.file);
  const saved = useMediaUrl(lesson.file ? null : lesson.video?.mediaId);
  const url = fileUrl ?? saved.url;
  const name = lesson.file?.name ?? lesson.video?.name ?? t("studio.editor.curriculum.savedVideo");

  function pick(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  // الإفلات: بس للملفات (مش لسحب ترتيب الدروس)
  const isFileDrag = (event) => event.dataTransfer.types.includes("Files");

  function handleDragOver(event) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setIsOver(true);
  }

  function handleDrop(event) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  if (hasVideo(lesson)) {
    return (
      <div className="lesson-video has-video">
        <div className="lesson-video__player">
          {url ? (
            <video key={url} src={url} controls preload="metadata" playsInline />
          ) : (
            <span className="lesson-video__placeholder">
              <Icon name="video" size={28} />
            </span>
          )}
        </div>
        <div className="lesson-video__info">
          <strong dir="auto">{name}</strong>
          <span>{t("studio.editor.curriculum.videoHint")}</span>
          <div className="lesson-video__actions">
            <label className="studio-button studio-button--small">
              <Icon name="upload" size={15} />
              {t("studio.editor.curriculum.replaceVideo")}
              <input type="file" accept="video/*" hidden onChange={pick} />
            </label>
            <button type="button" className="studio-button studio-button--small studio-button--danger" onClick={onRemove}>
              <Icon name="x" size={15} strokeWidth={2.5} />
              {t("studio.editor.curriculum.removeVideo")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      className={`lesson-video__drop ${isOver ? "is-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <span className="lesson-video__drop-icon" aria-hidden="true">
        <Icon name="upload" size={22} />
      </span>
      <strong>{t("studio.editor.curriculum.videoDrop")}</strong>
      <span>{t("studio.editor.curriculum.videoHint")}</span>
      <input type="file" accept="video/*" hidden onChange={pick} />
    </label>
  );
}

/**
 * سطر درس بالمنهاج: مقبض السحب، الرقم، العنوان، النوع والمدة، وأدوات الترتيب والحذف.
 * الضغط على السطر بيفتح محرّر الدرس تحته.
 */
function LessonItem({
  lesson,
  index,
  count,
  isOpen,
  isDragging,
  isDropTarget,
  isConfirmingDelete,
  onToggle,
  onChange,
  onFile,
  onMove,
  onAskDelete,
  onDelete,
  dragHandlers,
}) {
  const { t } = useTranslation();
  const number = index + 1;
  const type = hasVideo(lesson) ? "video" : lesson.notes.trim() ? "text" : "empty";
  const isIncomplete = !lesson.title.trim() || !hasContent(lesson);

  return (
    <li
      className={`lesson-item ${isOpen ? "is-open" : ""} ${isDragging ? "is-dragging" : ""} ${isDropTarget ? "is-drop-target" : ""}`}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
    >
      {/* السطر: بيتسحب للترتيب، والضغط عليه بيفتح الدرس */}
      <div className="lesson-item__row" draggable onDragStart={dragHandlers.onDragStart} onDragEnd={dragHandlers.onDragEnd}>
        <span className="lesson-item__grip" title={t("studio.editor.curriculum.drag")} aria-hidden="true">
          <CommunityIcon name="grid" size={16} />
        </span>

        <button
          type="button"
          className="lesson-item__toggle"
          aria-expanded={isOpen}
          aria-label={t("studio.editor.curriculum.toggle", { number })}
          onClick={onToggle}
        >
          <span className="lesson-item__number">{number}</span>
          <span className="lesson-item__text">
            <strong dir="auto">{lesson.title.trim() || t("studio.editor.curriculum.untitledLesson")}</strong>
            <span className="lesson-item__meta">
              <span className={`lesson-type lesson-type--${type}`}>
                <Icon name={type === "video" ? "video" : type === "text" ? "book" : "x"} size={13} />
                {t(`studio.editor.curriculum.type${type[0].toUpperCase()}${type.slice(1)}`)}
              </span>
              <span>
                <Icon name="clock" size={13} />
                {t("community.exams.minutes", { count: Number(lesson.duration) || 0 })}
              </span>
              {isIncomplete && <span className="lesson-item__warning">{t("studio.editor.curriculum.incomplete")}</span>}
            </span>
          </span>
          <Icon name={isOpen ? "chevronUp" : "chevronDown"} size={18} />
        </button>

        <div className="lesson-item__tools">
          <button
            type="button"
            className="studio-icon-button"
            disabled={index === 0}
            aria-label={t("studio.editor.curriculum.moveUp", { number })}
            title={t("studio.editor.curriculum.moveUp", { number })}
            onClick={() => onMove(-1)}
          >
            <Icon name="arrowUp" size={16} />
          </button>
          <button
            type="button"
            className="studio-icon-button"
            disabled={index === count - 1}
            aria-label={t("studio.editor.curriculum.moveDown", { number })}
            title={t("studio.editor.curriculum.moveDown", { number })}
            onClick={() => onMove(1)}
          >
            <Icon name="arrowDown" size={16} />
          </button>
          <button
            type="button"
            className={`studio-icon-button studio-icon-button--danger ${isConfirmingDelete ? "is-confirming" : ""}`}
            aria-label={isConfirmingDelete ? t("studio.actions.confirmDelete") : t("studio.editor.curriculum.remove", { number })}
            title={t("studio.editor.curriculum.remove", { number })}
            onClick={isConfirmingDelete ? onDelete : onAskDelete}
          >
            <Icon name="trash" size={16} />
            {isConfirmingDelete && <span>{t("studio.actions.confirmDelete")}</span>}
          </button>
        </div>
      </div>

      {/* محرّر الدرس */}
      {isOpen && (
        <div className="lesson-item__body">
          <div className="studio-field-row">
            <label className="studio-field">
              <span className="studio-field__label">{t("studio.editor.curriculum.lessonTitle")}</span>
              <input
                autoFocus={!lesson.title}
                dir="auto"
                value={lesson.title}
                maxLength={MAX_TITLE_LENGTH}
                placeholder={t("studio.editor.curriculum.lessonTitlePlaceholder")}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </label>

            <label className="studio-field studio-field--duration">
              <span className="studio-field__label">{t("studio.editor.curriculum.duration")}</span>
              <span className="studio-field__suffix">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={lesson.duration}
                  onChange={(event) => onChange({ duration: event.target.value })}
                />
                <span>{t("studio.editor.curriculum.minutes")}</span>
              </span>
            </label>
          </div>

          <div className="studio-field">
            <span className="studio-field__label">{t("studio.editor.curriculum.video")}</span>
            <LessonVideo lesson={lesson} onFile={onFile} onRemove={() => onChange({ file: null, video: null })} />
          </div>

          <label className="studio-field">
            <span className="studio-field__label">
              {t("studio.editor.curriculum.notes")}
              <small>
                {lesson.notes.length}/{MAX_NOTES_LENGTH}
              </small>
            </span>
            <textarea
              dir="auto"
              rows={5}
              maxLength={MAX_NOTES_LENGTH}
              value={lesson.notes}
              placeholder={t("studio.editor.curriculum.notesPlaceholder")}
              onChange={(event) => onChange({ notes: event.target.value })}
            />
          </label>
        </div>
      )}
    </li>
  );
}

/**
 * محرّر الدورة (مثل استوديو المنصات الكبيرة):
 * شريط علوي ثابت (الرجوع لـ "دوراتي"، الحالة، "في تعديلات ما انحفظت"، حفظ كمسودة / نشر)،
 * قسمين: معلومات الدورة والمنهاج، وعلى الجنب معاينة البطاقة وجاهزية الدورة.
 * المسودة بتنحفظ حتى لو ناقصة (بس بدها عنوان)، والنشر بدّه الدورة تكون جاهزة.
 * editing: الدورة اللي بنعدّلها (أو null للجديدة)
 */
function CourseEditor({ editing }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, memberships, me } = useOutletContext();
  const lengthLabel = useLengthLabel();
  const language = i18n.resolvedLanguage;

  const myPlaces = memberships.myCommunities.length > 0 ? memberships.myCommunities : [findCommunity(GENERAL_ID)];
  // بالتعديل: مجتمع الدورة بيضل بالقائمة حتى لو طلعت منه
  const places =
    editing && !myPlaces.some((place) => place.id === editing.communityId)
      ? [findCommunity(editing.communityId), ...myPlaces]
      : myPlaces;

  // القيم المبدئية: من الدورة اللي بنعدّلها، أو فاضية للجديدة
  const [info, setInfo] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    communityId: editing?.communityId ?? places[0].id,
    branchId: editing?.branchId ?? "",
    level: editing?.level ?? COURSE_LEVELS[0],
  }));
  const [lessons, setLessons] = useState(() => (editing ? editing.lessons.map(toFormLesson) : [newLesson()]));
  const [savedPrint, setSavedPrint] = useState(() => fingerprint(info, lessons));
  // القسم المفتوح والدرس المفتوح (بيرجعوا زي ما كانوا بعد الحفظ)
  const [step, setStep] = useState(location.state?.step ?? "info");
  const [openKey, setOpenKey] = useState(() => (editing ? null : lessons[0].key));
  const [dragKey, setDragKey] = useState(null);
  const [dropKey, setDropKey] = useState(null);
  const [confirmKey, setConfirmKey] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(location.state?.savedAt ? t("studio.editor.savedToast") : null);

  const isPublished = Boolean(editing) && !isDraft(editing);
  const isDirty = fingerprint(info, lessons) !== savedPrint;
  const community = findCommunity(info.communityId);

  // فروع المجتمع اللي انضممت لها فقط (وفرع الدورة نفسها بالتعديل)
  const branchOptions = community.branches.filter(
    (branch) => memberships.isBranchJoined(info.communityId, branch.id) || branch.id === editing?.branchId
  );

  // جاهزية الدورة للنشر (الوصف اختياري)
  const checklist = [
    { id: "titleItem", isDone: info.title.trim() !== "" },
    { id: "description", isDone: info.description.trim() !== "", isOptional: true },
    { id: "lessons", isDone: lessons.length > 0 },
    { id: "lessonTitles", isDone: lessons.length > 0 && lessons.every((lesson) => lesson.title.trim()) },
    { id: "lessonContent", isDone: lessons.length > 0 && lessons.every(hasContent) },
  ];
  const required = checklist.filter((item) => !item.isOptional);
  const doneCount = required.filter((item) => item.isDone).length;
  const isReady = doneCount === required.length;

  const minutes = lessons.reduce((sum, lesson) => sum + (Number(lesson.duration) || 0), 0);
  const videosCount = lessons.filter(hasVideo).length;

  // تحذير المتصفح لو سكّر الصفحة وفي تعديلات ما انحفظت
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // نمسح "انحفظت" من الرابط حتى ما ترجع مع التحديث
  useEffect(() => {
    if (location.state?.savedAt) navigate(".", { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_TIME);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmKey) return;
    const timer = setTimeout(() => setConfirmKey(null), CONFIRM_TIME);
    return () => clearTimeout(timer);
  }, [confirmKey]);

  function updateInfo(changes) {
    setInfo((current) => ({ ...current, ...changes }));
    setError(null);
  }

  function updateLesson(key, changes) {
    setLessons((current) => current.map((lesson) => (lesson.key === key ? { ...lesson, ...changes } : lesson)));
    setError(null);
  }

  // فيديو الدرس: نتأكد من النوع والحجم، ونحسب مدته
  async function handleFile(key, file) {
    if (!file.type.startsWith("video/")) {
      setError(t("community.courses.errors.videoType"));
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError(t("community.courses.errors.videoSize"));
      return;
    }

    updateLesson(key, { file });
    const videoMinutes = await readVideoMinutes(file);
    if (videoMinutes) updateLesson(key, { duration: videoMinutes });
  }

  function addLesson() {
    if (lessons.length >= MAX_LESSONS) return;
    const lesson = newLesson();
    setLessons((current) => [...current, lesson]);
    setOpenKey(lesson.key);
  }

  function removeLesson(key) {
    setLessons((current) => current.filter((lesson) => lesson.key !== key));
    setConfirmKey(null);
    if (openKey === key) setOpenKey(null);
  }

  // نقل درس من مكانه لمكان ثاني (بالأسهم أو بالسحب)
  function moveLesson(key, toIndex) {
    setLessons((current) => {
      const from = current.findIndex((lesson) => lesson.key === key);
      if (from === -1 || toIndex < 0 || toIndex >= current.length || from === toIndex) return current;
      const next = [...current];
      const [lesson] = next.splice(from, 1);
      next.splice(toIndex, 0, lesson);
      return next;
    });
  }

  // سحب وإفلات الدروس للترتيب
  function dragHandlersFor(lesson, index) {
    return {
      onDragStart(event) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", lesson.key);
        setDragKey(lesson.key);
      },
      onDragOver(event) {
        if (!dragKey) return;
        event.preventDefault();
        if (dropKey !== lesson.key) setDropKey(lesson.key);
      },
      onDrop(event) {
        if (!dragKey) return;
        event.preventDefault();
        moveLesson(dragKey, index);
        setDragKey(null);
        setDropKey(null);
      },
      onDragEnd() {
        setDragKey(null);
        setDropKey(null);
      },
    };
  }

  // الرجوع لـ "دوراتي": نسأل قبل ما تضيع التعديلات
  function handleLeave(event) {
    if (isDirty && !window.confirm(t("studio.editor.leaveConfirm"))) event.preventDefault();
  }

  // الحفظ: مسودة (بدها عنوان بس) أو منشورة (بدها الدورة جاهزة)
  function save(status) {
    if (!info.title.trim()) {
      setError(t("studio.editor.errors.titleRequired"));
      setStep("info");
      return;
    }

    if (status === "published" && !isReady) {
      const missing = required.find((item) => !item.isDone);
      setError(t("studio.editor.errors.notReady", { item: t(`studio.editor.checklist.${missing.id}`) }));
      setStep(missing.id === "titleItem" ? "info" : "curriculum");
      return;
    }

    const data = {
      title: info.title.trim(),
      description: info.description.trim(),
      communityId: info.communityId,
      branchId: info.branchId || null,
      level: info.level,
      status,
      lessons: lessons.map((lesson) => ({
        // الدرس القديم بيضل برقمه، والجديد بياخد رقم بالحفظ
        id: editing && lesson.id ? lesson.id : undefined,
        title: lesson.title.trim(),
        duration: Math.max(1, Number(lesson.duration) || 1),
        notes: lesson.notes.trim(),
        file: lesson.file,
        video: lesson.video,
      })),
    };

    // نشر: صفحة الدورة متل ما بيشوفها الطالب
    if (status === "published") {
      const id = editing ? editing.id : courses.addCourse(data, me);
      if (editing) courses.updateCourse(editing.id, data);
      setSavedPrint(fingerprint(info, lessons));
      navigate(coursePath(id), { replace: true });
      return;
    }

    // مسودة جديدة: بننتقل لرابط تعديلها (المحرّر بيفتح من جديد على النسخة المحفوظة)
    if (!editing) {
      const id = courses.addCourse(data, me);
      setSavedPrint(fingerprint(info, lessons));
      navigate(editCoursePath(id), { replace: true, state: { savedAt: Date.now(), step } });
      return;
    }

    // مسودة موجودة: بنضل مكاننا، والدروس بتاخد نسختها المحفوظة (الفيديو الجديد صار محفوظ)
    const savedLessons = courses
      .updateCourse(editing.id, data)
      .map((lesson, index) => ({ ...toFormLesson(lesson), key: lessons[index].key }));
    setLessons(savedLessons);
    setSavedPrint(fingerprint(info, savedLessons));
    setToast(t("studio.editor.savedToast"));
  }

  const pageTitle = info.title.trim() || t(editing ? "studio.editor.untitled" : "studio.editor.newTitle");

  return (
    <div className="studio studio--editor">
      {/* الشريط العلوي الثابت */}
      <header className="studio-topbar">
        <Link to={STUDIO_PATH} className="studio-topbar__back" onClick={handleLeave}>
          <Icon name="arrowRight" size={18} />
          <span>{t("studio.editor.back")}</span>
        </Link>

        <div className="studio-topbar__title">
          <h1 dir="auto">{pageTitle}</h1>
          <span className="studio-topbar__state">
            {editing ? <StatusChip course={editing} /> : <StatusChip course={{ status: "draft" }} />}
            <span className={`studio-save-state ${isDirty ? "is-dirty" : ""}`}>
              <Icon name={isDirty ? "draft" : "check"} size={14} />
              {t(isDirty ? "studio.editor.unsaved" : "studio.editor.saved")}
            </span>
          </span>
        </div>

        <div className="studio-topbar__actions">
          {editing && (
            <Link to={coursePath(editing.id)} className="studio-button" onClick={handleLeave}>
              <Icon name="eye" size={16} />
              <span className="studio-button__label">{t("studio.editor.preview")}</span>
            </Link>
          )}
          {isPublished ? (
            <button type="button" className="studio-button studio-button--primary" onClick={() => save("published")}>
              <Icon name="check" size={16} strokeWidth={2.5} />
              {t("studio.editor.saveChanges")}
            </button>
          ) : (
            <>
              <button type="button" className="studio-button" onClick={() => save("draft")}>
                <Icon name="draft" size={16} />
                <span className="studio-button__label">{t("studio.editor.saveDraft")}</span>
              </button>
              <button
                type="button"
                className="studio-button studio-button--primary"
                aria-disabled={!isReady}
                onClick={() => save("published")}
              >
                <Icon name="send" size={16} />
                {t("studio.editor.publish")}
              </button>
            </>
          )}
        </div>
      </header>

      {error && (
        <p className="studio-error" role="alert">
          <Icon name="flag" size={16} />
          {error}
        </p>
      )}

      <div className="studio-editor">
        <div className="studio-editor__main">
          {/* أقسام المحرّر */}
          <div className="studio-steps" role="tablist" aria-label={t("studio.editor.steps.label")}>
            {STEPS.map((item, index) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={step === item}
                className="studio-step"
                onClick={() => setStep(item)}
              >
                <span className="studio-step__number">{index + 1}</span>
                {t(`studio.editor.steps.${item}`)}
              </button>
            ))}
          </div>

          {/* 1. معلومات الدورة */}
          {step === "info" && (
            <section className="studio-card" role="tabpanel">
              <div className="studio-card__head">
                <h2>{t("studio.editor.info.title")}</h2>
                <p>{t("studio.editor.info.text")}</p>
              </div>

              <label className="studio-field">
                <span className="studio-field__label">
                  {t("studio.editor.info.titleLabel")}
                  <small>
                    {info.title.length}/{MAX_TITLE_LENGTH}
                  </small>
                </span>
                <input
                  className="studio-field__big"
                  dir="auto"
                  value={info.title}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder={t("studio.editor.info.titlePlaceholder")}
                  onChange={(event) => updateInfo({ title: event.target.value })}
                />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">
                  {t("studio.editor.info.descriptionLabel")}
                  <small>
                    {info.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </small>
                </span>
                <textarea
                  dir="auto"
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={info.description}
                  placeholder={t("studio.editor.info.descriptionPlaceholder")}
                  onChange={(event) => updateInfo({ description: event.target.value })}
                />
              </label>

              <div className="studio-card__divider" />

              <div className="studio-card__head">
                <h3>{t("studio.editor.info.placeTitle")}</h3>
                <p>{t("studio.editor.info.placeText")}</p>
              </div>

              <div className="studio-field-row">
                <label className="studio-field">
                  <span className="studio-field__label">{t("community.composer.community")}</span>
                  <select
                    value={info.communityId}
                    onChange={(event) => updateInfo({ communityId: event.target.value, branchId: "" })}
                  >
                    {places.map((place) => (
                      <option key={place.id} value={place.id}>
                        {localName(place, language)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="studio-field">
                  <span className="studio-field__label">{t("community.composer.branch")}</span>
                  <select value={info.branchId} onChange={(event) => updateInfo({ branchId: event.target.value })}>
                    <option value="">{t("community.composer.noBranch")}</option>
                    {branchOptions.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {localName(branch, language)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="studio-field">
                <legend className="studio-field__label">{t("studio.editor.info.level")}</legend>
                <div className="studio-segment">
                  {COURSE_LEVELS.map((item) => (
                    <label key={item} className="studio-segment__option">
                      <input
                        type="radio"
                        name="course-level"
                        value={item}
                        checked={info.level === item}
                        onChange={() => updateInfo({ level: item })}
                      />
                      <span>{t(`community.courses.levels.${item}`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="studio-card__footer">
                <button type="button" className="studio-button studio-button--primary" onClick={() => setStep("curriculum")}>
                  {t("studio.editor.info.next")}
                  <Icon name="arrowRight" size={16} className="studio-flip" />
                </button>
              </div>
            </section>
          )}

          {/* 2. المنهاج */}
          {step === "curriculum" && (
            <section className="studio-card" role="tabpanel">
              <div className="studio-card__head studio-card__head--row">
                <div>
                  <h2>{t("studio.editor.curriculum.title")}</h2>
                  <p>{t("studio.editor.curriculum.text")}</p>
                </div>
                <span className="studio-card__summary">
                  {t("studio.editor.curriculum.summary", {
                    lessons: t("community.courses.lessonsCount", { count: lessons.length }),
                    minutes: lengthLabel(minutes),
                    videos: t("studio.editor.curriculum.videos", { count: videosCount }),
                  })}
                </span>
              </div>

              {lessons.length > 0 ? (
                <ol className="lesson-list">
                  {lessons.map((lesson, index) => (
                    <LessonItem
                      key={lesson.key}
                      lesson={lesson}
                      index={index}
                      count={lessons.length}
                      isOpen={openKey === lesson.key}
                      isDragging={dragKey === lesson.key}
                      isDropTarget={Boolean(dragKey) && dropKey === lesson.key && dragKey !== lesson.key}
                      isConfirmingDelete={confirmKey === lesson.key}
                      onToggle={() => setOpenKey((current) => (current === lesson.key ? null : lesson.key))}
                      onChange={(changes) => updateLesson(lesson.key, changes)}
                      onFile={(file) => handleFile(lesson.key, file)}
                      onMove={(direction) => moveLesson(lesson.key, index + direction)}
                      onAskDelete={() => setConfirmKey(lesson.key)}
                      onDelete={() => removeLesson(lesson.key)}
                      dragHandlers={dragHandlersFor(lesson, index)}
                    />
                  ))}
                </ol>
              ) : (
                <p className="lesson-list__empty">{t("studio.editor.curriculum.empty")}</p>
              )}

              {lessons.length < MAX_LESSONS ? (
                <button type="button" className="lesson-add" onClick={addLesson}>
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  {t("studio.editor.curriculum.addLesson")}
                </button>
              ) : (
                <p className="lesson-list__empty">{t("studio.editor.curriculum.limit", { count: MAX_LESSONS })}</p>
              )}
            </section>
          )}
        </div>

        {/* الجنب: المعاينة والجاهزية */}
        <aside className="studio-editor__side">
          <section className="studio-card studio-preview">
            <h2 className="studio-side-title">{t("studio.editor.previewTitle")}</h2>
            <div className="studio-preview__card">
              <CourseCover communityId={info.communityId} level={info.level} size={40} className="studio-cover--wide" />
              <div className="studio-preview__body">
                <strong dir="auto">{info.title.trim() || t("studio.editor.untitled")}</strong>
                {info.description.trim() && <p dir="auto">{info.description.trim()}</p>}
                <ExamAuthor author={me} isMine />
                <span className="studio-preview__meta">
                  <span>
                    <Icon name="play" size={13} />
                    {t("community.courses.lessonsCount", { count: lessons.length })}
                  </span>
                  <span>
                    <Icon name="clock" size={13} />
                    {lengthLabel(minutes)}
                  </span>
                </span>
              </div>
            </div>
            <p className="studio-preview__note">
              <Icon name={isPublished ? "eye" : "lock"} size={14} />
              {t(isPublished ? "studio.editor.publishedNote" : "studio.editor.draftNote")}
            </p>
          </section>

          <section className={`studio-card studio-checklist ${isReady ? "is-ready" : ""}`}>
            <div className="studio-checklist__head">
              <h2 className="studio-side-title">{t("studio.editor.checklist.title")}</h2>
              <span className="studio-checklist__count">
                {doneCount}/{required.length}
              </span>
            </div>
            <span className="studio-checklist__bar" aria-hidden="true">
              <span style={{ width: `${(doneCount / required.length) * 100}%` }} />
            </span>
            <ul>
              {checklist.map((item) => (
                <li key={item.id} className={item.isDone ? "is-done" : ""}>
                  <span className="studio-checklist__mark" aria-hidden="true">
                    {item.isDone && <Icon name="check" size={12} strokeWidth={3} />}
                  </span>
                  {t(`studio.editor.checklist.${item.id}`)}
                  {item.isOptional && <small>({t("studio.editor.checklist.optional")})</small>}
                </li>
              ))}
            </ul>
            <p className="studio-checklist__status">
              {t(isReady ? "studio.editor.checklist.ready" : "studio.editor.checklist.notReady")}
            </p>
          </section>
        </aside>
      </div>

      {toast && (
        <div className="studio-toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </div>
  );
}

/**
 * صفحة الإنشاء أو التعديل: /community/courses/new و /community/courses/:courseId/edit
 * بس صاحب الدورة بيقدر يعدّلها (التجريبية مش إلنا)، وبس أصحاب شارة القيمة العلمية بينشروا.
 * key: محرّر جديد لما ننتقل بين دورة جديدة وتعديل دورة (مثلًا بعد أول حفظ للمسودة)
 */
function CourseEditorPage() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const { courses, badges } = useOutletContext();
  const editing = courseId ? courses.findCourse(courseId) : null;

  // بدون شارة القيمة العلمية: ما بيقدر ينشر دورة
  if (!badges.isScholar) {
    return (
      <div className="studio">
        <EmptyState icon="lock" title={t("community.courses.lockedTitle")} text={t("community.courses.onlyScholars")}>
          <Link to="/community/badges" className="search-clear">
            {t("community.nav.badges")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (courseId && !editing?.isMine) {
    return (
      <div className="studio">
        <EmptyState icon="search" title={t("community.courses.notFound")} text={t("community.courses.notFoundText")}>
          <Link to={STUDIO_PATH} className="search-clear">
            {t("studio.title")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  return <CourseEditor key={courseId ?? "new"} editing={editing} />;
}

export default CourseEditorPage;