import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import "./StudyHeader.css";

/**
 * رأس الصفحة الثابت أعلى المحتوى (مثل X).
 * backTo: رابط زر الرجوع (اختياري)
 * children: أدوات إضافية مثل التبويبات أو البحث
 */
function StudyHeader({ title, backTo, children }) {
  const { t } = useTranslation();

  return (
    <header className="study-header">
      <div className="study-header__row">
        {backTo && (
          <Link to={backTo} className="study-header__back" aria-label={t("studyApp.back")}>
            <Icon name="arrowRight" size={20} />
          </Link>
        )}
        <h1 className="study-header__title">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export default StudyHeader;