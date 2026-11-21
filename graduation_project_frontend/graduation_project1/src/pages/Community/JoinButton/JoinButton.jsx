import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import "./JoinButton.css";

/**
 * زر الانضمام والمغادرة.
 * بعد الانضمام يظهر "منضم ✓"، وعند المرور عليه يتحول لـ"مغادرة" باللون الأحمر.
 * isJoined: منضم الآن؟  •  onToggle: انضمام أو مغادرة  •  size: "small" للأزرار الصغيرة
 */
function JoinButton({ isJoined, onToggle, size, label }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`join-button ${isJoined ? "is-joined" : ""} ${size === "small" ? "join-button--small" : ""}`}
      aria-pressed={isJoined}
      aria-label={label}
      onClick={(event) => {
        // داخل بطاقة قابلة للضغط: الزر لا يفتح البطاقة
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      {isJoined ? (
        <>
          <span className="join-button__joined">
            <Icon name="check" size={15} strokeWidth={2.5} />
            {t("community.join.joined")}
          </span>
          <span className="join-button__leave">{t("community.join.leave")}</span>
        </>
      ) : (
        <>
          <Icon name="plus" size={15} strokeWidth={2.5} />
          {t("community.join.join")}
        </>
      )}
    </button>
  );
}

export default JoinButton;