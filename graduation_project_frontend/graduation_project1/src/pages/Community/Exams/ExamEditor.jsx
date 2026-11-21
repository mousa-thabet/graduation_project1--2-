import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import ExamQuestion from "./ExamQuestion.jsx";
import { GENERAL_ID, findCommunity, localName } from "../../../data/communities.js";
import { useMediaUrl } from "../../../hooks/useMediaUrl.js";
import { deleteImages, examImages } from "../../../hooks/useExams.js";
import { saveMedia } from "../../../utils/mediaStore.js";
import { CREATE_EXAM_PATH, examPath, optionLetter } from "./examUtils.js";
import "../../Study/Search/Search.css";
import "./Exams.css";
import "./ExamEditor.css";

// حدود الامتحان
const MAX_QUESTIONS = 50;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const MAX_TITLE_LENGTH = 80;
const DURATIONS = [3, 5, 10, 15, 20, 30, 45, 60, 90, 120];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const TABLE_LIMITS = { rows: 10, cols: 6 };
// مسودة الامتحان الجديد (بتضل لو سكّرت الصفحة ورجعت)
const DRAFT_KEY = "areatk-community-exam-draft";

// سؤال فاضي: خياران، وما في جواب صحيح لسا (لازم تحط دائرة على واحد)
// image / table / code / explanation: null = مش مضاف
const newQuestion = () => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", ""],
  answer: null,
  image: null,
  table: null,
  code: null,
  explanation: null,
});

// جدول جديد 3×3 وأول صف عناوين
const newTable = () => ({ hasHeader: true, rows: Array.from({ length: 3 }, () => ["", "", ""]) });

// سؤال محفوظ ← سؤال بالمحرّر (الحقول الناقصة بتصير null)
const toEditable = (question) => ({
  ...newQuestion(),
  ...question,
  options: [...question.options],
  table: question.table ? { ...question.table, rows: question.table.rows.map((row) => [...row]) } : null,
  explanation: question.explanation ?? null,
});

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

// مشاكل السؤال: text (بدون نص)، options (خيار فاضي)، answer (ما في جواب صحيح)
function issuesOf(question) {
  const issues = [];
  if (!question.text.trim()) issues.push("text");
  if (question.options.some((option) => !option.trim())) issues.push("options");
  if (question.answer === null) issues.push("answer");
  return issues;
}

// الجدول بدون صفوف وأعمدة فاضية بالآخر، أو null إذا كله فاضي
function cleanTable(table) {
  if (!table) return null;
  const rows = table.rows.map((row) => row.map((cell) => cell.trim()));
  if (rows.every((row) => row.every((cell) => !cell))) return null;
  return { hasHeader: table.hasHeader, rows };
}

// السؤال زي ما بينحفظ: بس الحقول المستخدمة
function cleanQuestion({ id, text, options, answer, image, table, code, explanation }) {
  const question = { id, text: text.trim(), options: options.map((option) => option.trim()), answer };
  const cleanedTable = cleanTable(table);

  if (image) question.image = image;
  if (cleanedTable) question.table = cleanedTable;
  if (code?.trim()) question.code = code.replace(/\s+$/, "");
  if (explanation?.trim()) question.explanation = explanation.trim();
  return question;
}

/* =========================================
   مرفقات السؤال بالمحرّر
   ========================================= */

/**
 * صورة السؤال: معاينة، تغيير، أو حذف.
 */
function ImageField({ mediaId, onReplace, onRemove }) {
  const { t } = useTranslation();
  const { url } = useMediaUrl(mediaId);

  return (
    <div className="builder-block builder-image">
      {url ? <img src={url} alt={t("community.exams.media.imageAlt")} /> : <div className="builder-image__loading" />}
      <div className="builder-block__tools">
        <button type="button" className="builder-chip" onClick={onReplace}>
          <Icon name="upload" size={15} />
          {t("community.exams.builder.image.replace")}
        </button>
        <button type="button" className="builder-chip builder-chip--danger" onClick={onRemove}>
          <Icon name="trash" size={15} />
          {t("community.exams.builder.image.remove")}
        </button>
      </div>
    </div>
  );
}

