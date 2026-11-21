import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import "./ModeSwitch.css";

const MODES = [
  { id: "daily", icon: "clock" },
  { id: "weekly", icon: "calendar" },
];

// التبديل بين الخطة اليومية والأسبوعية
function ModeSwitch({ mode, onChange }) {
  const { t } = useTranslation();

  return (
    <div className={`mode-switch mode-switch--${mode}`} role="group" aria-label={t("plan.modeLabel")}>
      {/* الخلفية المتحركة خلف الزر المختار */}
      <span className="mode-switch__indicator" aria-hidden="true" />

      {MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className="mode-switch__button"
          aria-pressed={mode === item.id}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} />
          {t(`plan.${item.id}`)}
        </button>
      ))}
    </div>
  );
}

export default ModeSwitch;