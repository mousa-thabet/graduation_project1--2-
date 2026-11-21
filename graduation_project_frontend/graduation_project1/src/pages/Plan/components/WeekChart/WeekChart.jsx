import { useTranslation } from "react-i18next";
import Duration from "../../../../components/Duration/Duration.jsx";
import { getStats, getTasksOfDay, getTodayIndex, WEEK_DAYS } from "../../../../utils/planUtils.js";
import "./WeekChart.css";

/**
 * رسم بياني لوقت الدراسة في كل يوم:
 * العمود الشفاف = الوقت المخطط، والجزء الملوّن = الوقت المنجز.
 */
function WeekChart({ tasks }) {
  const { t } = useTranslation();
  const todayIndex = getTodayIndex();

  const days = WEEK_DAYS.map((day) => ({ day, ...getStats(getTasksOfDay(tasks, day)) }));

  // أطول عمود = أكثر يوم فيه وقت مخطط
  const maxPlanned = Math.max(...days.map((item) => item.planned));

  return (
    <div className="week-chart">
      <div className="week-chart__head">
        <h3 className="week-chart__title">{t("plan.chartTitle")}</h3>

        <div className="week-chart__legend">
          <span className="week-chart__key week-chart__key--planned">{t("plan.chartPlanned")}</span>
          <span className="week-chart__key week-chart__key--done">{t("plan.chartDone")}</span>
        </div>
      </div>

      <div className="week-chart__bars">
        {days.map((item, index) => {
          const plannedHeight = maxPlanned === 0 ? 0 : (item.planned / maxPlanned) * 100;
          const doneHeight = item.planned === 0 ? 0 : (item.studied / item.planned) * 100;

          return (
            <div
              key={item.day}
              className={`week-chart__column ${item.day === todayIndex ? "is-today" : ""}`}
              style={{ "--delay": `${index * 60}ms` }}
            >
              <span className="week-chart__value">
                {item.planned > 0 && <Duration minutes={item.planned} />}
              </span>

              <div className="week-chart__track">
                {item.planned > 0 && (
                  <span className="week-chart__planned" style={{ height: `${plannedHeight}%` }}>
                    <span className="week-chart__done" style={{ height: `${doneHeight}%` }} />
                  </span>
                )}
              </div>

              <span className="week-chart__label">{t(`plan.daysShort.${item.day}`)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeekChart;