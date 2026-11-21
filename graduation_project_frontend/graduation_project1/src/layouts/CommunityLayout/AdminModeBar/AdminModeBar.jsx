import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import "./AdminModeBar.css";

/**
 * شريط "وضع الإدارة" فوق صفحات التواصل: بيظهر لما الأدمن يتصفح المجتمعات من اللوحة.
 * بيذكّره إن بدل الإبلاغ في حجب، وفيه رابط يرجّعه للوحة.
 */
function AdminModeBar() {
  const { t } = useTranslation();

  return (
    <div className="admin-mode-bar" role="note">
      <span className="admin-mode-bar__icon" aria-hidden="true">
        <Icon name="shield" size={18} />
      </span>
      <p>
        <strong>{t("moderation.bar.title")}</strong>
        <span>{t("moderation.bar.text")}</span>
      </p>
      <Link to="/admin" className="admin-mode-bar__back">
        {t("moderation.bar.back")}
      </Link>
    </div>
  );
}

export default AdminModeBar;