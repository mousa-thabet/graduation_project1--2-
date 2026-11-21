import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon/Icon.jsx";
import "./ReportDialog.css";

const REASONS = ["annoying", "inappropriate", "spam", "offTopic"];

/**
 * نافذة الإبلاغ عن محتوى (منشور أو بث).
 * لاحقًا: يُرسل البلاغ إلى الإدارة عبر الباك إند.
 */
function ReportDialog({ onSubmit, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState(REASONS[0]);

  // الإغلاق بزر Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(reason);
  }

  return (
    <div className="report-dialog" onClick={onClose}>
      <form
        className="report-dialog__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="report-dialog__head">
          <span className="report-dialog__icon">
            <Icon name="flag" size={20} />
          </span>
          <div>
            <h2 id="report-dialog-title">{t("studyApp.report.title")}</h2>
            <p>{t("studyApp.report.text")}</p>
          </div>
        </div>

        <fieldset className="report-dialog__reasons" aria-labelledby="report-dialog-title">
          {REASONS.map((item) => (
            <label key={item} className="report-dialog__reason">
              <input
                type="radio"
                name="reason"
                value={item}
                checked={reason === item}
                onChange={() => setReason(item)}
                autoFocus={item === REASONS[0]}
              />
              <span>{t(`studyApp.report.reasons.${item}`)}</span>
            </label>
          ))}
        </fieldset>

        <div className="report-dialog__actions">
          <button type="button" className="report-dialog__cancel" onClick={onClose}>
            {t("studyApp.report.cancel")}
          </button>
          <button type="submit" className="report-dialog__submit">
            {t("studyApp.report.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportDialog;