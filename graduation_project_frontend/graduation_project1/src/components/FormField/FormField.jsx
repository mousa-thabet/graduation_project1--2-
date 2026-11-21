import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon/Icon.jsx";
import "./FormField.css";

/**
 * حقل إدخال موحّد: عنوان + حقل + رسالة خطأ.
 * إذا كان النوع password يظهر زر العين لإظهار كلمة المرور وإخفائها.
 */
function FormField({ id, label, error, action, type = "text", ref, ...inputProps }) {
  const { t } = useTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = type === "password";
  const errorId = `${id}-error`;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <div className="field__label-row">
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        {action}
      </div>

      <div className="field__control">
        <input
          ref={ref}
          id={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          className="field__input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />

        {isPassword && (
          <button
            type="button"
            className={`field__toggle ${isPasswordVisible ? "is-visible" : ""}`}
            aria-label={t(isPasswordVisible ? "auth.hidePassword" : "auth.showPassword")}
            onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          >
            <Icon name="eyeOff" size={20} className="field__eye field__eye--closed" />
            <Icon name="eye" size={20} className="field__eye field__eye--open" />
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;