import { useTranslation } from "react-i18next";
import "./LanguageToggle.css";

// مدة اختفاء المحتوى قبل تبديل اللغة (تطابق مدة الحركة في CSS)
const SWITCH_DURATION = 300;

function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.resolvedLanguage === "ar";

  // تبديل اللغة مع حركة اختفاء وظهور
  function toggleLanguage() {
    document.body.classList.add("is-switching");

    setTimeout(() => {
      i18n.changeLanguage(isArabic ? "en" : "ar");
      document.body.classList.remove("is-switching");
    }, SWITCH_DURATION);
  }

  return (
    <button
      type="button"
      className="language-toggle"
      aria-label={t("nav.switchLanguage")}
      onClick={toggleLanguage}
    >
      {isArabic ? "EN" : "ع"}
    </button>
  );
}

export default LanguageToggle;