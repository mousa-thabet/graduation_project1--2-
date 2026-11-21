import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../Icon/Icon.jsx";
import "./Lightbox.css";

/**
 * عرض الصورة مكبّرة فوق الصفحة.
 * يُغلق بزر الإغلاق، أو بالضغط خارج الصورة، أو بزر Escape.
 */
function Lightbox({ src, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    // منع تمرير الصفحة خلف الصورة
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeRef.current.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t("studyApp.post.imageView")}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox__close"
        aria-label={t("studyApp.post.close")}
        onClick={onClose}
      >
        <Icon name="x" size={22} strokeWidth={2.5} />
      </button>

      <img className="lightbox__image" src={src} alt="" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

export default Lightbox;