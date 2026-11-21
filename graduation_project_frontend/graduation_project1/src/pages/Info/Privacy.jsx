import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon/Icon.jsx";
import { PRIVACY_UPDATED_AT, whatsappUrl } from "../../data/contact.js";
import "./Info.css";

// أقسام السياسة بالترتيب (كل قسم إله عنوان وفقرات بملف الترجمة)
const SECTIONS = ["data", "use", "storage", "badges", "rules", "moderation", "rights", "changes"];

/**
 * سياسة الاستخدام والخصوصية: /privacy
 * فهرس على الجنب (بيصير فوق على الموبايل)، وكل قسم بعنوان وفقرات أو نقاط.
 * صفحة التسجيل بتفتحها بتبويب ثاني حتى ما يضيع اللي كتبه.
 */
function Privacy() {
  const { t, i18n } = useTranslation();

  // timeZone: UTC حتى ما يتغير اليوم حسب توقيت جهاز الزائر
  const updatedAt = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(PRIVACY_UPDATED_AT)
  );

  return (
    <main className="info">
      <div className="info__bg" aria-hidden="true" />

      <div className="info__container">
        <header className="info-hero info-hero--small">
          <span className="info-badge">{t("info.privacy.badge")}</span>
          <h1 className="info-hero__title">{t("info.privacy.title")}</h1>
          <p className="info-hero__text">{t("info.privacy.intro")}</p>
          <p className="info-hero__meta">
            <Icon name="calendar" size={16} />
            {t("info.privacy.updated", { date: updatedAt })}
          </p>
        </header>

        <div className="info-policy">
          {/* الفهرس */}
          <nav className="info-toc" aria-label={t("info.privacy.toc")}>
            <h2 className="info-toc__title">{t("info.privacy.toc")}</h2>
            <ol>
              {SECTIONS.map((id) => (
                <li key={id}>
                  <a href={`#${id}`}>{t(`info.privacy.sections.${id}.title`)}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="info-policy__body">
            {SECTIONS.map((id, index) => (
              <section key={id} id={id} className="info-policy__section">
                <h2>
                  <span className="info-policy__number">{index + 1}</span>
                  {t(`info.privacy.sections.${id}.title`)}
                </h2>
                <ul>
                  {t(`info.privacy.sections.${id}.points`, { returnObjects: true }).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}

            {/* أسئلة عن الخصوصية */}
            <section className="info-policy__section info-policy__contact">
              <h2>{t("info.privacy.contactTitle")}</h2>
              <p>{t("info.privacy.contactText")}</p>
              <a
                href={whatsappUrl(t("info.whatsappMessage"))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--outline"
              >
                <Icon name="chat" size={18} />
                {t("footer.whatsapp")}
              </a>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Privacy;