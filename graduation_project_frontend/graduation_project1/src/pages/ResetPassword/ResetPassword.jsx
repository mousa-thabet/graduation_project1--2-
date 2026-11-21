import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import FormField from "../../components/FormField/FormField.jsx";
import PasswordStrength from "../../components/PasswordStrength/PasswordStrength.jsx";
import AuthIcon from "../../components/AuthIcon/AuthIcon.jsx";
import BackLink from "../../components/BackLink/BackLink.jsx";
import { validateConfirmPassword, validatePassword } from "../../utils/validation.js";
import "../ForgotPassword/ForgotPassword.css";

const INITIAL_VALUES = { password: "", confirmPassword: "" };

function ResetPassword() {
  const { t } = useTranslation();

  // الرمز السري القادم من رابط البريد: /reset-password?token=...
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | done

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(values.confirmPassword, values.password),
    };

    setErrors(nextErrors);

    if (nextErrors.password) {
      passwordRef.current.focus();
      return;
    }

    if (nextErrors.confirmPassword) {
      confirmRef.current.focus();
      return;
    }

    setStatus("loading");

    // مؤقتًا: محاكاة الطلب. لاحقًا نرسل token وكلمة المرور الجديدة إلى الباك إند
    setTimeout(() => {
      setStatus("done");
    }, 1200);
  }

  // رابط بدون رمز: غير صالح
  if (!token) {
    return (
      <section className="auth-card">
        <div className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="lock" />
            <h1 className="auth-card__title">{t("reset.invalidTitle")}</h1>
            <p className="auth-card__subtitle">{t("reset.invalidText")}</p>
          </div>

          <Link to="/forgot-password" className="btn btn--primary auth-form__submit">
            {t("reset.requestNew")}
          </Link>
        </div>

        <div className="auth-card__divider" />

        <BackLink to="/login">{t("forgot.backToLogin")}</BackLink>
      </section>
    );
  }

  if (status === "done") {
    return (
      <section className="auth-card">
        <div className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="check" variant="success" animation="draw" />
            <h1 className="auth-card__title">{t("reset.doneTitle")}</h1>
            <p className="auth-card__subtitle">{t("reset.doneText")}</p>
          </div>

          <Link to="/login" className="btn btn--primary auth-form__submit">
            {t("reset.goToLogin")}
          </Link>
        </div>
      </section>
    );
  }

  const isLoading = status === "loading";

  return (
    <section className="auth-card">
      <div className="forgot__step">
        <div className="auth-card__head">
          <AuthIcon name="key" />
          <h1 className="auth-card__title">{t("reset.title")}</h1>
          <p className="auth-card__subtitle">{t("reset.subtitle")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="forgot__password">
            <FormField
              ref={passwordRef}
              id="reset-password"
              name="password"
              type="password"
              label={t("reset.password")}
              autoComplete="new-password"
              value={values.password}
              error={errors.password && t(errors.password)}
              onChange={handleChange}
            />
            <PasswordStrength password={values.password} />
          </div>

          <FormField
            ref={confirmRef}
            id="reset-confirm"
            name="confirmPassword"
            type="password"
            label={t("register.confirmPassword")}
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword && t(errors.confirmPassword)}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
            {isLoading ? t("reset.loading") : t("reset.submit")}
          </button>
        </form>
      </div>

      <div className="auth-card__divider" />

      <BackLink to="/login">{t("forgot.backToLogin")}</BackLink>
    </section>
  );
}

export default ResetPassword;