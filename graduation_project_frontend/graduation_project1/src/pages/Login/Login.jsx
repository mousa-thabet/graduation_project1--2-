import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import FormField from "../../components/FormField/FormField.jsx";
import { useAdminSession } from "../../hooks/useAdmin.js";
import { useAuth } from "../../hooks/useAuth.js";
import { validateAccount, validateRequired } from "../../utils/validation.js";

const INITIAL_VALUES = { account: "", password: "" };
// بعد الدخول: إذا ما كان رايح على صفحة معيّنة، بيفتح الرئيسية (التواصل)
const DEFAULT_PAGE = "/community";

/**
 * تسجيل الدخول: نفس الصفحة للطالب وللأدمن (مثل المواقع الكبيرة).
 * الفرق بالصلاحية: حساب الأدمن بيدخل على لوحة الإدارة، والحساب العادي بيرجع على الصفحة اللي كان رايح عليها.
 * الدخول بينحفظ (useAuth)، فما بيحتاج يسجّل كل مرة.
 * الآن: أي حساب بيدخل، وحساب الأدمن تجريبي. لاحقًا: السيرفر بيتحقق وبيرجّع role مع الحساب.
 */
function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const adminSession = useAdminSession();
  const auth = useAuth();

  // الصفحة اللي كان رايح عليها قبل ما يطلب منه تسجيل الدخول (من RequireAuth)
  const from = location.state?.from;

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading

  const accountRef = useRef(null);
  const passwordRef = useRef(null);

  // تحديث قيمة الحقل وإخفاء خطئه أثناء الكتابة
  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      account: validateAccount(values.account),
      password: validateRequired(values.password, "errors.passwordRequired"),
    };

    setErrors(nextErrors);

    // نقل التركيز إلى أول حقل فيه خطأ
    if (nextErrors.account) {
      accountRef.current.focus();
      return;
    }

    if (nextErrors.password) {
      passwordRef.current.focus();
      return;
    }

    setStatus("loading");

    // مؤقتًا: محاكاة طلب الخادم إلى أن يجهز الباك إند
    setTimeout(() => {
      auth.login(values.account);

      // صلاحية أدمن: على لوحة الإدارة مباشرة
      if (adminSession.login(values.account, values.password)) {
        navigate("/admin", { replace: true });
        return;
      }

      navigate(from ?? DEFAULT_PAGE, { replace: true });
    }, 1200);
  }

  const isLoading = status === "loading";

  return (
    <section className="auth-card">
      <div className="auth-card__head">
        <h1 className="auth-card__title">{t("login.title")}</h1>
        <p className="auth-card__subtitle">{t("login.subtitle")}</p>
      </div>

      {/* جاي من قسم محمي: بنوضّحله ليش لازم يسجّل */}
      {from && (
        <p className="auth-form__status" role="status">
          {t("login.required")}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          ref={accountRef}
          id="login-account"
          name="account"
          label={t("login.account")}
          autoComplete="username"
          value={values.account}
          error={errors.account && t(errors.account)}
          onChange={handleChange}
        />

        <FormField
          ref={passwordRef}
          id="login-password"
          name="password"
          type="password"
          label={t("login.password")}
          autoComplete="current-password"
          value={values.password}
          error={errors.password && t(errors.password)}
          onChange={handleChange}
          action={
            <Link to="/forgot-password" className="auth-card__link">
              {t("login.forgot")}
            </Link>
          }
        />

        <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
          {isLoading ? t("login.loading") : t("login.submit")}
        </button>
      </form>

      <div className="auth-card__divider" />

      <p className="auth-card__switch">
        {t("login.newUser")}
        <Link to="/register">{t("login.createAccount")}</Link>
      </p>
    </section>
  );
}

export default Login;