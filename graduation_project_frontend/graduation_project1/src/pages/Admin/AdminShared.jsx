import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon/Icon.jsx";
import { formatTimeAgo } from "../../utils/format.js";

/**
 * رأس صفحة باللوحة: العنوان والشرح، وأدوات (مثل الفلتر) تحتهم.
 */
export function AdminHeader({ title, text, children }) {
  return (
    <header className="admin-header">
      <h1 className="admin-header__title">{title}</h1>
      {text && <p className="admin-header__text">{text}</p>}
      {children}
    </header>
  );
}

/**
 * فلتر الحالة: بيستنى قرار، مقبول، مرفوض، الكل (مع عدد كل وحدة).
 * statuses: الحالات بالترتيب  •  items: القائمة كاملة (لحساب الأعداد)
 */
export function StatusFilter({ statuses, items, value, onChange }) {
  const { t } = useTranslation();
  const countOf = (status) => (status === "all" ? items.length : items.filter((item) => item.status === status).length);

  return (
    <div className="admin-filter" role="tablist" aria-label={t("admin.filterLabel")}>
      {[...statuses, "all"].map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={value === status}
          className={`admin-filter__chip ${value === status ? "is-active" : ""}`}
          onClick={() => onChange(status)}
        >
          {t(`admin.status.${status}`)}
          <span className="admin-filter__count">{countOf(status)}</span>
        </button>
      ))}
    </div>
  );
}

// لون الحالة: أخضر للقبول، أحمر للرفض والحذف، رمادي لـ"ما في مخالفة"
const STATUS_TONES = { pending: "wait", approved: "good", rejected: "bad", removed: "bad", dismissed: "neutral" };

/**
 * حالة الطلب أو البلاغ بعد القرار (مع وقته وسببه إن وُجد).
 */
export function StatusChip({ status, reviewedAt, reasonLabel }) {
  const { t, i18n } = useTranslation();

  return (
    <p className={`admin-status admin-status--${STATUS_TONES[status]}`}>
      <strong>{t(`admin.status.${status}`)}</strong>
      {reasonLabel && <span>· {reasonLabel}</span>}
      {reviewedAt && <span>· {formatTimeAgo(reviewedAt, i18n.resolvedLanguage)}</span>}
    </p>
  );
}

/**
 * أزرار القرار: "وافق" مباشرة، و"ارفض" بتطلب سبب أول (حتى يعرف صاحب الطلب ليش).
 * reasons: أسباب الرفض  •  reasonLabel(reason): نص السبب
 * approveLabel / rejectLabel: نص الزرين (للبلاغات: "احذف المحتوى" و"ما في مخالفة")
 * reasons فاضية: الرفض بيصير مباشر بدون سبب
 */
export function DecisionBar({ reasons = [], reasonLabel, approveLabel, rejectLabel, approveTone = "good", onApprove, onReject }) {
  const { t } = useTranslation();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState(reasons[0] ?? null);
  // اسم مجموعة الخيارات لازم يكون مختلف لكل بطاقة
  const groupName = useId();

  function reject() {
    if (reasons.length === 0) {
      onReject(null);
      return;
    }
    setIsRejecting(true);
  }

  if (isRejecting) {
    return (
      <fieldset className="admin-decision admin-decision--reasons">
        <legend>{t("admin.chooseReason")}</legend>
        {reasons.map((item) => (
          <label key={item} className="admin-decision__reason">
            <input type="radio" name={groupName} checked={reason === item} onChange={() => setReason(item)} />
            {reasonLabel(item)}
          </label>
        ))}
        <div className="admin-decision__buttons">
          <button type="button" className="admin-button admin-button--bad" onClick={() => onReject(reason)}>
            {t("admin.confirmReject")}
          </button>
          <button type="button" className="admin-button admin-button--ghost" onClick={() => setIsRejecting(false)}>
            {t("admin.cancel")}
          </button>
        </div>
      </fieldset>
    );
  }

  return (
    <div className="admin-decision">
      <button type="button" className={`admin-button admin-button--${approveTone}`} onClick={onApprove}>
        <Icon name={approveTone === "bad" ? "trash" : "check"} size={16} strokeWidth={2.5} />
        {approveLabel ?? t("admin.approve")}
      </button>
      <button type="button" className="admin-button admin-button--ghost" onClick={reject}>
        <Icon name="x" size={16} strokeWidth={2.5} />
        {rejectLabel ?? t("admin.reject")}
      </button>
    </div>
  );
}

/**
 * فحص سريع بيساعد الأدمن يقرر: ✓ أخضر إذا تمام، و ! أصفر إذا في مشكلة.
 */
export function AdminCheck({ isOk, children }) {
  return (
    <p className={`admin-check ${isOk ? "is-ok" : "is-warn"}`}>
      <Icon name={isOk ? "check" : "flag"} size={14} strokeWidth={2.5} />
      {children}
    </p>
  );
}