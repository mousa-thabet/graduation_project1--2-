import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ModeSwitch from "./components/ModeSwitch/ModeSwitch.jsx";
import PlanStats from "./components/PlanStats/PlanStats.jsx";
import TaskForm from "./components/TaskForm/TaskForm.jsx";
import PlanView from "./components/PlanView/PlanView.jsx";
import DayTimeline from "./components/DayTimeline/DayTimeline.jsx";
import WeekChart from "./components/WeekChart/WeekChart.jsx";
import WeekBoard from "./components/WeekBoard/WeekBoard.jsx";
import { usePlan } from "../../hooks/usePlan.js";
import { getTodayIndex } from "../../utils/planUtils.js";
import "./Plan.css";

function Plan() {
  const { t } = useTranslation();

  const {
    plan,
    tasks,
    today,
    setMode,
    setDayStart,
    addTask,
    toggleStatus,
    moveTask,
    deleteTask,
    clearTasks,
  } = usePlan();

  const [formDay, setFormDay] = useState(getTodayIndex);
  const titleRef = useRef(null);

  const isDaily = plan.mode === "daily";

  function handleAddToDay(day) {
    setFormDay(day);

    titleRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    titleRef.current.focus({ preventScroll: true });
  }

  function handleStartChange(event) {
    if (event.target.value) {
      setDayStart(event.target.value);
    }
  }

  return (
    <div className="plan">
      <div className="plan__bg" aria-hidden="true" />

      <div className="plan__container">
        <header className="plan__head">
          <div className="plan__intro">
            <h1 className="plan__title">
              {t("plan.heading")}
            </h1>

            <p className="plan__text">
              {t("plan.intro")}
            </p>
          </div>

          <div className="plan__head-actions">
            <ModeSwitch
              mode={plan.mode}
              onChange={setMode}
            />
          </div>
        </header>

        <PlanStats plan={plan} tasks={tasks} />

        <TaskForm
          ref={titleRef}
          mode={plan.mode}
          day={formDay}
          onDayChange={setFormDay}
          onAdd={addTask}
        />

        {isDaily ? (
          <PlanView
            key="daily"
            title={`${t("plan.dayTitle")} · ${t(`plan.days.${today}`)}`}
            doneTitle={t("plan.dayDone")}
            tasks={tasks}
            onClear={clearTasks}
            tools={
              <label className="plan__start">
                {t("plan.dayStart")}

                <input
                  type="time"
                  value={plan.dayStart}
                  dir="ltr"
                  onChange={handleStartChange}
                />
              </label>
            }
          >
            <DayTimeline
              tasks={tasks}
              dayStart={plan.dayStart}
              onStatus={toggleStatus}
              onMove={moveTask}
              onDelete={deleteTask}
            />
          </PlanView>
        ) : (
          <PlanView
            key="weekly"
            title={t("plan.weekTitle")}
            doneTitle={t("plan.weekDone")}
            tasks={tasks}
            onClear={clearTasks}
          >
            <WeekChart tasks={tasks} />

            <WeekBoard
              tasks={tasks}
              onStatus={toggleStatus}
              onDelete={deleteTask}
              onAddToDay={handleAddToDay}
            />
          </PlanView>
        )}
      </div>
    </div>
  );
}

export default Plan;