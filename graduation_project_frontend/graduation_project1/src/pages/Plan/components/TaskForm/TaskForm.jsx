import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FormField from "../../../../components/FormField/FormField.jsx";
import Icon from "../../../../components/Icon/Icon.jsx";
import { validateMinutes, validateRequired } from "../../../../utils/validation.js";
import {
  createId,
  MAX_TASK_MINUTES,
  MIN_TASK_MINUTES,
  WEEK_DAYS,
} from "../../../../utils/planUtils.js";
import "./TaskForm.css";

const INITIAL_VALUES = { title: "", minutes: "45", kind: "study" };

const KINDS = ["study", "rest"];

/**
 * فورم إضافة مهمة.
 * ref يشير إلى حقل اسم المهمة حتى تستطيع الصفحة التركيز عليه.
 */
function TaskForm({ mode, day, onDayChange, onAdd, ref }) {
  const { t } = useTranslation();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const minutesRef = useRef(null);

  const isWeekly = mode === "weekly";
  const isRest = values.kind === "rest";

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      // اسم الاستراحة اختياري
      title: isRest ? "" : validateRequired(values.title, "errors.taskTitle"),
      minutes: validateMinutes(values.minutes, MIN_TASK_MINUTES, MAX_TASK_MINUTES),
    };

    setErrors(nextErrors);

    if (nextErrors.title) {
      ref.current.focus();
      return;
    }

    if (nextErrors.minutes) {
      minutesRef.current.focus();
      return;
    }

    onAdd({
      id: createId(),
      title: values.title.trim(),
      minutes: Number(values.minutes),
      kind: values.kind,
      status: "pending",
      ...(isWeekly && { day }),
    });

    // نفرّغ الاسم فقط، ونبقي المدة والنوع لإضافة مهمة أخرى بسرعة
    setValues((current) => ({ ...current, title: "" }));
    ref.current.focus();
  }

  return (
    <section className="task-form">
      <form className="task-form__form" onSubmit={handleSubmit} noValidate>
        <div className="task-form__title">
          <FormField
            ref={ref}
            id="task-title"
            name="title"
            label={t("plan.taskTitle")}
            placeholder={isRest ? t("plan.restPlaceholder") : t("plan.titlePlaceholder")}
            maxLength={60}
            autoComplete="off"
            value={values.title}
            error={errors.title && t(errors.title)}
            onChange={handleChange}
          />
        </div>

        <div className="task-form__minutes">
          <FormField
            ref={minutesRef}
            id="task-minutes"
            name="minutes"
            type="number"
            inputMode="numeric"
            label={t("plan.minutes")}
            min={MIN_TASK_MINUTES}
            max={MAX_TASK_MINUTES}
            step={5}
            value={values.minutes}
            error={errors.minutes && t(errors.minutes)}
            onChange={handleChange}
          />
        </div>

        {/* اليوم: في الخطة الأسبوعية فقط */}
        {isWeekly && (
          <div className="field task-form__day">
            <label htmlFor="task-day" className="field__label">
              {t("plan.day")}
            </label>
            <select
              id="task-day"
              className="task-form__select"
              value={day}
              onChange={(event) => onDayChange(Number(event.target.value))}
            >
              {WEEK_DAYS.map((weekDay) => (
                <option key={weekDay} value={weekDay}>
                  {t(`plan.days.${weekDay}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* النوع: دراسة أو استراحة */}
        <fieldset className="task-form__kinds">
          <legend className="field__label">{t("plan.kind")}</legend>

          {KINDS.map((kind) => (
            <label key={kind} className="task-form__kind">
              <input
                type="radio"
                name="kind"
                value={kind}
                checked={values.kind === kind}
                onChange={handleChange}
              />
              <span className={`task-form__pill task-form__pill--${kind}`}>{t(`plan.${kind}`)}</span>
            </label>
          ))}
        </fieldset>

        <button type="submit" className="btn btn--primary task-form__submit">
          <Icon name="plus" strokeWidth={2.5} />
          {t("plan.add")}
        </button>
      </form>
    </section>
  );
}

export default TaskForm;