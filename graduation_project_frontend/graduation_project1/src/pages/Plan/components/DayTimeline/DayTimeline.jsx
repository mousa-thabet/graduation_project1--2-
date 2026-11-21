import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import Duration from "../../../../components/Duration/Duration.jsx";
import { getCurrentMinute, minutesToTime, timeToMinutes } from "../../../../utils/planUtils.js";
import "./DayTimeline.css";

// مدة حركة الحذف قبل إزالة المهمة
const LEAVE_TIME = 250;

// الدقيقة الحالية، وتتحدث كل 30 ثانية حتى يتحرك وسم "الآن"
function useCurrentMinute() {
  const [minute, setMinute] = useState(getCurrentMinute);

  useEffect(() => {
    const timer = setInterval(() => setMinute(getCurrentMinute()), 30000);
    return () => clearInterval(timer);
  }, []);

  return minute;
}

// مهمة واحدة على الخط الزمني
function TimelineSlot({ task, start, end, isNow, isFirst, isLast, onStatus, onMove, onDelete }) {
  const { t } = useTranslation();
  const [isLeaving, setIsLeaving] = useState(false);

  const isRest = task.kind === "rest";
  const status = isRest ? "pending" : task.status;

  function handleDelete() {
    setIsLeaving(true);
    setTimeout(() => onDelete(task.id), LEAVE_TIME);
  }

  const classes = [
    "slot",
    isRest && "slot--rest",
    status === "done" && "is-done",
    status === "missed" && "is-missed",
    isNow && "is-now",
    isLeaving && "is-leaving",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <time className="slot__time" dir="ltr">
        {minutesToTime(start)}
      </time>

      <span className="slot__node" aria-hidden="true">
        {status === "done" && <Icon name="check" size={12} strokeWidth={4} />}
        {status === "missed" && <Icon name="x" size={12} strokeWidth={4} />}
      </span>

      <div className="slot__body">
        <div className="slot__main">
          <div className="slot__tags">
            <span className="slot__kind">{t(`plan.${task.kind}`)}</span>
            {isNow && <span className="slot__now">{t("plan.now")}</span>}
          </div>

          <h3 className="slot__title">{task.title || t("plan.rest")}</h3>

          <p className="slot__meta">
            <span dir="ltr">
              {minutesToTime(start)} – {minutesToTime(end)}
            </span>
            <Duration minutes={task.minutes} />
          </p>

          {isRest && <p className="slot__note">{t("plan.restNote")}</p>}
        </div>

        {/* نجاح / فشل: لمهام الدراسة فقط */}
        {!isRest && (
          <div className="slot__status">
            <button
              type="button"
              className="status-button status-button--done"
              aria-pressed={task.status === "done"}
              onClick={() => onStatus(task.id, "done")}
            >
              <Icon name="check" size={16} strokeWidth={2.5} />
              {t("plan.markDone")}
            </button>
            <button
              type="button"
              className="status-button status-button--missed"
              aria-pressed={task.status === "missed"}
              onClick={() => onStatus(task.id, "missed")}
            >
              <Icon name="x" size={16} strokeWidth={2.5} />
              {t("plan.markMissed")}
            </button>
          </div>
        )}

        {/* الترتيب والحذف */}
        <div className="slot__tools">
          <button
            type="button"
            className="tool-button"
            aria-label={t("plan.moveUp")}
            disabled={isFirst}
            onClick={() => onMove(task.id, -1)}
          >
            <Icon name="chevronUp" size={16} />
          </button>
          <button
            type="button"
            className="tool-button"
            aria-label={t("plan.moveDown")}
            disabled={isLast}
            onClick={() => onMove(task.id, 1)}
          >
            <Icon name="chevronDown" size={16} />
          </button>
          <button
            type="button"
            className="tool-button tool-button--delete"
            aria-label={t("plan.deleteTask")}
            onClick={handleDelete}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * الواجهة اليومية: خط زمني يحسب بداية ونهاية كل مهمة
 * انطلاقًا من وقت بداية اليوم.
 */
function DayTimeline({ tasks, dayStart, onStatus, onMove, onDelete }) {
  const { t } = useTranslation();
  const currentMinute = useCurrentMinute();

  if (tasks.length === 0) {
    return (
      <div className="plan-empty">
        <span className="plan-empty__icon">
          <Icon name="calendar" size={26} />
        </span>
        <h3>{t("plan.emptyTitle")}</h3>
        <p>{t("plan.emptyText")}</p>
      </div>
    );
  }

  // نحسب وقت كل مهمة: تبدأ المهمة حيث انتهت التي قبلها
  let clock = timeToMinutes(dayStart);

  const slots = tasks.map((task) => {
    const start = clock;
    clock += task.minutes;
    return { task, start, end: clock };
  });

  const planEnd = clock;

  return (
    <ol className="timeline">
      {slots.map(({ task, start, end }, index) => (
        <TimelineSlot
          key={task.id}
          task={task}
          start={start}
          end={end}
          isNow={currentMinute >= start && currentMinute < end}
          isFirst={index === 0}
          isLast={index === slots.length - 1}
          onStatus={onStatus}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}

      {/* نهاية الخطة */}
      <li className="timeline__end">
        <time className="slot__time" dir="ltr">
          {minutesToTime(planEnd)}
        </time>
        <span className="timeline__end-node" aria-hidden="true" />
        <span className="timeline__end-label">{t("plan.planEnd")}</span>
      </li>
    </ol>
  );
}

export default DayTimeline;