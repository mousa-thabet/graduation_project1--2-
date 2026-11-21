import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import { REPORT_REASONS } from "../../../hooks/useReports.js";
import "./ReportButton.css";

const MAX_NOTE_LENGTH = 300;

/**
 * نافذة البلاغ: سبب (إجباري) وتفاصيل (اختيارية).
 * onSend({ reason, note })  •  onClose(): إغلاق
 */
function ReportDialog({ onSend, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const firstRef = useRef(null);

  // التركيز على أول سبب لما تفتح النافذة
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  // Esc يسكّر النافذة
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!reason) return;
    onSend({ reason, note: note.trim() });
  }

  return (
    <div className="report-dialog report-dialog--catalog" onClick={onClose}>
      <form
        className="report-dialog__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="report-dialog-title" className="report-dialog__title">
          <Icon name="flag" size={18} />
          {t("community.reports.title")}
        </h2>

        <fieldset className="report-dialog__reasons" aria-labelledby="report-dialog-title">
          {REPORT_REASONS.map((item, index) => (
            <label key={item} className={`report-dialog__reason ${reason === item ? "is-selected" : ""}`}>
              <input
                ref={index === 0 ? firstRef : undefined}
                type="radio"
                name="report-reason"
                value={item}
                checked={reason === item}
                onChange={() => setReason(item)}
              />
              {t(`community.reports.reasons.${item}`)}
            </label>
          ))}
        </fieldset>

        <label className="report-dialog__note">
          <span>{t("community.reports.note")}</span>
          <textarea
            dir="auto"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            placeholder={t("community.reports.notePlaceholder")}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <div className="report-dialog__actions">
          <button type="button" className="report-dialog__cancel" onClick={onClose}>
            {t("community.exams.form.cancel")}
          </button>
          <button type="submit" className="report-dialog__send" disabled={!reason}>
            {t("community.reports.send")}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * وضع الإدارة: بدل الإبلاغ زر "احجب" (والمحجوب: "ألغِ الحجب").
 * المحجوب بيختفي عن الناس، والأدمن بيضل يشوفه وبيقدر يرجّعه.
 */
function BlockButton({ moderation, targetType, targetId, title }) {
  const { t } = useTranslation();
  const isBlocked = moderation.isBlocked(targetType, targetId);

  return (
    <>
      <button
        type="button"
        className="report-button"
        aria-pressed={isBlocked}
        onClick={() =>
          isBlocked ? moderation.unblock(targetType, targetId) : moderation.block({ targetType, targetId, title })
        }
      >
        <Icon name={isBlocked ? "eye" : "eyeOff"} size={15} />
        {t(isBlocked ? "moderation.unblockContent" : "moderation.blockContent")}
      </button>

      {isBlocked && (
        <p className="report-button__sent" role="status">
          {t("moderation.contentBlocked")}
        </p>
      )}
    </>
  );
}

/**
 * زر "إبلاغ" لامتحان أو دورة أو بث (مش لمحتواي أنا).
 * targetType: "exam" | "course" | "live"  •  targetId: رقمه  •  title: عنوانه (حتى يشوفه الأدمن)
 * بعد البلاغ بيصير "بلّغت" وما بيتكرر.
 * الأدمن (وضع الإدارة): زر "احجب" بدل الإبلاغ.
 */
function ReportButton({ targetType, targetId, title }) {
  const { t } = useTranslation();
  const { reports, moderation } = useOutletContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const hasReported = reports.hasReported(targetType, targetId);

  if (moderation?.isAdmin) {
    return <BlockButton moderation={moderation} targetType={targetType} targetId={targetId} title={title} />;
  }

  function send({ reason, note }) {
    reports.report({ targetType, targetId, title, reason, note });
    setIsOpen(false);
    setIsSent(true);
  }

  return (
    <>
      <button
        type="button"
        className="report-button"
        disabled={hasReported}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="flag" size={15} />
        {t(hasReported ? "community.reports.reported" : "community.reports.button")}
      </button>

      {isSent && (
        <p className="report-button__sent" role="status">
          {t("community.reports.sent")}
        </p>
      )}

      {isOpen && <ReportDialog onSend={send} onClose={() => setIsOpen(false)} />}
    </>
  );
}

export default ReportButton;