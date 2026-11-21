import { useTranslation } from "react-i18next";
import Duration from "../../../../components/Duration/Duration.jsx";
import {
  getBestDay,
  getStats,
  getTotalMinutes,
  minutesToTime,
  timeToMinutes,
} from "../../../../utils/planUtils.js";
import "./PlanStats.css";

// شريط الأرقام أعلى الخطة
// tasks: مهام الواجهة الحالية (اليومية: مهام اليوم، الأسبوعية: كل الأسبوع)
function PlanStats({ plan, tasks }) {
  const { t } = useTranslation();

  const stats = getStats(tasks);
  const isDaily = plan.mode === "daily";

  const studyPercent = stats.planned === 0 ? 0 : (stats.studied / stats.planned) * 100;

  // اليومي: وقت انتهاء الخطة. الأسبوعي: أفضل يوم
  const endTime = minutesToTime(timeToMinutes(plan.dayStart) + getTotalMinutes(tasks));
  const bestDay = getBestDay(tasks);

  return (
    <section className="plan-stats" aria-live="polite">
      {/* نسبة الالتزام */}
      <div className="plan-stats__item plan-stats__item--ring">
        <div className="plan-stats__ring" style={{ "--percent": stats.percent }}>
          <strong dir="ltr">{stats.percent}%</strong>
        </div>
        <div className="plan-stats__text">
          <span className="plan-stats__label">{t("plan.commitment")}</span>
          <span className="plan-stats__sub">{t("plan.commitmentNote")}</span>
        </div>
      </div>

      {/* وقت الدراسة */}
      <div className="plan-stats__item">
        <span className="plan-stats__label">{t("plan.studyDone")}</span>
        <Duration minutes={stats.studied} className="plan-stats__value" />
        <div className="plan-stats__progress">
          <span style={{ width: `${studyPercent}%` }} />
        </div>
        <span className="plan-stats__sub">
          {t("plan.of")} <Duration minutes={stats.planned} />
        </span>
      </div>

      {/* المهام */}
      <div className="plan-stats__item">
        <span className="plan-stats__label">{t("plan.tasksDone")}</span>
        <strong className="plan-stats__value" dir="ltr">
          {stats.done} / {stats.total}
        </strong>
        <span className="plan-stats__sub plan-stats__sub--missed">
          {stats.missed} {t("plan.missedCount")}
        </span>
      </div>

      {/* نهاية الخطة أو أفضل يوم */}
      {isDaily ? (
        <div className="plan-stats__item">
          <span className="plan-stats__label">{t("plan.endsAt")}</span>
          <strong className="plan-stats__value" dir="ltr">
            {endTime}
          </strong>
          <span className="plan-stats__sub">
            {t("plan.startsAt")} <strong dir="ltr">{plan.dayStart}</strong>
          </span>
        </div>
      ) : (
        <div className="plan-stats__item">
          <span className="plan-stats__label">{t("plan.bestDay")}</span>
          <strong className="plan-stats__value">{bestDay ? t(`plan.days.${bestDay.day}`) : "—"}</strong>
          <span className="plan-stats__sub" dir={bestDay ? "ltr" : undefined}>
            {bestDay ? `${bestDay.percent}%` : t("plan.bestDayEmpty")}
          </span>
        </div>
      )}
    </section>
  );
}

export default PlanStats;