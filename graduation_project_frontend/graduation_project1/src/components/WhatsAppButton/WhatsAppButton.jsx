import { useTranslation } from "react-i18next";
import Icon from "../Icon/Icon.jsx";
import { whatsappUrl } from "../../data/contact.js";
import "./WhatsAppButton.css";

/**
 * زر الدعم الفني العائم (بالزاوية تحت): بيفتح محادثة واتساب مع رسالة أولى جاهزة.
 * بيظهر بالصفحات العامة (الرئيسية، الخطة، عن المنصة، الخصوصية).
 */
function WhatsAppButton() {
  const { t } = useTranslation();

  return (
    <a
      href={whatsappUrl(t("info.whatsappMessage"))}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label={t("footer.whatsapp")}
    >
      <Icon name="chat" size={26} />
      <span className="whatsapp-button__label">{t("footer.whatsapp")}</span>
    </a>
  );
}

export default WhatsAppButton;