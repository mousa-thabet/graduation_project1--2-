import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import SessionScene, { SceneBackground } from "./SessionScene/SessionScene.jsx";
import SoundMixer from "./SoundMixer/SoundMixer.jsx";
import SessionPlanner from "./SessionPlanner/SessionPlanner.jsx";
import { SESSION_SCENES, getSceneName } from "../../../data/sessionScenes.js";
import { usePlan } from "../../../hooks/usePlan.js";
import "./Session.css";

/**
 * صفحة جلستي: المؤقت والمشهد، هدف الجلسة ومهمة من خطتي، تقسيم الجلسة، خلاط الأصوات، الخلفية، والإحصائيات.
 * الجلسة نفسها في StudyLayout حتى تبقى شغالة في باقي الصفحات.
 */
function Session() {
  const { t, i18n } = useTranslation();
  // sessionScenes / sessionSounds: بس اللي نقلته من مكتبتي لجلستي
  const { session, feed, sessionScenes, sessionSounds } = useOutletContext();
  const { plan, todayTasks: planToday, toggleStatus } = usePlan();
  const [shareState, setShareState] = useState(null);

  const { timer, stats } = session;
  // الخلفية المختارة (إذا انشالت من جلستي، أول خلفية بجلستي، أو الخلفية الأصلية)
  const scene = sessionScenes.find((item) => item.id === session.sceneId) ?? sessionScenes[0] ?? SESSION_SCENES[0];
  // مهام الدراسة اللي لسا ما انعملت اليوم من خطتي
  const todayTasks = planToday.filter((task) => task.kind === "study" && task.status !== "done");
  const linkedTask = plan.tasks.find((task) => task.id === session.taskId);
  const isOnBreak = timer.phase === "break" && timer.isActive;
  const weekMax = Math.max(60, ...stats.week.map((day) => day.minutes));

  // نصيحة الاستراحة تتغير مع كل جولة
  const breakTips = t("studyApp.session.breakTips", { returnObjects: true });
  const breakTip = breakTips[stats.today.rounds % breakTips.length];

  function chooseTask(task) {
    const isSelected = session.taskId === task.id;
    session.updatePrefs({ taskId: isSelected ? null : task.id, goal: isSelected ? "" : task.title });
  }

  // نشر الإنجاز كمنشور في المنشورات
  function shareAchievement() {
    feed.addPost({
      text: t("studyApp.session.done.shareText"),
      achievement: {
        minutes: session.sessionMinutes,
        task: session.goal || t("studyApp.session.done.defaultTask"),
        streak: stats.streak,
      },
    });
    setShareState("shared");
  }

  function markTaskDone() {
    if (linkedTask && linkedTask.status !== "done") toggleStatus(linkedTask.id, "done");
    session.updatePrefs({ taskId: null });
  }

  return (
    <>
      <StudyHeader title={t("studyApp.nav.session")} />

      <SessionScene timer={timer} mixer={session.mixer} scene={scene} goal={session.goal} />

      {/* أحسنت: بعد انتهاء جولة دراسة */}
      {session.lastRound && (
        <div className="session-banner session-banner--done" role="status">
          <span className="session-banner__icon">
            <Icon name="check" size={20} strokeWidth={2.5} />
          </span>
          <div className="session-banner__text">
            <strong>{t("studyApp.session.done.title")}</strong>
            <span>{t("studyApp.session.done.text", { count: session.sessionMinutes })}</span>
          </div>

          <div className="session-banner__actions">
            {shareState === "shared" ? (
              <Link to="/study" className="session-banner__button">
                {t("studyApp.session.done.view")}
              </Link>
            ) : (
              <button type="button" className="session-banner__button is-primary" onClick={shareAchievement}>
                {t("studyApp.session.done.share")}
              </button>
            )}

            {linkedTask && (
              <button type="button" className="session-banner__button" onClick={markTaskDone}>
                {t("studyApp.session.done.markDone")}
              </button>
            )}

            <button
              type="button"
              className="session-banner__close"
              aria-label={t("studyApp.session.done.close")}
              onClick={() => {
                session.dismissRound();
                setShareState(null);
              }}
            >
              <Icon name="x" size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* تذكير الاستراحة */}
      {isOnBreak && (
        <div className="session-banner session-banner--break" role="status">
          <span className="session-banner__icon">🌿</span>
          <div className="session-banner__text">
            <strong>{t("studyApp.session.breakTitle")}</strong>
            <span>{breakTip}</span>
          </div>
        </div>
      )}

      {/* هدف الجلسة */}
      <section className="session-card">
        <h2 className="session-card__title">{t("studyApp.session.goal.title")}</h2>

        <input
          type="text"
          className="session-goal"
          value={session.goal}
          maxLength={80}
          placeholder={t("studyApp.session.goal.placeholder")}
          aria-label={t("studyApp.session.goal.title")}
          onChange={(event) => session.updatePrefs({ goal: event.target.value, taskId: null })}
        />

        <p className="session-card__hint">{t("studyApp.session.goal.fromPlan")}</p>

        {todayTasks.length > 0 ? (
          <div className="session-tasks">
            {todayTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="session-task"
                aria-pressed={session.taskId === task.id}
                onClick={() => chooseTask(task)}
              >
                <Icon name="calendar" size={14} />
                <span>{task.title}</span>
                <small>{t("studyApp.session.minutes", { count: task.minutes })}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="session-empty">
            {t("studyApp.session.goal.noTasks")} <Link to="/plan">{t("studyApp.session.goal.openPlan")}</Link>
          </p>
        )}
      </section>

      {/* تقسيم الجلسة: المراحل ومدتها وأصواتها */}
      <SessionPlanner timer={timer} />

      <SoundMixer mixer={session.mixer} sounds={sessionSounds} />

      {/* الخلفية */}
      <section className="session-card">
        <header className="session-card__head">
          <h2 className="session-card__title">{t("studyApp.session.scenes.title")}</h2>
          <Link to="/study/library?tab=mine" className="session-card__action is-neutral">
            {t("library.session.manage")}
          </Link>
        </header>

        {/* بس الخلفيات اللي نقلتها من مكتبتي */}
        {sessionScenes.length === 0 && (
          <p className="session-empty">
            {t("library.session.noScenes")}{" "}
            <Link to="/study/library?tab=mine">{t("library.session.open")}</Link>
          </p>
        )}

        <div className="scene-picker">
          {sessionScenes.map((item) => (
            <button
              key={item.id}
              type="button"
              className="scene-picker__item"
              aria-pressed={scene.id === item.id}
              onClick={() => session.updatePrefs({ sceneId: item.id })}
            >
              <span className="scene-picker__preview">
                <SceneBackground scene={item} />
              </span>
              <span className="scene-picker__name" dir="auto">
                {getSceneName(item, t)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* الإحصائيات */}
      <section className="session-card">
        <h2 className="session-card__title">{t("studyApp.session.stats.title")}</h2>

        <div className="session-stats">
          <div className="session-stat">
            <strong>{stats.today.minutes}</strong>
            <span>{t("studyApp.session.stats.today")}</span>
          </div>
          <div className="session-stat">
            <strong>{stats.today.rounds}</strong>
            <span>{t("studyApp.session.stats.rounds")}</span>
          </div>
          <div className="session-stat">
            <strong>🔥 {stats.streak}</strong>
            <span>{t("studyApp.session.stats.streak")}</span>
          </div>
        </div>

        {/* آخر 7 أيام: طول كل عمود حسب دقائق اليوم */}
        <p className="session-card__hint">{t("studyApp.session.stats.week")}</p>
        <div className="session-week">
          {stats.week.map((day) => (
            <div key={day.date.toDateString()} className="session-week__day">
              <span
                className="session-week__bar"
                style={{ "--height": day.minutes / weekMax }}
                title={t("studyApp.session.minutes", { count: day.minutes })}
              />
              <span className="session-week__label">
                {day.date.toLocaleDateString(i18n.resolvedLanguage, { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Session;