import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import Logo from "../Logo/Logo.jsx";
import LanguageToggle from "../LanguageToggle/LanguageToggle.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import "./Navbar.css";

// روابط الأقسام: كل رابط بيفتح صفحة القسم نفسه
// (الأقسام محمية: بدون تسجيل دخول بتفتح صفحة الدخول، وبعدها بيرجع على القسم)
const NAV_LINKS = [
  { id: "social", key: "nav.social", page: "/community" },
  { id: "study", key: "nav.study", page: "/study" },
  { id: "plan", key: "nav.plan", page: "/plan" },
];

/**
 * الشريط العلوي للصفحات العامة (الخطة الدراسية، عن المنصة، الخصوصية).
 */
function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isLoggedIn, logout } = useAuth();

  // حالة قائمة الموبايل: مفتوحة أو مغلقة
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // رابط قسم واحد (مميّز إذا كنا بصفحته)
  function renderLink(link, baseClass, onClick) {
    const isActive = pathname.startsWith(link.page);

    return (
      <Link
        key={link.id}
        to={link.page}
        className={`${baseClass} ${isActive ? "is-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={onClick}
      >
        {t(link.key)}
      </Link>
    );
  }

  // تسجيل الخروج (بيرجع على صفحة الدخول لحاله)
  function handleLogout() {
    setIsMenuOpen(false);
    logout();
  }

  // أزرار الحساب: مسجّل ← ادخل المنصة وتسجيل خروج، مش مسجّل ← دخول وإنشاء حساب
  function renderActions(size, onClick) {
    if (isLoggedIn) {
      return (
        <>
          <button type="button" className={`btn btn--outline ${size}`} onClick={handleLogout}>
            {t("actions.logout")}
          </button>
          <Link to="/community" className={`btn btn--primary ${size}`} onClick={onClick}>
            {t("actions.openApp")}
          </Link>
        </>
      );
    }

    return (
      <>
        <Link to="/login" className={`btn btn--outline ${size}`} onClick={onClick}>
          {t("actions.login")}
        </Link>
        <Link to="/register" className={`btn btn--primary ${size}`} onClick={onClick}>
          {t("actions.start")}
        </Link>
      </>
    );
  }

  function toggleMenu() {
    setIsMenuOpen((isOpen) => !isOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  // إغلاق القائمة بزر Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <Logo />

          {/* روابط الأقسام */}
          <nav className="navbar__links" aria-label={t("nav.mainLabel")}>
            {NAV_LINKS.map((link) => renderLink(link, "navbar__link"))}
          </nav>

          {/* الأزرار */}
          <div className="navbar__actions">
            <LanguageToggle />
            {renderActions("")}

            {/* زر قائمة الموبايل */}
            <button
              type="button"
              className={`navbar__toggle ${isMenuOpen ? "is-open" : ""}`}
              aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={toggleMenu}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* قائمة الموبايل */}
      <nav
        id="mobile-menu"
        className={`mobile-menu ${isMenuOpen ? "is-open" : ""}`}
        aria-label={t("nav.mobileLabel")}
      >
        {NAV_LINKS.map((link) => renderLink(link, "mobile-menu__link", closeMenu))}

        <div className="mobile-menu__actions">{renderActions("btn--lg", closeMenu)}</div>
      </nav>
    </>
  );
}

export default Navbar;