import { useTranslation } from "react-i18next";
import { getPasswordStrength } from "../../utils/validation.js";
import "./PasswordStrength.css";

const BARS = [1, 2, 3, 4];

function PasswordStrength({ password }) {
  const { t } = useTranslation();
  const level = getPasswordStrength(password);

  return (
    <div className="strength" data-level={level}>
      <div className="strength__bars" aria-hidden="true">
        {BARS.map((bar) => (
          <span key={bar} className={`strength__bar ${bar <= level ? "is-active" : ""}`} />
        ))}
      </div>
      <p className="strength__label" aria-live="polite">
        {level === 0 ? t("register.strengthHint") : t(`register.strength${level}`)}
      </p>
    </div>
  );
}

export default PasswordStrength;