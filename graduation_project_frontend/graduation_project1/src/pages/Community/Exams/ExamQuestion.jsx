import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import Lightbox from "../../../components/Lightbox/Lightbox.jsx";
import { useMediaUrl } from "../../../hooks/useMediaUrl.js";
import { optionLetter } from "./examUtils.js";

/**
 * صورة السؤال (محفوظة بـ IndexedDB): بتنكبّر بالضغط عليها.
 */
function QuestionImage({ mediaId, alt }) {
  const { t } = useTranslation();
  const { url, isLoading } = useMediaUrl(mediaId);
  const [isOpen, setIsOpen] = useState(false);
  // دالة ثابتة: الصفحة بتنرسم كل ثانية وقت الامتحان (العدّاد)، والـ Lightbox بيعيد تسجيل Esc لو تغيّرت
  const close = useCallback(() => setIsOpen(false), []);

  if (isLoading) return <div className="exam-media__image is-loading" aria-hidden="true" />;
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        className="exam-media__image"
        aria-label={t("community.exams.media.zoom")}
        title={t("community.exams.media.zoom")}
        onClick={() => setIsOpen(true)}
      >
        <img src={url} alt={alt} />
        <span className="exam-media__zoom" aria-hidden="true">
          <Icon name="maximize" size={16} />
        </span>
      </button>
      {isOpen && <Lightbox src={url} onClose={close} />}
    </>
  );
}

/**
 * جدول السؤال: { rows: [[نص الخلية...]], hasHeader: أول صف عناوين }
 */
export function QuestionTable({ table }) {
  const [head, ...body] = table.hasHeader ? table.rows : [null, ...table.rows];

  return (
    <div className="exam-media__table">
      <table>
        {head && (
          <thead>
            <tr>
              {head.map((cell, index) => (
                <th key={index} dir="auto">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index} dir="auto">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * المرفقات تحت نص السؤال: صورة، جدول، أو كود (أي وحدة منهم أو كلهم).
 */
export function QuestionMedia({ question }) {
  const { t } = useTranslation();
  if (!question.image && !question.table && !question.code) return null;

  return (
    <div className="exam-media">
      {question.image && <QuestionImage mediaId={question.image} alt={t("community.exams.media.imageAlt")} />}
      {question.table && <QuestionTable table={question.table} />}
      {question.code && (
        <pre className="exam-media__code" dir="ltr">
          <code>{question.code}</code>
        </pre>
      )}
    </div>
  );
}

/**
 * سؤال واحد: النص، المرفقات (صورة، جدول، كود)، والخيارات كدوائر (أ ب ج د).
 * أثناء الامتحان: تضغط على الخيار فتنحط عليه دائرة.
 * بعد التسليم (review): الصحيح أخضر ✓، واختياري الغلط أحمر ✗، وشرح الإجابة إن وُجد.
 */
function ExamQuestion({ question, index, chosen, onChoose, isReview }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const isRight = chosen === question.answer;

  return (
    <div
      className={`exam-question ${isReview ? (isRight ? "is-right" : "is-wrong") : ""}`}
      role="radiogroup"
      aria-labelledby={`question-${question.id}-title`}
    >
      <div id={`question-${question.id}-title`} className="exam-question__title">
        <span className="exam-question__number">{t("community.exams.questionNumber", { number: index + 1 })}</span>
        <span dir="auto">{question.text}</span>
      </div>

      <QuestionMedia question={question} />

      <div className="exam-question__options">
        {question.options.map((option, optionIndex) => {
          const isChosen = chosen === optionIndex;
          const isAnswer = question.answer === optionIndex;
          let state = isChosen ? "is-chosen" : "";
          if (isReview && isAnswer) state = "is-answer";
          else if (isReview && isChosen) state = "is-mistake";

          return (
            <label key={optionIndex} className={`exam-option ${state}`}>
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isChosen}
                disabled={isReview}
                onChange={() => onChoose(optionIndex)}
              />
              <span className="exam-circle" aria-hidden="true">
                {isReview && isAnswer ? (
                  <Icon name="check" size={16} strokeWidth={3} />
                ) : isReview && isChosen ? (
                  <Icon name="x" size={16} strokeWidth={3} />
                ) : (
                  optionLetter(optionIndex, language)
                )}
              </span>
              <span dir="auto">{option}</span>
            </label>
          );
        })}
      </div>

      {/* ما جاوب على هاد السؤال */}
      {isReview && chosen === null && <p className="exam-question__note">{t("community.exams.unanswered")}</p>}

      {/* شرح الإجابة من صاحب الامتحان (بعد التسليم بس) */}
      {isReview && question.explanation && (
        <div className="exam-question__explanation">
          <strong>{t("community.exams.explanation")}</strong>
          <p dir="auto">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default ExamQuestion;