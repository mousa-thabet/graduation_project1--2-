import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Logo from "../Logo/Logo.jsx";
import Icon from "../Icon/Icon.jsx";
import { whatsappUrl } from "../../data/contact.js";
import "./Footer.css";

// أعمدة روابط الذيل
const FOOTER_COLUMNS = [
  {
    titleKey: "footer.sections",
    links: [
      { to: "/community", key: "nav.social" },
      { to: "/study", key: "nav.study" },
      { to: "/plan", key: "nav.plan" },
    ],
  },
  {
    titleKey: "footer.platform",
    links: [
      { to: "/about", key: "footer.aboutLink" },
      { to: "/privacy", key: "footer.privacy" },
    ],
  },
];

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* التعريف بالمنصة */}
        <div className="footer__brand">
          <Logo />
          <p className="footer__about">{t("footer.about")}</p>
        </div>

        {/* أعمدة الروابط */}
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.titleKey} className="footer__column" aria-label={t(column.titleKey)}>
            <h3 className="footer__title">{t(column.titleKey)}</h3>
            {column.links.map((link) => (
              <Link key={link.key} to={link.to} className="footer__link">
                {t(link.key)}
              </Link>
            ))}
          </nav>
        ))}

        {/* الدعم الفني */}
        <div className="footer__column">
          <h3 className="footer__title">{t("footer.support")}</h3>
          <p className="footer__note">{t("footer.supportText")}</p>
          <a
            href={whatsappUrl(t("info.whatsappMessage"))}
            className="footer__whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="chat" />
            {t("footer.whatsapp")}
          </a>
        </div>
      </div>

      {/* الحقوق */}
      <div className="footer__bottom">
        <p>
          <span dir="ltr">© {year} AreaTk</span> · {t("footer.rights")}
        </p>
        <p>{t("footer.project")}</p>
      </div>
    </footer>
  );
}

export default Footer;