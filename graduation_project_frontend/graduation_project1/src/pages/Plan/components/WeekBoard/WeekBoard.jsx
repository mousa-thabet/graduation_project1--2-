import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import Duration from "../../../../components/Duration/Duration.jsx";
import { getStats, getTasksOfDay, getTodayIndex, WEEK_DAYS } from "../../../../utils/planUtils.js";
import "./WeekBoard.css";

// مدة حركة الحذف قبل إزالة المهمة
const LEAVE_TIME = 250;

// بطاقة مهمة صغيرة داخل صف اليوم
function TaskChip({ task, onStatus, onDelete }) {
  const { t } = useTranslation();
  const [isLeaving, setIsLeaving] = useState(false);

  const isRest = task.kind === "rest";
  const status = isRest ? "pending" : task.status;

  function handleDelete() {
    setIsLeaving(true);
    setTimeout(() => onDelete(task.id), LEAVE_TIME);
  }

  const classes = [
    "chip",
    isRest && "chip--rest",
    status === "done" && "is-done",
    status === "missed" && "is-missed",
    isLeaving && "is-leaving",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <h4 className="chip__title">{task.title || t("plan.rest")}</h4>

      <div className="chip__foot">
        <Duration minutes={task.minutes} className="chip__duration" />

        <div className="chip__actions">
          {!isRest && (
            <>
              <button
                type="button"
                className="chip__button chip__button--done"
                aria-label={t("plan.markDone")}
                aria-pressed={task.status === "done"}
                onClick={() => onStatus(task.id, "done")}
              >
                <Icon name="check" size={14} strokeWidth={3} />
              </button>
              <button
                type="button"
                className="chip__button chip__button--missed"
                aria-label={t("plan.markMissed")}
                aria-pressed={task.status === "missed"}
                onClick={() => onStatus(task.id, "missed")}
              >
                <Icon name="x" size={14} strokeWidth={3} />
              </button>
            </>
          )}
          <button
            type="button"
            className="chip__button chip__button--delete"
            aria-label={t("plan.deleteTask")}
            onClick={handleDelete}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * الواجهة الأسبوعية: صف لكل يوم، فيه تقدّم اليوم ومهامه بالترتيب.
 */
function WeekBoard({ tasks, onStatus, onDelete, onAddToDay }) {
  const { t } = useTranslation();
  const todayIndex = getTodayIndex();

  return (
    <div className="week-board">
      {WEEK_DAYS.map((day) => {
        const dayTasks = getTasksOfDay(tasks, day);
        const stats = getStats(dayTasks);
        const isToday = day === todayIndex;

        return (
          <section key={day} className={`day-row ${isToday ? "is-today" : ""}`}>
            {/* معلومات اليوم */}
            <header className="day-row__info">
              <div className="day-row__name">
                <h3>{t(`plan.days.${day}`)}</h3>
                {isToday && <span className="day-row__today">{t("plan.today")}</span>}
              </div>

              <div className="day-row__progress">
                <span style={{ width: `${stats.percent}%` }} />
              </div>

              <p className="day-row__stats">
                <span>
                  <strong dir="ltr">
                    {stats.done}/{stats.total}
                  </strong>{" "}
                  {t("plan.doneCount")}
                </span>
                <Duration minutes={stats.planned} />
              </p>
            </header>

            {/* مهام اليوم بالترتيب، وبينها أسهم */}
            {dayTasks.length > 0 ? (
              <ol className="day-row__tasks">
                {dayTasks.map((task, index) => (
                  <Fragment key={task.id}>
                    {index > 0 && (
                      <li className="day-row__arrow" aria-hidden="true">
                        <Icon name="arrowRight" />
                      </li>
                    )}
                    <TaskChip task={task} onStatus={onStatus} onDelete={onDelete} />
                  </Fragment>
                ))}
              </ol>
            ) : (
              <p className="day-row__empty">{t("plan.emptyDay")}</p>
            )}

            <button
              type="button"
              className="day-row__add"
              aria-label={t("plan.addToDay", { day: t(`plan.days.${day}`) })}
              onClick={() => onAddToDay(day)}
            >
              <Icon name="plus" strokeWidth={2.5} />
            </button>
          </section>
        );
      })}
    </div>
  );
}

export default WeekBoard;