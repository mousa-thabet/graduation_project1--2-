import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";

// أقل وأكثر عدد خيارات للاستطلاع
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 4;

/**
 * كتابة خيارات الاستطلاع داخل صندوق النشر.
 * options: نصوص الخيارات، onChange: ترجع القائمة الجديدة، onRemove: حذف الاستطلاع
 */
function PollEditor({ options, onChange, onRemove }) {
  const { t } = useTranslation();

  function updateOption(index, value) {
    onChange(options.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index) {
    onChange(options.filter((_, i) => i !== index));
  }

  return (
    <div className="poll-editor">
      {options.map((option, index) => (
        <div key={index} className="poll-editor__row">
          <input
            type="text"
            value={option}
            maxLength={40}
            placeholder={t("studyApp.poll.option", { number: index + 1 })}
            aria-label={t("studyApp.poll.option", { number: index + 1 })}
            onChange={(event) => updateOption(index, event.target.value)}
          />
          {options.length > MIN_POLL_OPTIONS && (
            <button
              type="button"
              className="poll-editor__remove-option"
              aria-label={t("studyApp.poll.removeOption")}
              onClick={() => removeOption(index)}
            >
              <Icon name="x" size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      ))}

      <div className="poll-editor__bar">
        {options.length < MAX_POLL_OPTIONS && (
          <button type="button" className="poll-editor__add" onClick={() => onChange([...options, ""])}>
            <Icon name="plus" size={16} strokeWidth={2.5} />
            {t("studyApp.poll.addOption")}
          </button>
        )}
        <button type="button" className="poll-editor__remove" onClick={onRemove}>
          {t("studyApp.poll.remove")}
        </button>
      </div>
    </div>
  );
}

export default PollEditor;