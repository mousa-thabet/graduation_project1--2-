import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import "./CatalogSearch.css";

/**
 * مربع بحث لصفحات الامتحانات والدورات: النتائج تتغير أثناء الكتابة.
 * value / onChange: نص البحث  •  placeholder: النص الباهت
 * className: مكانه (مثلًا داخل رأس الصفحة الثابت حتى يضل ظاهر)
 * زر "/" بالكيبورد بيركّز على البحث من أي مكان بالصفحة (مثل يوتيوب وGitHub).
 */
function CatalogSearch({ value, onChange, placeholder, className = "" }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  // "/" يفتح البحث، إلا إذا كان المستخدم يكتب بحقل ثاني
  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target.tagName;
      if (event.key !== "/" || tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;

      event.preventDefault();
      inputRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`catalog-search ${className}`} role="search">
      <Icon name="search" size={18} />
      <input
        ref={inputRef}
        type="search"
        dir="auto"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-keyshortcuts="/"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onChange("")}
      />
      {value ? (
        <button type="button" aria-label={t("community.search.clear")} title={t("community.search.clear")} onClick={() => onChange("")}>
          <Icon name="x" size={16} strokeWidth={2.5} />
        </button>
      ) : (
        <kbd className="catalog-search__key" title={t("community.catalog.shortcut")}>
          /
        </kbd>
      )}
    </div>
  );
}

export default CatalogSearch;