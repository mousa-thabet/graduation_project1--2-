import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import { getResultKey, getStats } from "../../../../utils/planUtils.js";
import "./PlanView.css";

// مدة انتظار الضغطة الثانية لتأكيد المسح
const CONFIRM_TIME = 3000;

// زر مسح الخطة: الضغطة الأولى تطلب التأكيد، والثانية تمسح
function ClearButton({ onClear }) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  // إذا لم يضغط مرة ثانية خلال 3 ثوانٍ نلغي التأكيد
  useEffect(() => {
    if (!isConfirming) return;

    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_TIME);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  function handleClick() {
    if (isConfirming) {
      setIsConfirming(false);
      onClear();
    } else {
      setIsConfirming(true);
    }
  }

  return (
    <button
      type="button"
      className={`plan-view__clear ${isConfirming ? "is-confirming" : ""}`}
      onClick={handleClick}
    >
      <Icon name="trash" size={16} />
      {isConfirming ? t("plan.clearConfirm") : t("plan.clear")}
    </button>
  );
}

/**
 * إطار الواجهة اليومية أو الأسبوعية:
 * العنوان + الأدوات + رسالة النتيجة + المحتوى.
 */
function PlanView({ title, doneTitle, tasks, tools, onClear, children }) {
  const { t } = useTranslation();

  // النتيجة تظهر بعد تعليم كل المهام الدراسية
  const stats = getStats(tasks);
  const isFinished = stats.total > 0 && stats.pending === 0;

  return (
    <section className="plan-view">
      <div className="plan-view__head">
        <h2 className="plan-view__title">{title}</h2>

        <div className="plan-view__tools">
          {tools}
          {tasks.length > 0 && <ClearButton onClear={onClear} />}
        </div>
      </div>

      {isFinished && (
        <div className="plan-view__result" role="status">
          <span className="plan-view__result-icon">
            <Icon name="check" size={22} strokeWidth={2.5} />
          </span>
          <div>
            <h3>{doneTitle}</h3>
            <p>{t(getResultKey(stats.percent))}</p>
          </div>
        </div>
      )}

      {children}
    </section>
  );
}

export default PlanView;