import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Logo from "../../components/Logo/Logo.jsx";
import "./NotFound.css";

function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="not-found">
      <Logo />
      <p className="not-found__code" aria-hidden="true">
        {t("notFound.code")}
      </p>
      <h1 className="not-found__title">{t("notFound.title")}</h1>
      <p className="not-found__text">{t("notFound.text")}</p>
      <Link to="/" className="btn btn--primary btn--lg">
        {t("notFound.back")}
      </Link>
    </main>
  );
}

export default NotFound;