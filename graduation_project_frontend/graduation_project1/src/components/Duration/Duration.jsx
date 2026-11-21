import { useTranslation } from "react-i18next";
import "./Duration.css";

/**
 * يعرض المدة بشكل مختصر، مثل: 1 س 30 د
 */
function Duration({ minutes, className = "" }) {
  const { t } = useTranslation();

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return (
    <span className={`duration ${className}`}>
      {hours > 0 && (
        <span className="duration__part">
          {hours}
          <small>{t("units.hourShort")}</small>
        </span>
      )}
      {(rest > 0 || hours === 0) && (
        <span className="duration__part">
          {rest}
          <small>{t("units.minShort")}</small>
        </span>
      )}
    </span>
  );
}

export default Duration;