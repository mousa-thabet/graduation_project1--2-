import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import { SUGGESTED_PEOPLE, profilePath } from "../../../data/studyPeople.js";
import { getTrendingTags } from "../../../utils/feed.js";
import { whatsappUrl } from "../../../data/contact.js";
import "./StudyAside.css";

const getInitial = (name) => name.trim().charAt(0).toUpperCase();

/**
 * العمود الجانبي: البحث، الوسوم الرائجة، بثوث مباشرة، اقتراحات، وروابط.
 * isFollowing و toggleFollow تأتي من القالب حتى تعرف صفحة المنشورات من تتابع.
 * posts: المنشورات لحساب الوسوم الرائجة، liveRooms: البثوث المباشرة الآن
 */
function StudyAside({ posts, liveRooms, isFollowing, toggleFollow }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const trendingTags = getTrendingTags(posts);

  // البحث يفتح صفحة النتائج
  function handleSearch(event) {
    event.preventDefault();
    const query = new FormData(event.target).get("q").trim();

    if (query) {
      navigate(`/study/search?q=${encodeURIComponent(query)}`);
      event.target.reset();
    }
  }

  return (
    <aside className="study-aside" aria-label={t("studyApp.aside.label")}>
      {/* البحث (مخفي في صفحة البحث نفسها) */}
      {pathname !== "/study/search" && (
        <form className="study-aside__search" role="search" onSubmit={handleSearch}>
          <Icon name="search" size={18} />
          <input
            type="search"
            name="q"
            placeholder={t("studyApp.aside.search")}
            aria-label={t("studyApp.aside.search")}
          />
        </form>
      )}

      {/* الوسوم الرائجة: تُحسب من المنشورات نفسها */}
      {trendingTags.length > 0 && (
        <section className="aside-card">
          <h2 className="aside-card__title">{t("studyApp.aside.trending")}</h2>

          <ol className="aside-card__list">
            {trendingTags.map(({ tag, count }, index) => (
              <li key={tag}>
                <Link to={`/study/search?q=${encodeURIComponent(`#${tag}`)}`} className="aside-trend">
                  <span className="aside-trend__rank">{t("studyApp.aside.trendRank", { rank: index + 1 })}</span>
                  <span className="aside-trend__tag">
                    <bdi>#{tag}</bdi>
                  </span>
                  <span className="aside-trend__count">{t("studyApp.aside.postsCount", { count })}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* بثوث مباشرة الآن (مخفية في صفحة البثوث نفسها) */}
      {liveRooms.length > 0 && !pathname.startsWith("/study/streams") && (
        <section className="aside-card">
          <h2 className="aside-card__title">{t("studyApp.aside.live")}</h2>

          <ul className="aside-card__list">
            {liveRooms.slice(0, 3).map((room) => (
              <li key={room.id}>
                <Link to={`/study/streams/live/${room.id}`} className="aside-live">
                  <span className="aside-live__dot" aria-hidden="true" />
                  <span className="aside-live__text">
                    <span className="aside-live__title" dir="auto">
                      {room.title}
                    </span>
                    <span className="aside-live__meta">
                      <bdi>{room.host.name}</bdi> ·{" "}
                      {t("studyApp.aside.viewers", { count: room.viewers })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link to="/study/streams" className="aside-card__more">
            {t("studyApp.aside.seeAll")}
          </Link>
        </section>
      )}

      {/* اقتراحات للمتابعة */}
      <section className="aside-card">
        <h2 className="aside-card__title">{t("studyApp.aside.suggest")}</h2>

        <ul className="aside-card__list">
          {SUGGESTED_PEOPLE.map((person) => {
            const followed = isFollowing(person.id);

            return (
              <li key={person.id} className="aside-person">
                {/* الصورة والاسم يفتحان حساب الشخص */}
                <Link to={profilePath(person.handle)} className="aside-person__link">
                  <span className="aside-person__avatar" aria-hidden="true">
                    {getInitial(person.name)}
                  </span>
                  <span className="aside-person__text">
                    <span className="aside-person__name">{person.name}</span>
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
      </section>

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

export default StudyAside;