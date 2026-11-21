import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import UserBadge from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import { COMMUNITIES, GENERAL_ID, findCommunity, localName } from "../../../data/communities.js";
import { BADGE_TYPES, experiencePath } from "../../../data/badges.js";
import { MIN_ABOUT_LENGTH } from "../../../hooks/useBadges.js";
import { formatTimeAgo } from "../../../utils/format.js";
// شكل حقول النموذج ورفع الملف من نموذج رفع الأصوات في المكتبة
import "../../Study/Library/Library.css";
import "./Badges.css";

// الإثبات: صورة أو PDF حتى 5 ميغا
const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const MAX_ABOUT_LENGTH = 500;
// شارة الخبرة لمسار تخصصي (العام ليس تخصصًا)
// (دالة حتى تدخل المسارات الجديدة اللي ضافها الأدمن)
const getExpertFields = () => COMMUNITIES.filter((community) => community.id !== GENERAL_ID);

/**
 * نموذج طلب شارة: النوع، المسار (لشارة الخبرة)، التعريف بالخبرة، وملف إثبات.
 * hasOrPending(badge): هل أملكها أو طلبها قيد المراجعة؟  •  onApply(request): إرسال الطلب
 */
function BadgeRequestForm({ hasOrPending, onApply }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  const expertFields = getExpertFields();
  const [type, setType] = useState("expert");
  const [communityId, setCommunityId] = useState(expertFields[0].id);
  const [about, setAbout] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);
  const [isSent, setIsSent] = useState(false);

  const badge = type === "expert" ? { type, communityId } : { type };
  const isTaken = hasOrPending(badge);

  function handleFile(event) {
    const chosen = event.target.files[0];
    event.target.value = "";
    if (!chosen) return;

    if (!chosen.type.startsWith("image/") && chosen.type !== "application/pdf") {
      setError(t("community.badges.form.errors.type"));
      return;
    }
    if (chosen.size > MAX_PROOF_SIZE) {
      setError(t("community.badges.form.errors.size"));
      return;
    }

    setProof(chosen);
    setError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isTaken) return;
    if (about.trim().length < MIN_ABOUT_LENGTH) {
      setError(t("community.badges.form.errors.about", { min: MIN_ABOUT_LENGTH }));
      return;
    }
    if (!proof) {
      setError(t("community.badges.form.errors.proof"));
      return;
    }

    // الملف بيتحفظ بالمتصفح حتى يفتحه الأدمن (لاحقًا: بيترفع للسيرفر)
    onApply({ ...badge, about: about.trim(), proof });
    setAbout("");
    setProof(null);
    setError(null);
    setIsSent(true);
  }

  return (
    <form className="badge-form" noValidate onSubmit={handleSubmit}>
      <h2 className="badge-form__title">{t("community.badges.form.title")}</h2>

      {/* نوع الشارة */}
      <div className="badge-form__types" role="radiogroup" aria-label={t("community.badges.form.type")}>
        {BADGE_TYPES.map((item) => (
          <label key={item} className={`badge-type badge-type--${item} ${type === item ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="badge-type"
              value={item}
              checked={type === item}
              onChange={() => {
                setType(item);
                setIsSent(false);
              }}
            />
            <UserBadge badge={{ type: item, communityId }} size={22} />
            <span>{t(`community.badges.${item}.title`)}</span>
          </label>
        ))}
      </div>

      {type === "expert" && (
        <label className="upload-form__field">
          <span>{t("community.badges.form.field")}</span>
          <select
            className="badge-form__select"
            value={communityId}
            onChange={(event) => {
              setCommunityId(event.target.value);
              setIsSent(false);
            }}
          >
            {expertFields.map((community) => (
              <option key={community.id} value={community.id}>
                {localName(community, language)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="upload-form__field">
        <span>
          {t("community.badges.form.about")}
          <span className={`upload-form__count ${about.trim().length >= MIN_ABOUT_LENGTH ? "is-enough" : ""}`}>
            {about.length}/{MAX_ABOUT_LENGTH}
          </span>
        </span>
        <textarea
          className="badge-form__about"
          rows={4}
          dir="auto"
          value={about}
          maxLength={MAX_ABOUT_LENGTH}
          placeholder={t(`community.badges.form.aboutPlaceholder.${type}`)}
          onChange={(event) => setAbout(event.target.value)}
        />
      </label>

      {/* label يفتح اختيار الملف عند الضغط عليه */}
      <label className={`upload-form__file ${proof ? "has-file" : ""}`}>
        <Icon name={proof ? "check" : "upload"} size={22} />
        <span>
          <strong dir="auto">{proof ? proof.name : t("community.badges.form.proof")}</strong>
          <span>
            {proof ? `${(proof.size / 1024 / 1024).toFixed(1)} MB` : t(`community.badges.form.proofHint.${type}`)}
          </span>
        </span>
        <input type="file" accept="image/*,application/pdf" hidden onChange={handleFile} />
      </label>

      {error && (
        <p className="upload-form__error" role="alert">
          {error}
        </p>
      )}
      {isTaken && !isSent && <p className="badge-form__taken">{t("community.badges.form.taken")}</p>}
      {isSent && !error && (
        <p className="badge-form__sent" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {t("community.badges.form.sent")}
        </p>
      )}

      <button type="submit" className="badge-form__submit" disabled={isTaken}>
        {t("community.badges.form.submit")}
      </button>
    </form>
  );
}

/**
 * الشارات: /community/badges
 * شرح الشارتين، شاراتي (بتفتح صفحة خبراتي)، تقديم طلب، وحالة طلباتي.
 * الأدمن بيقرر من لوحة التحكم، والقرار بيوصل كإشعار.
 */
function Badges() {
  const { t, i18n } = useTranslation();
  const { badges, me } = useOutletContext();
  const language = i18n.resolvedLanguage;

  // اسم الشارة: "خبرة في Front-End" أو "قيمة علمية"
  function badgeName(request) {
    if (request.type === "scholar") return t("community.badges.scholar.title");
    const community = findCommunity(request.communityId);
    return t("community.badges.expert.in", { field: community ? localName(community, language) : "" });
  }

  return (
    <>
      <StudyHeader title={t("community.nav.badges")} />

      <div className="badges-page">
        <p className="badges-page__intro">{t("community.badges.intro")}</p>

        {/* الشارتان */}
        <div className="badges-explain">
          {BADGE_TYPES.map((type) => (
            <article key={type} className={`badge-card badge-card--${type}`}>
              <UserBadge badge={{ type, communityId: "frontend" }} size={34} />
              <h2>{t(`community.badges.${type}.title`)}</h2>
              <p>{t(`community.badges.${type}.text`)}</p>
              <ul>
                {t(`community.badges.${type}.perks`, { returnObjects: true }).map((perk) => (
                  <li key={perk}>
                    <Icon name="check" size={14} strokeWidth={2.5} />
                    {perk}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="community-disclaimer">
          <Icon name="shield" size={16} />
          {t("community.disclaimer")}
        </p>

        {/* شاراتي: كل وحدة بتفتح صفحة خبراتي عندها */}
        {badges.myBadges.length > 0 && (
          <section className="badges-mine">
            <h2>{t("community.badges.mine")}</h2>
            <div className="badges-mine__list">
              {badges.myBadges.map((badge) => (
                <Link
                  key={`${badge.type}-${badge.communityId ?? ""}`}
                  to={experiencePath(me.handle, badge)}
                  className="badges-mine__item"
                >
                  <UserBadge badge={badge} size={20} />
                  {badgeName(badge)}
                </Link>
              ))}
            </div>
          </section>
        )}

        <BadgeRequestForm hasOrPending={badges.hasOrPending} onApply={badges.apply} />

        {/* طلباتي */}
        {badges.requests.length > 0 && (
          <section className="badges-requests">
            <h2>{t("community.badges.requests")}</h2>
            <ul>
              {badges.requests.map((request) => (
                <li key={request.id} className={`badge-request is-${request.status}`}>
                  <UserBadge badge={request} size={22} />
                  <span className="badge-request__text">
                    <strong>{badgeName(request)}</strong>
                    <span>
                      {formatTimeAgo(request.createdAt, language)}
                      {request.status === "rejected" && ` · ${t(`community.badges.reasons.${request.reason}`)}`}
                    </span>
                  </span>
                  <span className="badge-request__status">{t(`community.badges.status.${request.status}`)}</span>
                  {request.status !== "approved" && (
                    <button
                      type="button"
                      className="badge-request__remove"
                      aria-label={t("community.badges.remove")}
                      title={t("community.badges.remove")}
                      onClick={() => badges.remove(request.id)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

export default Badges;