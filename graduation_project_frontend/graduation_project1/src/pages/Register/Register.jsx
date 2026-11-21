import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import FormField from "../../components/FormField/FormField.jsx";
import PasswordStrength from "../../components/PasswordStrength/PasswordStrength.jsx";
import Checkbox from "../../components/Checkbox/Checkbox.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation.js";
import "./Register.css";

const INITIAL_VALUES = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

// ترتيب الحقول لنقل التركيز إلى أول حقل فيه خطأ
const FIELD_ORDER = ["username", "email", "password", "confirmPassword", "terms"];

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading

  const fieldRefs = {
    username: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    terms: useRef(null),
  };

  // تحديث القيمة (نص أو مربع اختيار) وإخفاء الخطأ
  function handleChange(event) {
    const { name, type, value, checked } = event.target;

    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    return {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(values.confirmPassword, values.password),
      terms: values.terms ? "" : "errors.termsRequired",
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    // نقل التركيز إلى أول حقل فيه خطأ
    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);

    if (firstInvalid) {
      fieldRefs[firstInvalid].current.focus();
      return;
    }

    setStatus("loading");

    // مؤقتًا: محاكاة طلب الخادم إلى أن يجهز الباك إند
    // الحساب الجديد بيدخل مباشرة، وأول صفحة: "شو بيهمك؟" بالتواصل
    setTimeout(() => {
      auth.login(values.username);
      navigate("/community/welcome", { replace: true });
    }, 1200);
  }

  // ترجمة مفتاح الخطأ إن وُجد
  function errorText(name) {
    return errors[name] && t(errors[name]);
  }

  const isLoading = status === "loading";

  return (
    <section className="auth-card">
      <div className="auth-card__head">
        <h1 className="auth-card__title">{t("register.title")}</h1>
        <p className="auth-card__subtitle">{t("register.subtitle")}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          ref={fieldRefs.username}
          id="register-username"
          name="username"
          label={t("register.username")}
          autoComplete="username"
          dir="ltr"
          value={values.username}
          error={errorText("username")}
          onChange={handleChange}
        />

        <FormField
          ref={fieldRefs.email}
          id="register-email"
          name="email"
          type="email"
          label={t("register.email")}
          autoComplete="email"
          dir="ltr"
          value={values.email}
          error={errorText("email")}
          onChange={handleChange}
        />

        <div className="register__password">
          <FormField
            ref={fieldRefs.password}
            id="register-password"
            name="password"
            type="password"
            label={t("register.password")}
            autoComplete="new-password"
            value={values.password}
            error={errorText("password")}
            onChange={handleChange}
          />
          <PasswordStrength password={values.password} />
        </div>

        <FormField
          ref={fieldRefs.confirmPassword}
          id="register-confirm"
          name="confirmPassword"
          type="password"
          label={t("register.confirmPassword")}
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errorText("confirmPassword")}
          onChange={handleChange}
        />

        <Checkbox
          ref={fieldRefs.terms}
          id="register-terms"
          name="terms"
          checked={values.terms}
          error={errorText("terms")}
          onChange={handleChange}
        >
          {t("register.termsAgree")}{" "}
          {/* بتبويب ثاني حتى ما يضيع اللي كتبه بالنموذج */}
          <Link to="/privacy" target="_blank" rel="noopener">
            {t("footer.privacy")}
          </Link>
        </Checkbox>

        <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
          {isLoading ? t("register.loading") : t("register.submit")}
        </button>
      </form>

      <div className="auth-card__divider" />

      <p className="auth-card__switch">
        {t("register.haveAccount")}
        <Link to="/login">{t("actions.login")}</Link>
      </p>
    </section>
  );
}

export default Register;