/**
 * محرّر الجدول: خلايا، إضافة وحذف صفوف وأعمدة، وأول صف عناوين.
 */
function TableEditor({ table, onChange, onRemove }) {
  const { t } = useTranslation();
  const rowCount = table.rows.length;
  const colCount = table.rows[0].length;

  function setCell(rowIndex, colIndex, value) {
    onChange({
      ...table,
      rows: table.rows.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row)),
    });
  }

  const addRow = () => onChange({ ...table, rows: [...table.rows, Array(colCount).fill("")] });
  const removeRow = () => onChange({ ...table, rows: table.rows.slice(0, -1) });
  const addCol = () => onChange({ ...table, rows: table.rows.map((row) => [...row, ""]) });
  const removeCol = () => onChange({ ...table, rows: table.rows.map((row) => row.slice(0, -1)) });

  return (
    <div className="builder-block">
      <div className="builder-block__head">
        <Icon name="table" size={16} />
        <strong>{t("community.exams.builder.table.title")}</strong>
        <button
          type="button"
          className="exam-icon-button builder-block__remove"
          aria-label={t("community.exams.builder.table.remove")}
          title={t("community.exams.builder.table.remove")}
          onClick={onRemove}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="builder-table" style={{ "--cols": colCount }}>
        {table.rows.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              dir="auto"
              value={cell}
              maxLength={80}
              className={table.hasHeader && rowIndex === 0 ? "is-head" : ""}
              aria-label={t("community.exams.builder.table.cell", { row: rowIndex + 1, col: colIndex + 1 })}
              onChange={(event) => setCell(rowIndex, colIndex, event.target.value)}
            />
          ))
        )}
      </div>

      <div className="builder-block__tools">
        <button type="button" className="builder-chip" disabled={rowCount >= TABLE_LIMITS.rows} onClick={addRow}>
          <Icon name="plus" size={14} strokeWidth={2.5} />
          {t("community.exams.builder.table.addRow")}
        </button>
        <button type="button" className="builder-chip" disabled={rowCount <= 1} onClick={removeRow}>
          <Icon name="x" size={14} strokeWidth={2.5} />
          {t("community.exams.builder.table.removeRow")}
        </button>
        <button type="button" className="builder-chip" disabled={colCount >= TABLE_LIMITS.cols} onClick={addCol}>
          <Icon name="plus" size={14} strokeWidth={2.5} />
          {t("community.exams.builder.table.addCol")}
        </button>
        <button type="button" className="builder-chip" disabled={colCount <= 1} onClick={removeCol}>
          <Icon name="x" size={14} strokeWidth={2.5} />
          {t("community.exams.builder.table.removeCol")}
        </button>
        <label className="builder-check">
          <input
            type="checkbox"
            checked={table.hasHeader}
            onChange={(event) => onChange({ ...table, hasHeader: event.target.checked })}
          />
          {t("community.exams.builder.table.header")}
        </label>
      </div>
    </div>
  );
}

/**
 * محرّر الكود: خط ثابت العرض، من الشمال لليمين، وزر Tab بيدخل مسافتين.
 */
