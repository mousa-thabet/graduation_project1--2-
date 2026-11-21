import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import SearchBox from "../SearchBox/SearchBox.jsx";
import { communityPath, localName } from "../../../data/communities.js";
import { communityProfilePath } from "../../../data/communityPeople.js";
import { getBadgeHolders, getTopTags, searchPath } from "../../../utils/communitySearch.js";
import { whatsappUrl } from "../../../data/contact.js";
import "../../StudyLayout/StudyAside/StudyAside.css";
import "./CommunityAside.css";

/**
 * العمود الجانبي للتواصل: البحث الفوري، مجتمعاتي، الأدوات الرائجة، وأصحاب الشارات.
 * posts: المنشورات  •  memberships: من useMemberships  •  recentSearches: من useRecentSearches
 */
function CommunityAside({ posts, memberships, recentSearches, label, isFollowing, toggleFollow }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const language = i18n.resolvedLanguage;

  const topTags = getTopTags(posts, 5);
  const badgeHolders = getBadgeHolders(posts).slice(0, 4);

  return (
    <aside className="study-aside community-aside" aria-label={label}>
      {/* البحث (مخفي في صفحة البحث نفسها) */}
      {pathname !== "/community/search" && <SearchBox posts={posts} recentSearches={recentSearches} />}

      {/* مجتمعاتي */}
      <section className="aside-card">
        <h2 className="aside-card__title">{t("community.aside.myCommunities")}</h2>

        <ul className="aside-card__list">
          {memberships.myCommunities.map((community) => (
            <li key={community.id}>
              <Link
                to={communityPath(community.id)}
                className="aside-community"
                style={{ "--track": community.color }}
              >
                <span className="aside-community__icon">
                  <CommunityIcon name={community.id} size={18} />
                </span>
                <span className="aside-community__name">{localName(community, language)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link to="/community/explore" className="aside-card__more">
          {t("community.aside.manage")}
        </Link>
      </section>

      {/* الأدوات الرائجة: من وسوم المنشورات */}
      {topTags.length > 0 && (
        <section className="aside-card">
          <h2 className="aside-card__title">{t("community.aside.trending")}</h2>

          <div className="aside-tools">
            {topTags.map(({ tag, count }) => (
              <Link key={tag} to={searchPath(`#${tag}`)} className="aside-tool" dir="ltr">
                #{tag}
                <span>{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* أصحاب الشارات */}
      {badgeHolders.length > 0 && (
        <section className="aside-card">
          <h2 className="aside-card__title">{t("community.aside.experts")}</h2>

          <ul className="aside-card__list">
            {badgeHolders.map((person) => {
              const followed = isFollowing(person.id);

              return (
                <li key={person.id} className="aside-person">
                  <Link to={communityProfilePath(person.handle)} className="aside-person__link">
                    <span className="aside-person__avatar" aria-hidden="true">
                      <Avatar person={person} />
                    </span>
                    <span className="aside-person__text">
                      <span className="aside-person__name">
                        <bdi>{person.name}</bdi> <UserBadges badges={person.badges} size={14} />
                      </span>
                      <span className="aside-person__handle" dir="ltr">
                        @{person.handle}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={`aside-person__follow ${followed ? "is-following" : ""}`}
                    aria-pressed={followed}
                    onClick={() => toggleFollow(person.id)}
                  >
                    {followed ? t("studyApp.aside.following") : t("studyApp.aside.follow")}
                  </button>
                </li>
              );
            })}
          </ul>

          <Link to="/community/badges" className="aside-card__more">
            {t("community.aside.aboutBadges")}
          </Link>
        </section>
      )}

      {/* روابط صغيرة بدل ذيل الصفحة */}
      <nav className="study-aside__links" aria-label={t("footer.platform")}>
        <Link to="/about">{t("studyApp.aside.about")}</Link>
        <Link to="/privacy">{t("studyApp.aside.privacy")}</Link>
        <a href={whatsappUrl(t("info.whatsappMessage"))} target="_blank" rel="noopener noreferrer">
          {t("studyApp.aside.support")}
        </a>
        <span>© {new Date().getFullYear()} AreaTk</span>
      </nav>
    </aside>
  );
}

export default CommunityAside;