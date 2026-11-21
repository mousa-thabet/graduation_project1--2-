import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router";
import Logo from "../../components/Logo/Logo.jsx";
import LanguageToggle from "../../components/LanguageToggle/LanguageToggle.jsx";
import "./AuthLayout.css";

/**
 * قالب صفحات الحساب (الدخول، إنشاء حساب، استعادة كلمة المرور):
 * النموذج بجهة، ولوحة خضرا فيها اسم المنصة وجملة ترحيب بالجهة الثانية.
 * نص اللوحة بيتغيّر حسب الصفحة: إنشاء الحساب إله نص، والباقي نص الدخول.
 */
function AuthLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const panel = pathname === "/register" ? "register" : "login";

  return (
    <div className="auth-layout">
      {/* جهة النموذج */}
      <div className="auth-side">
        <header className="auth-header">
          {/* الشعار هون للموبايل بس (اللوحة الخضرا بتختفي) */}
          <Logo />
          <LanguageToggle />
        </header>

        <main className="auth-main">
          <Outlet />
        </main>

        <nav className="auth-footer" aria-label={t("footer.platform")}>
          <Link to="/about">{t("footer.aboutLink")}</Link>
          <Link to="/privacy">{t("footer.privacy")}</Link>
        </nav>
      </div>

      {/* اللوحة الخضرا */}
      <aside className="auth-panel">
        <Logo />
        <h2 className="auth-panel__title">{t(`auth.panel.${panel}.title`)}</h2>
        <p className="auth-panel__text">{t(`auth.panel.${panel}.text`)}</p>
      </aside>
    </div>
  );
}

export default AuthLayout;