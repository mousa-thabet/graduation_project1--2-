import Icon from "../../../components/Icon/Icon.jsx";
import "./EmptyState.css";

/**
 * رسالة عند عدم وجود نتائج أو محتوى.
 * children: أزرار أو اقتراحات إضافية (اختياري)
 */
function EmptyState({ icon, title, text, children }) {
  return (
    <div className="empty-state">
      {icon && (
        <span className="empty-state__icon">
          <Icon name={icon} size={26} />
        </span>
      )}
      <h2 className="empty-state__title">{title}</h2>
      {text && <p className="empty-state__text">{text}</p>}
      {children}
    </div>
  );
}

export default EmptyState;