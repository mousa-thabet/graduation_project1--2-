import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import UserBadge from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { findCommunity, localName } from "../../../data/communities.js";
import { CURRENT_USER } from "../../../data/currentUser.js";
import { communityProfilePath, findCommunityPerson } from "../../../data/communityPeople.js";
import {
  PEOPLE_EXPERIENCE,
  badgeKey,
  proofTypeOf,
} from "../../../data/badges.js";
import { formatTimeAgo } from "../../../utils/format.js";
import "../../Study/Search/Search.css";
import "./Experience.css";

/**
 * بطاقة خبرة وحدة: الدرع، اسم الشارة، الشهادة أو المسمى، تعريفه بخبرته،
 * نوع الإثبات ووقت تحقق الإدارة، وشو بتسمحله الشارة.
 * experience: { credential, details, proof, verifiedAt } (أو null إذا ما في تفاصيل)
 */
function ExperienceCard({ badge, experience, isTarget }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const community = findCommunity(badge.communityId);

  const title =
    badge.type === "scholar"
      ? t("community.badges.scholar.title")
      : t("community.badges.expert.in", { field: community ? localName(community, language) : "" });

  return (
    <article
      id={badgeKey(badge).replace(":", "-")}
      className={`experience-card experience-card--${badge.type} ${isTarget ? "is-target" : ""}`}
    >
      <header className="experience-card__head">
        <span className="experience-card__shield">
          <UserBadge badge={badge} size={34} />
        </span>
        <div>
          <h2 className="experience-card__title">{title}</h2>
          <p className="experience-card__type">{t(`community.badges.${badge.type}.text`)}</p>
        </div>
      </header>

      {/* اللي كتبه صاحب الخبرة (ما بينترجم) */}
      {experience?.credential && (
        <p className="experience-card__credential" dir="auto">
          <Icon name="graduation" size={16} />
          {experience.credential}
        </p>
      )}
      {experience?.details && (
        <p className="experience-card__details" dir="auto">
          {experience.details}
        </p>
      )}

      {/* التحقق: وقته ونوع الإثبات (الملف نفسه ما بينعرض للناس) */}
      {experience && (
        <ul className="experience-card__meta">
          <li>
            <Icon name="verified" size={15} />
            {t("community.experience.verifiedAt", { time: formatTimeAgo(experience.verifiedAt, language) })}
          </li>
          <li>
            <Icon name="lock" size={15} />
            {t("community.experience.proof", { type: t(`community.experience.proofTypes.${experience.proof}`) })}
          </li>
        </ul>
      )}

      <h3 className="experience-card__subtitle">{t("community.experience.allows")}</h3>
      <ul className="experience-card__allows">
        {t(`community.experience.allowsList.${badge.type}`, { returnObjects: true }).map((item) => (
          <li key={item}>
            <Icon name="check" size={14} strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

/**
 * صفحة الخبرات: /community/profile/:handle/experience
 * بتفتح لما تضغط على الدرع الأزرق أو الأخضر جنب اسم أي حدا، وبتعرض الخبرات اللي تحققت منها الإدارة.
 * #scholar أو #expert-ai بآخر الرابط: بتنزل للشارة اللي ضغطت عليها وبتضوّيها.
 */
function Experience() {
  const { t } = useTranslation();
  const { handle } = useParams();
  const { hash } = useLocation();
  const { me, badges, communityProfile } = useOutletContext();

  const isMe = handle === CURRENT_USER.handle;
  const person = isMe ? { ...me, headline: communityProfile.profile.headline } : findCommunityPerson(handle);
  const targetId = hash.slice(1);

  // النزول للشارة اللي ضغطنا عليها
  useEffect(() => {
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetId]);

  if (!person) {
    return (
      <>
        <StudyHeader title={t("community.experience.title")} backTo="/community" />
        <EmptyState icon="userX" title={t("studyApp.profile.notFound")} text={t("studyApp.profile.notFoundText")} />
      </>
    );
  }

  const profilePath = isMe ? "/community/profile" : communityProfilePath(person.handle);

  // تفاصيل كل شارة: التجريبية للأشخاص الثانيين، ولحسابي من طلبي اللي وافقت عليه الإدارة
  function experienceOf(badge) {
    const key = badgeKey(badge);
    if (!isMe) return PEOPLE_EXPERIENCE[person.id]?.[key] ?? null;

    const request = badges.approvedRequestFor(badge);
    return request
      ? { credential: null, details: request.about, proof: proofTypeOf(request.proofName), verifiedAt: request.reviewedAt }
      : null;
  }

  // الأخضر أولًا
  const sorted = [...person.badges].sort((a, b) => (a.type === "scholar" ? -1 : b.type === "scholar" ? 1 : 0));

  return (
    <>
      <StudyHeader title={t("community.experience.title")} backTo={profilePath} />

      <div className="experience-page">
        {/* صاحب الخبرات */}
        <Link to={profilePath} className="experience-person">
          <span className="experience-person__avatar" aria-hidden="true">
            <Avatar person={person} />
          </span>
          <span className="experience-person__text">
            <strong dir="auto">{person.name}</strong>
            <span dir="ltr">@{person.handle}</span>
            {person.headline && <span dir="auto">{person.headline}</span>}
          </span>
        </Link>

        {sorted.length === 0 ? (
          <EmptyState
            icon="shield"
            title={t(isMe ? "community.experience.emptyMine" : "community.experience.empty")}
            text={t(isMe ? "community.experience.emptyMineText" : "community.experience.emptyText")}
          >
            {isMe && (
              <Link to="/community/badges" className="search-clear">
                {t("community.experience.apply")}
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <p className="experience-page__intro">
              {t(isMe ? "community.experience.introMine" : "community.experience.intro")}
            </p>

            {sorted.map((badge) => (
              <ExperienceCard
                key={badgeKey(badge)}
                badge={badge}
                experience={experienceOf(badge)}
                isTarget={badgeKey(badge).replace(":", "-") === targetId}
              />
            ))}

            {isMe && (
              <Link to="/community/badges" className="experience-page__apply">
                <Icon name="plus" size={16} strokeWidth={2.5} />
                {t("community.experience.apply")}
              </Link>
            )}

            <p className="community-disclaimer">
              <Icon name="shield" size={16} />
              {t("community.disclaimer")}
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default Experience;