function CodeEditor({ value, onChange, onRemove }) {
  const { t } = useTranslation();

  function handleKeyDown(event) {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.target;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => event.target.setSelectionRange(selectionStart + 2, selectionStart + 2));
  }

  return (
    <div className="builder-block">
      <div className="builder-block__head">
        <Icon name="code" size={16} />
        <strong>{t("community.exams.builder.code.title")}</strong>
        <button
          type="button"
          className="exam-icon-button builder-block__remove"
          aria-label={t("community.exams.builder.code.remove")}
          title={t("community.exams.builder.code.remove")}
          onClick={onRemove}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <textarea
        className="builder-code"
        dir="ltr"
        spellCheck={false}
        rows={5}
        maxLength={3000}
        value={value}
        placeholder={t("community.exams.builder.code.placeholder")}
        aria-label={t("community.exams.builder.code.title")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

/* =========================================
   بطاقة سؤال بالمحرّر
   ========================================= */

/**
 * سؤال واحد: النص، المرفقات (صورة، جدول، كود)، الخيارات مع الجواب الصحيح، وشرح الإجابة.
 * أدوات: نقل لفوق ولتحت، تكرار، وحذف.
 * showIssues: بعد أول محاولة نشر، المشاكل بتنعرض جوا البطاقة
 */
function QuestionCard({ question, index, total, showIssues, cardRef, onChange, onMove, onDuplicate, onRemove }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const fileRef = useRef(null);
  const [imageError, setImageError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const issues = issuesOf(question);
  const isReady = issues.length === 0;
  const number = index + 1;

  function setOption(optionIndex, value) {
    onChange({ options: question.options.map((option, i) => (i === optionIndex ? value : option)) });
  }

  // حذف خيار: إذا كان هو الصحيح يرجع السؤال بدون جواب، وإذا كان قبله ينزل رقم الجواب
  function removeOption(optionIndex) {
    let answer = question.answer;
    if (answer === optionIndex) answer = null;
    else if (answer !== null && answer > optionIndex) answer -= 1;

    onChange({ options: question.options.filter((_, i) => i !== optionIndex), answer });
  }

  // رفع صورة: بتنحفظ بـ IndexedDB والسؤال بيحفظ رقمها بس
  async function handleImage(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError(t("community.exams.builder.image.notImage"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(t("community.exams.builder.image.tooBig"));
      return;
    }

    setImageError(null);
    setIsUploading(true);
    try {
      const id = `exam-img-${crypto.randomUUID()}`;
      await saveMedia(id, file);
      onChange({ image: id }, id);
    } catch {
      setImageError(t("community.exams.builder.image.failed"));
    } finally {
      setIsUploading(false);
    }
  }

  // أزرار الإضافة: بس اللي مش مضاف لسا
  const attachments = [
    { id: "image", icon: "image", isAdded: Boolean(question.image), add: () => fileRef.current.click() },
    { id: "table", icon: "table", isAdded: question.table !== null, add: () => onChange({ table: newTable() }) },
    { id: "code", icon: "code", isAdded: question.code !== null, add: () => onChange({ code: "" }) },
    { id: "explanation", icon: "feather", isAdded: question.explanation !== null, add: () => onChange({ explanation: "" }) },
  ].filter((item) => !item.isAdded);

  return (
    <section
      ref={cardRef}
      className={`builder-question ${showIssues && !isReady ? "is-invalid" : ""}`}
      aria-labelledby={`builder-q-${question.id}`}
    >
      <header className="builder-question__head">
        <span className={`builder-question__number ${isReady ? "is-ready" : ""}`} aria-hidden="true">
          {isReady ? <Icon name="check" size={16} strokeWidth={3} /> : number}
        </span>
        <h3 id={`builder-q-${question.id}`}>{t("community.exams.questionNumber", { number })}</h3>
        <span className={`builder-status ${isReady ? "is-ready" : ""}`}>
          {t(`community.exams.builder.status.${isReady ? "ready" : "incomplete"}`)}
        </span>

        <div className="builder-question__tools">
          <button
            type="button"
            className="exam-icon-button"
            disabled={index === 0}
            aria-label={t("community.exams.builder.moveUp")}
            title={t("community.exams.builder.moveUp")}
            onClick={() => onMove(-1)}
          >
            <Icon name="arrowUp" size={16} />
          </button>
          <button
            type="button"
            className="exam-icon-button"
            disabled={index === total - 1}
            aria-label={t("community.exams.builder.moveDown")}
            title={t("community.exams.builder.moveDown")}
            onClick={() => onMove(1)}
          >
            <Icon name="arrowDown" size={16} />
          </button>
          <button
            type="button"
            className="exam-icon-button"
            disabled={total >= MAX_QUESTIONS}
            aria-label={t("community.exams.builder.duplicate")}
            title={t("community.exams.builder.duplicate")}
            onClick={onDuplicate}
          >
            <Icon name="copy" size={16} />
          </button>
          {total > 1 && (
            <button
              type="button"
              className="exam-icon-button builder-question__delete"
              aria-label={t("community.exams.form.removeQuestion", { number })}
              title={t("community.exams.form.removeQuestion", { number })}
              onClick={onRemove}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      </header>

      <textarea
        className="builder-question__text"
        data-question-text
        dir="auto"
        rows={2}
        maxLength={600}
        value={question.text}
        placeholder={t("community.exams.form.questionPlaceholder")}
        aria-label={t("community.exams.questionNumber", { number })}
        aria-invalid={showIssues && issues.includes("text")}
        onChange={(event) => onChange({ text: event.target.value })}
      />

      {/* المرفقات المضافة */}
      {isUploading && <div className="builder-block builder-image__loading">{t("community.exams.builder.image.uploading")}</div>}
      {question.image && !isUploading && (
        <ImageField mediaId={question.image} onReplace={() => fileRef.current.click()} onRemove={() => onChange({ image: null })} />
      )}
      {question.table && (
        <TableEditor table={question.table} onChange={(table) => onChange({ table })} onRemove={() => onChange({ table: null })} />
      )}
      {question.code !== null && (
        <CodeEditor value={question.code} onChange={(code) => onChange({ code })} onRemove={() => onChange({ code: null })} />
      )}
      {imageError && (
        <p className="builder-inline-error" role="alert">
          {imageError}
        </p>
      )}

      {/* أضف للسؤال: صورة، جدول، كود، شرح */}
      {attachments.length > 0 && (
        <div className="builder-attach">
          <span>{t("community.exams.builder.attach")}</span>
          {attachments.map((item) => (
            <button key={item.id} type="button" className="builder-chip" onClick={item.add}>
              <Icon name={item.icon} size={15} />
              {t(`community.exams.builder.attachments.${item.id}`)}
            </button>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />

      {/* الخيارات: الدائرة تحدد الجواب الصحيح */}
      <div className="builder-options">
        <div className="builder-options__head">
          <strong>{t("community.exams.builder.options")}</strong>
          <span>{t("community.exams.builder.optionsHint")}</span>
        </div>

        <ol className="exam-editor__options" role="radiogroup" aria-label={t("community.exams.form.correct")}>
          {question.options.map((option, optionIndex) => {
            const isCorrect = question.answer === optionIndex;
            const letter = optionLetter(optionIndex, language);

            return (
              <li key={optionIndex} className={`exam-editor__option ${isCorrect ? "is-correct" : ""}`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isCorrect}
                  className="exam-circle"
                  aria-label={t("community.exams.form.markCorrect", { letter })}
                  title={t("community.exams.form.markCorrect", { letter })}
                  onClick={() => onChange({ answer: optionIndex })}
                >
                  {isCorrect ? <Icon name="check" size={16} strokeWidth={3} /> : letter}
                </button>

                <input
                  dir="auto"
                  value={option}
                  maxLength={200}
                  placeholder={t("community.exams.form.optionPlaceholder", { letter })}
                  aria-invalid={showIssues && !option.trim()}
                  onChange={(event) => setOption(optionIndex, event.target.value)}
                />

                {question.options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    className="exam-icon-button"
                    aria-label={t("community.exams.form.removeOption")}
                    title={t("community.exams.form.removeOption")}
                    onClick={() => removeOption(optionIndex)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        {question.options.length < MAX_OPTIONS && (
          <button type="button" className="exam-add" onClick={() => onChange({ options: [...question.options, ""] })}>
            <Icon name="plus" size={15} strokeWidth={2.5} />
            {t("community.exams.form.addOption")}
          </button>
        )}
      </div>

      {/* شرح الإجابة: بيظهر للطالب بعد التسليم */}
      {question.explanation !== null && (
        <div className="builder-block">
          <div className="builder-block__head">
            <Icon name="feather" size={16} />
            <strong>{t("community.exams.explanation")}</strong>
            <button
              type="button"
              className="exam-icon-button builder-block__remove"
              aria-label={t("community.exams.builder.explanationRemove")}
              title={t("community.exams.builder.explanationRemove")}
              onClick={() => onChange({ explanation: null })}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <textarea
            className="builder-question__text builder-question__text--small"
            dir="auto"
            rows={2}
            maxLength={600}
            value={question.explanation}
            placeholder={t("community.exams.builder.explanationPlaceholder")}
            aria-label={t("community.exams.explanation")}
            onChange={(event) => onChange({ explanation: event.target.value })}
          />
        </div>
      )}

      {/* شو ناقص (بعد أول محاولة نشر) */}
      {showIssues && !isReady && (
        <ul className="builder-question__issues" role="alert">
          {issues.map((issue) => (
            <li key={issue}>{t(`community.exams.builder.issues.${issue}`)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* =========================================
   المعاينة: الامتحان زي ما بيشوفه الطالب
   ========================================= */
function BuilderPreview({ title, description, communityId, branchId, duration, questions }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const community = findCommunity(communityId);
  const shown = questions.map((question) => ({ ...cleanQuestion(question), answer: question.answer }));

  return (
    <div className="builder-preview">
      <p className="builder-preview__banner">
        <Icon name="eye" size={18} />
        <span>{t("community.exams.builder.preview.banner")}</span>
        <button type="button" className="builder-chip" onClick={() => setShowAnswers((current) => !current)}>
          <Icon name={showAnswers ? "eyeOff" : "check"} size={15} />
          {t(`community.exams.builder.preview.${showAnswers ? "hideAnswers" : "showAnswers"}`)}
        </button>
      </p>

      <section className="exam-intro" style={{ "--track": community?.color }}>
        <PostOrigin post={{ communityId, branchId: branchId || null }} />
        <h2 className="exam-intro__title" dir="auto">
          {title.trim() || t("community.exams.builder.untitled")}
        </h2>
        {description.trim() && (
          <p className="exam-intro__description" dir="auto">
            {description}
          </p>
        )}
        <div className="exam-intro__meta">
          <span>
            <Icon name="checkSquare" size={14} />
            {t("community.exams.questionsCount", { count: questions.length })}
          </span>
          <span>
            <Icon name="clock" size={14} />
            {t("community.exams.minutes", { count: duration })}
          </span>
        </div>
      </section>

      <div className="exam-questions">
        {shown.map((question, index) => (
          <ExamQuestion
            key={question.id}
            question={question}
            index={index}
            chosen={answers[question.id] ?? null}
            onChoose={(optionIndex) => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
            isReview={showAnswers}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================
   قسم إنشاء امتحان
   ========================================= */

/**
 * إنشاء امتحان أو تعديله (شارة القيمة العلمية فقط):
 * /community/create-exam للجديد، و /community/create-exam/:examId لتعديل امتحاني بعد النشر.
 * صفحة عريضة بعمودين:
 * - الوسط: العنوان والوصف، والأسئلة (نص، صورة، جدول، كود، خيارات، وشرح الإجابة)، مع نقل وتكرار وحذف
 * - الجنب (ثابت): المكان والمدة، خريطة الأسئلة (جاهز أو ناقص)، والنشر
 * فوق: "تحرير" أو "معاينة" (الامتحان زي ما بيشوفه الطالب).
 * الامتحان الجديد بينحفظ كمسودة على الجهاز تلقائيًا لحد ما ينتشر.
 * editing: الامتحان اللي بنعدّله (أو null للجديد)
 */
function ExamEditor({ editing }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { exams, badges, memberships, me } = useOutletContext();
  const language = i18n.resolvedLanguage;

  const myPlaces = memberships.myCommunities.length > 0 ? memberships.myCommunities : [findCommunity(GENERAL_ID)];
  // بالتعديل: مجتمع الامتحان بيضل بالقائمة حتى لو طلعت منه
  const places =
    editing && !myPlaces.some((place) => place.id === editing.communityId)
      ? [findCommunity(editing.communityId), ...myPlaces]
      : myPlaces;

  // القيم المبدئية: من الامتحان اللي بنعدّله، أو من المسودة، أو فاضية
  const [exam, setExam] = useState(() => {
    if (editing) {
      return {
        title: editing.title,
        description: editing.description ?? "",
        communityId: editing.communityId,
        branchId: editing.branchId ?? "",
        duration: editing.duration,
        questions: editing.questions.map(toEditable),
      };
    }

    const draft = loadDraft();
    const isValidDraft = draft && Array.isArray(draft.questions) && draft.questions.length > 0;
    const blank = { title: "", description: "", communityId: places[0].id, branchId: "", duration: 10, questions: [newQuestion()] };
    if (!isValidDraft) return blank;

    // مجتمع المسودة لازم يكون من مجتمعاتي
    const hasPlace = places.some((place) => place.id === draft.communityId);
    return {
      ...blank,
      ...draft,
      communityId: hasPlace ? draft.communityId : places[0].id,
      branchId: hasPlace ? draft.branchId : "",
      questions: draft.questions.map(toEditable),
    };
  });
  const { title, description, communityId, branchId, duration, questions } = exam;

  const [view, setView] = useState("edit");
  const [showIssues, setShowIssues] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  // نروح على سؤال (أو العنوان) بعد ما تنرسم الصفحة
  const [scrollTarget, setScrollTarget] = useState(null);
  const cardRefs = useRef({});
  const titleRef = useRef(null);
  // الصور اللي انرفعت بهاد المحرّر (اللي ما انستخدمت بتنحذف عند النشر)
  const uploadedRef = useRef(new Set());

  // المسودة: كل تغيير بالامتحان الجديد بينحفظ على الجهاز
  useEffect(() => {
    if (editing) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(exam));
  }, [exam, editing]);

  useEffect(() => {
    if (!scrollTarget || view !== "edit") return;
    const element = scrollTarget === "title" ? titleRef.current : cardRefs.current[scrollTarget];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      (scrollTarget === "title" ? element : element.querySelector("[data-question-text]"))?.focus({ preventScroll: true });
    }
    setScrollTarget(null);
  }, [scrollTarget, view]);

  const backTo = editing ? examPath(editing.id) : "/community/exams";
  const pageTitle = t(editing ? "community.exams.edit" : "community.nav.createExam");

  // بدون شارة القيمة العلمية: ما بيقدر ينشر امتحان
  if (!badges.isScholar) {
    return (
      <>
        <StudyHeader title={pageTitle} backTo="/community/exams" />
        <EmptyState icon="lock" title={t("community.exams.lockedTitle")} text={t("community.exams.onlyScholars")}>
          <Link to="/community/badges" className="search-clear">
            {t("community.nav.badges")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const community = findCommunity(communityId);
  // فروع المجتمع اللي انضممت لها فقط (وفرع الامتحان نفسه بالتعديل)
  const branchOptions = community.branches.filter(
    (branch) => memberships.isBranchJoined(communityId, branch.id) || branch.id === editing?.branchId
  );
  const durations = DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b);
  const readyCount = questions.filter((question) => issuesOf(question).length === 0).length;
  const hasContent = title.trim() || description.trim() || questions.some((question) => question.text.trim() || question.image);

  function update(changes) {
    setExam((current) => ({ ...current, ...changes }));
    setError(null);
    setIsConfirmingDiscard(false);
  }

  function setQuestions(change) {
    setExam((current) => ({ ...current, questions: change(current.questions) }));
    setError(null);
    setIsConfirmingDiscard(false);
  }

  function updateQuestion(id, changes, uploadedImage) {
    if (uploadedImage) uploadedRef.current.add(uploadedImage);
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...changes } : question)));
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return;
    const question = newQuestion();
    setQuestions((current) => [...current, question]);
    setView("edit");
    setScrollTarget(question.id);
  }

  function moveQuestion(index, step) {
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });
  }

  function duplicateQuestion(index) {
    if (questions.length >= MAX_QUESTIONS) return;
    const copy = { ...toEditable(questions[index]), id: crypto.randomUUID() };
    setQuestions((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setScrollTarget(copy.id);
  }

  function removeQuestion(id) {
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  function jumpTo(id) {
    setView("edit");
    setScrollTarget(id);
  }

  // مسح المسودة: ضغطة للتأكيد، والثانية بتمسح
  function discardDraft() {
    if (!isConfirmingDiscard) {
      setIsConfirmingDiscard(true);
      return;
    }

    deleteImages(examImages(exam));
    localStorage.removeItem(DRAFT_KEY);
    setExam({ title: "", description: "", communityId: places[0].id, branchId: "", duration: 10, questions: [newQuestion()] });
    setShowIssues(false);
    setError(null);
    setIsConfirmingDiscard(false);
    setScrollTarget("title");
  }

  function handleSubmit(event) {
    event.preventDefault();

    // أول مشكلة: العنوان، أو أول سؤال ناقص
    if (!title.trim()) {
      setShowIssues(true);
      setError(t("community.exams.errors.title"));
      setView("edit");
      setScrollTarget("title");
      return;
    }

    const firstInvalid = questions.findIndex((question) => issuesOf(question).length > 0);
    if (firstInvalid !== -1) {
      setShowIssues(true);
      const issue = issuesOf(questions[firstInvalid])[0];
      const errorKey = { text: "question", options: "options", answer: "answer" }[issue];
      setError(t(`community.exams.errors.${errorKey}`, { number: firstInvalid + 1 }));
      setView("edit");
      setScrollTarget(questions[firstInvalid].id);
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      communityId,
      branchId: branchId || null,
      duration,
      questions: questions.map(cleanQuestion),
    };

    // صور انرفعت وبعدين انشالت أو تغيّرت: ما إلها لزمة
    const used = new Set(examImages(data));
    deleteImages([...uploadedRef.current].filter((image) => !used.has(image)));

    // تعديل: نحفظ على نفس الامتحان، جديد: امتحان جديد والمسودة بتنمسح
    if (editing) {
      exams.updateExam(editing.id, data);
      navigate(examPath(editing.id), { replace: true });
    } else {
      localStorage.removeItem(DRAFT_KEY);
      navigate(examPath(exams.addExam(data, me)));
    }
  }

  return (
    <>
      <StudyHeader title={pageTitle} backTo={backTo}>
        <div className="builder-header">
          <div className="study-tabs builder-header__tabs" role="tablist" aria-label={t("community.exams.builder.viewLabel")}>
            {["edit", "preview"].map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                className="study-tabs__tab"
                onClick={() => {
                  setView(item);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Icon name={item === "edit" ? "feather" : "eye"} size={16} />
                {t(`community.exams.builder.views.${item}`)}
              </button>
            ))}
          </div>
        </div>
      </StudyHeader>

      <form className="builder" noValidate onSubmit={handleSubmit}>
        <div className="builder__main">
          {view === "edit" ? (
            <>
              {/* الغلاف: العنوان والوصف */}
              <section className="builder-cover" style={{ "--track": community.color }}>
                <p className="builder-cover__intro">{t("community.exams.builder.intro")}</p>
                <input
                  ref={titleRef}
                  className="builder-cover__title"
                  dir="auto"
                  value={title}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder={t("community.exams.form.titlePlaceholder")}
                  aria-label={t("community.exams.form.title")}
                  aria-invalid={showIssues && !title.trim()}
                  onChange={(event) => update({ title: event.target.value })}
                />
                <textarea
                  className="builder-cover__description"
                  dir="auto"
                  rows={2}
                  maxLength={300}
                  value={description}
                  placeholder={t("community.exams.form.descriptionPlaceholder")}
                  aria-label={t("community.exams.form.description")}
                  onChange={(event) => update({ description: event.target.value })}
                />
              </section>

              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  total={questions.length}
                  showIssues={showIssues}
                  cardRef={(element) => {
                    cardRefs.current[question.id] = element;
                  }}
                  onChange={(changes, uploadedImage) => updateQuestion(question.id, changes, uploadedImage)}
                  onMove={(step) => moveQuestion(index, step)}
                  onDuplicate={() => duplicateQuestion(index)}
                  onRemove={() => removeQuestion(question.id)}
                />
              ))}

              {questions.length < MAX_QUESTIONS ? (
                <button type="button" className="builder-add" onClick={addQuestion}>
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  {t("community.exams.form.addQuestion")}
                </button>
              ) : (
                <p className="exam-editor__hint">{t("community.exams.builder.limit", { count: MAX_QUESTIONS })}</p>
              )}
            </>
          ) : (
            <BuilderPreview {...exam} />
          )}
        </div>

        {/* العمود الجانبي: الإعدادات، خريطة الأسئلة، والنشر */}
        <aside className="builder__side">
          <section className="builder-panel">
            <h2 className="builder-panel__title">
              <Icon name="layers" size={16} />
              {t("community.exams.builder.settings")}
            </h2>

            <label className="exam-field">
              <span>{t("community.composer.community")}</span>
              <select value={communityId} onChange={(event) => update({ communityId: event.target.value, branchId: "" })}>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {localName(place, language)}
                  </option>
                ))}
              </select>
            </label>

            <label className="exam-field">
              <span>{t("community.composer.branch")}</span>
              <select value={branchId} onChange={(event) => update({ branchId: event.target.value })}>
                <option value="">{t("community.composer.noBranch")}</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {localName(branch, language)}
                  </option>
                ))}
              </select>
            </label>

            <label className="exam-field">
              <span>{t("community.exams.form.duration")}</span>
              <select value={duration} onChange={(event) => update({ duration: Number(event.target.value) })}>
                {durations.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {t("community.exams.minutes", { count: minutes })}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="builder-panel">
            <h2 className="builder-panel__title">
              <Icon name="checkSquare" size={16} />
              {t("community.exams.builder.questionsPanel")}
              <span className="builder-panel__count">
                {t("community.exams.builder.readyCount", { ready: readyCount, total: questions.length })}
              </span>
            </h2>

            <span className="builder-progress" aria-hidden="true">
              <span style={{ width: `${(readyCount / questions.length) * 100}%` }} />
            </span>

            <ol className="builder-map">
              {questions.map((question, index) => {
                const isReady = issuesOf(question).length === 0;
                const state = isReady ? "is-ready" : showIssues ? "is-invalid" : "";

                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      className={`builder-map__item ${state}`}
                      aria-label={t("community.exams.builder.jumpTo", { number: index + 1 })}
                      title={t("community.exams.builder.jumpTo", { number: index + 1 })}
                      onClick={() => jumpTo(question.id)}
                    >
                      {index + 1}
                    </button>
                  </li>
                );
              })}
              {questions.length < MAX_QUESTIONS && (
                <li>
                  <button
                    type="button"
                    className="builder-map__item builder-map__item--add"
                    aria-label={t("community.exams.form.addQuestion")}
                    title={t("community.exams.form.addQuestion")}
                    onClick={addQuestion}
                  >
                    <Icon name="plus" size={16} strokeWidth={2.5} />
                  </button>
                </li>
              )}
            </ol>
          </section>

          <section className="builder-panel builder-panel--actions">
            {error && (
              <p className="exam-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="exam-button builder-publish">
              <Icon name={editing ? "check" : "send"} size={16} />
              {t(editing ? "community.exams.form.save" : "community.exams.form.publish")}
            </button>
            <Link to={backTo} className="exam-button exam-button--ghost">
              {t("community.exams.form.cancel")}
            </Link>

            {/* تعديل امتحان: نتيجتك القديمة فيه بتنحذف */}
            {editing && <p className="builder-panel__note">{t("community.exams.form.editNote")}</p>}

            {/* المسودة (للامتحان الجديد) */}
            {!editing && hasContent && (
              <div className="builder-draft">
                <span>
                  <Icon name="draft" size={14} />
                  {t("community.exams.builder.draftSaved")}
                </span>
                <button type="button" className={isConfirmingDiscard ? "is-confirming" : ""} onClick={discardDraft}>
                  {t(isConfirmingDiscard ? "community.exams.builder.discardConfirm" : "community.exams.builder.discard")}
                </button>
              </div>
            )}
          </section>
        </aside>
      </form>
    </>
  );
}

/**
 * صفحة الإنشاء أو التعديل.
 * /community/create-exam/:examId: بس صاحب الامتحان بيقدر يعدّله (التجريبية مش إلنا)
 * key: صفحة جديدة لما ننتقل بين امتحان جديد وتعديل امتحان
 */
function ExamEditorPage() {
  const { t } = useTranslation();
  const { examId } = useParams();
  const { exams } = useOutletContext();
  const editing = examId ? exams.findExam(examId) : null;

  if (examId && !editing?.isMine) {
    return (
      <>
        <StudyHeader title={t("community.exams.notFound")} backTo={CREATE_EXAM_PATH} />
        <EmptyState icon="search" title={t("community.exams.notFound")} text={t("community.exams.notFoundText")} />
      </>
    );
  }

  return <ExamEditor key={examId ?? "new"} editing={editing} />;
}

export default ExamEditorPage;