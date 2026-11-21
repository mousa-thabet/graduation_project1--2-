import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import { SESSION_SOUNDS } from "../../../../data/sessionSounds.js";
import "./SessionPlanner.css";

const MIN_MINUTES = 5;
const MAX_MINUTES = 180;
const MAX_SEGMENTS = 8;

// جداول جاهزة: [دقائق الدراسة، دقائق الاستراحة]
const PRESETS = [
  [25, 5],
  [50, 10],
  [90, 15],
];

function createSegment(kind, minutes) {
  return { id: crypto.randomUUID(), kind, minutes, sounds: [] };
}

// 95 دقيقة ← "1:35"
function formatTotal(minutes) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * تقسيم الجلسة: جدول مراحل (دراسة أو استراحة)، لكل مرحلة مدتها وأصواتها.
 * timer: من useSessionTimer (الجدول في timer.plan)
 * التعديل مسموح في أي وقت، والمؤقت يكمل من مكانه
 */
function SessionPlanner({ timer }) {
  const { t } = useTranslation();
  const { plan, isActive } = timer;

  const totalMinutes = plan.segments.reduce((sum, segment) => sum + segment.minutes, 0);
  const studySegments = plan.segments.filter((segment) => segment.kind === "study").length;

  function setSegments(segments) {
    timer.updatePlan({ segments });
  }

  function updateSegment(id, changes) {
    setSegments(plan.segments.map((segment) => (segment.id === id ? { ...segment, ...changes } : segment)));
  }

  function changeMinutes(segment, step) {
    const minutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, segment.minutes + step));
    updateSegment(segment.id, { minutes });
  }

  function toggleSound(segment, soundId) {
    const sounds = segment.sounds.includes(soundId)
      ? segment.sounds.filter((id) => id !== soundId)
      : [...segment.sounds, soundId];

    updateSegment(segment.id, { sounds });
  }

  function addSegment(kind) {
    setSegments([...plan.segments, createSegment(kind, kind === "study" ? 25 : 5)]);
  }

  function removeSegment(id) {
    setSegments(plan.segments.filter((segment) => segment.id !== id));
  }

  // جدول جاهز: دراسة ثم استراحة (مع الحفاظ على الأصوات المختارة)
  function applyPreset([study, rest]) {
    const studySounds = plan.segments.find((segment) => segment.kind === "study")?.sounds ?? [];
    const breakSounds = plan.segments.find((segment) => segment.kind === "break")?.sounds ?? [];

    setSegments([
      { ...createSegment("study", study), sounds: studySounds },
      { ...createSegment("break", rest), sounds: breakSounds },
    ]);
  }

  return (
    <section className="session-card">
      <header className="session-card__head">
        <div>
          <h2 className="session-card__title">{t("studyApp.session.planner.title")}</h2>
          <p className="session-card__hint">{t("studyApp.session.planner.hint")}</p>
        </div>
        <span className="planner-total">
          {t("studyApp.session.planner.total")} <strong dir="ltr">{formatTotal(totalMinutes)}</strong>
        </span>
      </header>

      {/* الشريط الزمني: عرض كل مرحلة حسب مدتها، والمرحلة الحالية مميزة */}
      <div className="planner-timeline" aria-hidden="true">
        {plan.segments.map((segment, index) => (
          <span
            key={segment.id}
            className={`planner-timeline__part planner-timeline__part--${segment.kind} ${
              isActive && index === timer.index ? "is-current" : ""
            }`}
            style={{ flexGrow: segment.minutes }}
          >
            {segment.minutes}
          </span>
        ))}
      </div>

      {/* الجداول الجاهزة */}
      <div className="planner-presets">
        {PRESETS.map((preset) => (
          <button key={preset.join("-")} type="button" className="planner-preset" onClick={() => applyPreset(preset)}>
            <span dir="ltr">
              {preset[0]} / {preset[1]}
            </span>
          </button>
        ))}
      </div>

      {/* المراحل */}
      <ol className="planner-list">
        {plan.segments.map((segment, index) => {
          const isStudy = segment.kind === "study";
          // لا نحذف آخر مرحلة دراسة
          const canRemove = plan.segments.length > 1 && !(isStudy && studySegments === 1);

          return (
            <li
              key={segment.id}
              className={`planner-segment planner-segment--${segment.kind} ${
                isActive && index === timer.index ? "is-current" : ""
              }`}
            >
              <div className="planner-segment__row">
                <span className="planner-segment__number">{index + 1}</span>

                {/* الضغط يبدّل بين دراسة واستراحة */}
                <button
                  type="button"
                  className="planner-segment__kind"
                  onClick={() => updateSegment(segment.id, { kind: isStudy ? "break" : "study" })}
                >
                  {t(`studyApp.session.phases.${segment.kind}`)}
                </button>

                <div className="planner-stepper">
                  <button
                    type="button"
                    aria-label={t("studyApp.session.planner.less")}
                    disabled={segment.minutes <= MIN_MINUTES}
                    onClick={() => changeMinutes(segment, -5)}
                  >
                    −
                  </button>
                  <output>{t("studyApp.session.minutes", { count: segment.minutes })}</output>
                  <button
                    type="button"
                    aria-label={t("studyApp.session.planner.more")}
                    disabled={segment.minutes >= MAX_MINUTES}
                    onClick={() => changeMinutes(segment, 5)}
                  >
                    +
                  </button>
                </div>

                {canRemove && (
                  <button
                    type="button"
                    className="planner-segment__remove"
                    aria-label={t("studyApp.session.planner.remove")}
                    onClick={() => removeSegment(segment.id)}
                  >
                    <Icon name="x" size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* أصوات هذه المرحلة */}
              <div className="planner-sounds" role="group" aria-label={t("studyApp.session.planner.sounds")}>
                {SESSION_SOUNDS.map((sound) => {
                  const name = t(`studyApp.session.sounds.items.${sound.id}`);

                  return (
                    <button
                      key={sound.id}
                      type="button"
                      className="planner-sound"
                      aria-pressed={segment.sounds.includes(sound.id)}
                      aria-label={name}
                      title={name}
                      onClick={() => toggleSound(segment, sound.id)}
                    >
                      <Icon name={sound.icon} size={16} />
                    </button>
                  );
                })}
                {segment.sounds.length === 0 && (
                  <span className="planner-sounds__none">{t("studyApp.session.planner.silent")}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* إضافة مرحلة + التكرار */}
      <div className="planner-footer">
        <div className="planner-add">
          <button
            type="button"
            disabled={plan.segments.length >= MAX_SEGMENTS}
            onClick={() => addSegment("study")}
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            {t("studyApp.session.phases.study")}
          </button>
          <button
            type="button"
            disabled={plan.segments.length >= MAX_SEGMENTS}
            onClick={() => addSegment("break")}
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            {t("studyApp.session.phases.break")}
          </button>
        </div>

        <label className="session-switch">
          <input
            type="checkbox"
            checked={plan.repeat}
            onChange={(event) => timer.updatePlan({ repeat: event.target.checked })}
          />
          <span className="session-switch__track" aria-hidden="true" />
          {t("studyApp.session.planner.repeat")}
        </label>
      </div>
    </section>
  );
}

export default SessionPlanner;