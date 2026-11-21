import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import { HOME_SECTIONS } from "../../data/homeSections.js";
import { whatsappUrl } from "../../data/contact.js";
import "./Info.css";

// ليش Areatk: كل قيمة بأيقونتها (النصوص بملف الترجمة)
const VALUES = [
  { id: "free", icon: "heart" },
  { id: "focus", icon: "headphones" },
  { id: "trust", icon: "shield" },
  { id: "languages", icon: "message" },
];

/**
 * عن المنصة: /about
 * شو هي Areatk، أقسامها الثلاثة، ليش بنختلف، الشارات، وكيف تتواصل معنا.
 */
function About() {
  const { t } = useTranslation();

  return (
    <main className="info">
      <div className="info__bg" aria-hidden="true" />

      <div className="info__container">
        {/* المقدمة */}
        <header className="info-hero">
          <span className="info-badge">{t("info.about.badge")}</span>
          <h1 className="info-hero__title">
            {t("info.about.title")}
            <span className="info-hero__highlight">{t("info.about.highlight")}</span>
          </h1>
          <p className="info-hero__text">{t("info.about.text")}</p>
        </header>

        {/* الأقسام الثلاثة */}
        <section className="info-section" aria-labelledby="about-sections">
          <h2 id="about-sections" className="info-section__title">
            {t("info.about.sectionsTitle")}
          </h2>
          <div className="info-grid info-grid--3">
            {HOME_SECTIONS.map((section) => (
              <Link key={section.id} to={section.ctaHref} className="info-card info-card--link">
                <span className="info-card__number">{section.number}</span>
                <h3 className="info-card__title">{t(`home.${section.id}.badge`)}</h3>
                <p className="info-card__text">{t(`home.${section.id}.text`)}</p>
                <span className="info-card__more">
                  {t(`home.${section.id}.cta`)}
                  <Icon name="arrowRight" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ليش Areatk */}
        <section className="info-section" aria-labelledby="about-values">
          <h2 id="about-values" className="info-section__title">
            {t("info.about.valuesTitle")}
          </h2>
          <div className="info-grid info-grid--2">
            {VALUES.map((value) => (
              <article key={value.id} className="info-card info-card--row">
                <span className="info-card__icon" aria-hidden="true">
                  <Icon name={value.icon} size={22} />
                </span>
                <div>
                  <h3 className="info-card__title">{t(`info.about.values.${value.id}.title`)}</h3>
                  <p className="info-card__text">{t(`info.about.values.${value.id}.text`)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* الشارات: الدرع الأزرق والأخضر */}
        <section className="info-section info-badges" aria-labelledby="about-badges">
          <h2 id="about-badges" className="info-section__title">
            {t("info.about.badgesTitle")}
          </h2>
          <p className="info-section__text">{t("info.about.badgesText")}</p>
          <ul className="info-badges__list">
            <li className="info-badges__item info-badges__item--expert">
              <Icon name="shield" size={20} />
              {t("info.about.expert")}
            </li>
            <li className="info-badges__item info-badges__item--scholar">
              <Icon name="shield" size={20} />
              {t("info.about.scholar")}
            </li>
          </ul>
        </section>

        {/* تواصل معنا */}
        <section className="info-cta">
          <h2 className="info-cta__title">{t("info.about.ctaTitle")}</h2>
          <p className="info-cta__text">{t("info.about.ctaText")}</p>
          <div className="info-cta__actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              {t("actions.start")}
            </Link>
            <a
              href={whatsappUrl(t("info.whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline btn--lg"
            >
              <Icon name="chat" size={18} />
              {t("footer.whatsapp")}
            </a>
          </div>
          <p className="info-cta__note">{t("footer.project")}</p>
        </section>
      </div>
    </main>
  );
}

export default About;