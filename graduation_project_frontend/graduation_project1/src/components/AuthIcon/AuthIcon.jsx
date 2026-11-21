import Icon from "../Icon/Icon.jsx";
import "./AuthIcon.css";

/**
 * أيقونة دائرية لرؤوس صفحات الحساب.
 * variant: لون الأيقونة (primary أو success)
 * animation: نوع الحركة (pulse أو float أو draw)
 */
function AuthIcon({ name, variant = "primary", animation = "pulse" }) {
  return (
    <span className={`auth-icon auth-icon--${variant} auth-icon--${animation}`} aria-hidden="true">
      <Icon name={name} size={28} />
    </span>
  );
}

export default AuthIcon;