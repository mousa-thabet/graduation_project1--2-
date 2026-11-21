import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import Highlight from "../../../components/Highlight/Highlight.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import JoinButton from "../JoinButton/JoinButton.jsx";
import BranchPicker, { CommunityJoinButton } from "../BranchPicker/BranchPicker.jsx";
import { communityPath, findBranch, findCommunity, localName } from "../../../data/communities.js";
import { communityProfilePath } from "../../../data/communityPeople.js";
import { SEARCH_FILTERS, getCommunityPeople, getTopTags, searchCommunity } from "../../../utils/communitySearch.js";
import { formatCount, formatTimeAgo } from "../../../utils/format.js";
// شكل مربع البحث والوسوم من صفحة بحث ادرس معي
import "../../Study/Search/Search.css";
import "./CommunitySearch.css";

// في تبويب "الكل": كم نتيجة نعرض من المجتمعات والأشخاص قبل "عرض الكل"
const PREVIEW = 3;

/**
 * نتيجة منشور أو سؤال: النوع، المكان، النص مع تلوين الكلمات المطابقة، والكاتب.
 * onOpen: عند فتح النتيجة (لحفظ البحث في الأخيرة)
 */
function PostResult({ post, query, onOpen }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const community = findCommunity(post.communityId);
  const branch = findBranch(post.communityId, post.branchId);
  const isQuestion = post.type === "question";

  return (
    <Link
      to={`/community/post/${post.id}`}
      className="search-result"
      style={{ "--track": community?.color }}
      onClick={onOpen}
    >
      <span className="search-result__meta">
        <span className={`search-result__type ${isQuestion ? "is-question" : ""}`}>
          <CommunityIcon name={isQuestion ? "question" : "hash"} size={13} strokeWidth={2.5} />
          {t(`community.types.${isQuestion ? "question" : "post"}`)}
        </span>
        {community && (
          <span className="search-result__place">
            <span className="search-result__dot" aria-hidden="true" />
            {localName(community, language)}
            {branch && ` › ${localName(branch, language)}`}
          </span>
        )}
      </span>

      <span className="search-result__text" dir="auto">
        <Highlight text={post.text ?? ""} query={query} />
      </span>

      {post.tags?.length > 0 && (
        <span className="search-result__tags">
          {post.tags.map((tag) => (
            <span key={tag} dir="ltr">
              #<Highlight text={tag} query={query} />
            </span>
          ))}
        </span>
      )}

      <span className="search-result__foot">
        <bdi>
          <Highlight text={post.author.name} query={query} />
        </bdi>
        <UserBadges badges={post.author.badges} size={13} />
        <span>· {formatTimeAgo(post.createdAt, language)}</span>
        <span className="search-result__counts">
          <Icon name="heart" size={13} /> {formatCount(post.likes, language)}
          <Icon name="comment" size={13} /> {formatCount(post.comments.length, language)}
        </span>
      </span>
    </Link>
  );
}

/**
 * البحث: /community/search?q=...&type=...
 * النتائج تتحدث مع كل حرف (مثل يوتيوب وواتساب) ومرتبة من الأقرب للأبعد،
 * والكلمات المطابقة ملوّنة. قبل الكتابة: عمليات البحث الأخيرة والأدوات الرائجة.
 */
function CommunitySearch() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const [searchParams, setSearchParams] = useSearchParams();
  const { feed, memberships, recentSearches, isFollowing, toggleFollow } = useOutletContext();
  // نافذة فروع المجتمع (لما تنضم لمجتمع من النتائج)
  const [picking, setPicking] = useState(null);

  const query = searchParams.get("q") ?? "";
  const filter = SEARCH_FILTERS.includes(searchParams.get("type")) ? searchParams.get("type") : "all";
  const term = query.trim();

  const results = term
    ? searchCommunity(term, { posts: feed.posts, people: getCommunityPeople(feed.posts) })
    : { ranked: [], questions: [], posts: [], people: [], communities: [] };
  const counts = {
    all: results.questions.length + results.posts.length + results.people.length + results.communities.length,
    questions: results.questions.length,
    posts: results.posts.length,
    people: results.people.length,
    communities: results.communities.length,
  };

  // تحديث الرابط مع كل حرف (replace حتى لا يمتلئ سجل المتصفح)
  function update(values) {
    const next = { q: query, type: filter, ...values };
    const params = {};
    if (next.q) params.q = next.q;
    if (next.type !== "all") params.type = next.type;
    setSearchParams(params, { replace: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    recentSearches.add(term);
  }

  // فتح نتيجة يحفظ البحث في الأخيرة
  const rememberSearch = () => recentSearches.add(term);

  const showPosts = filter === "all" || filter === "posts" || filter === "questions";
  // في "الكل": المنشورات والأسئلة معًا بترتيب القرب
  const postsToShow = filter === "questions" ? results.questions : filter === "posts" ? results.posts : results.ranked;
  const peopleToShow = filter === "all" ? results.people.slice(0, PREVIEW) : results.people;
  const placesToShow = filter === "all" ? results.communities.slice(0, PREVIEW) : results.communities;

  return (
    <>
      <StudyHeader title={t("community.nav.search")} backTo="/community">
        <form className="search-box" role="search" onSubmit={handleSubmit}>
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            placeholder={t("community.search.placeholder")}
            aria-label={t("community.search.placeholder")}
            autoFocus={!query}
            onChange={(event) => update({ q: event.target.value })}
          />
        </form>

        {/* الفلاتر مع عدد النتائج */}
        <div className="search-filters" role="tablist">
          {SEARCH_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className="search-filters__chip"
              onClick={() => update({ type: item })}
            >
              {t(`community.search.filters.${item}`)}
              {term && <span>{counts[item]}</span>}
            </button>
          ))}
        </div>
      </StudyHeader>

      {/* قبل الكتابة: عمليات البحث الأخيرة والأدوات الرائجة */}
      {!term && (
        <div className="search-start">
          {recentSearches.searches.length > 0 && (
            <section className="search-start__section">
              <header className="search-start__head">
                <h2>{t("community.search.recent")}</h2>
                <button type="button" onClick={recentSearches.clear}>
                  {t("community.search.clearRecent")}
                </button>
              </header>
              <ul className="search-recent">
                {recentSearches.searches.map((search) => (
                  <li key={search}>
                    <button type="button" className="search-recent__item" onClick={() => update({ q: search })}>
                      <Icon name="history" size={16} />
                      <span dir="auto">{search}</span>
                    </button>
                    <button
                      type="button"
                      className="search-recent__remove"
                      aria-label={t("community.search.removeRecent", { query: search })}
                      onClick={() => recentSearches.remove(search)}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="search-start__section">
            <header className="search-start__head">
              <h2>{t("community.aside.trending")}</h2>
            </header>
            <div className="search-tags search-tags--start">
              {getTopTags(feed.posts, 10).map(({ tag }) => (
                <button key={tag} type="button" dir="ltr" className="search-tag" onClick={() => update({ q: `#${tag}` })}>
                  #{tag}
                </button>
              ))}
            </div>
          </section>

          <p className="search-start__tip">{t("community.search.tip")}</p>
        </div>
      )}

      {term && counts[filter] === 0 && (
        <EmptyState
          icon="search"
          title={t("community.search.noResults", { query: term })}
          text={t("community.search.noResultsText")}
        />
      )}

      {/* المجتمعات والفروع */}
      {term && (filter === "all" || filter === "communities") && placesToShow.length > 0 && (
        <section className="search-group">
          <h2 className="search-group__title">{t("community.search.filters.communities")}</h2>
          <ul>
            {placesToShow.map(({ community, branch }) => {
              const name = localName(branch ?? community, language);
              const isJoined = branch
                ? memberships.isBranchJoined(community.id, branch.id)
                : memberships.isJoined(community.id);

              return (
                <li key={`${community.id}/${branch?.id ?? ""}`} className="search-place" style={{ "--track": community.color }}>
                  <Link to={communityPath(community.id, branch?.id)} className="search-place__link" onClick={rememberSearch}>
                    <span className="search-place__icon">
                      <CommunityIcon name={branch ? "branch" : community.id} size={20} />
                    </span>
                    <span className="search-place__text">
                      <strong>
                        <Highlight text={name} query={term} />
                      </strong>
                      <span>{branch ? localName(community, language) : t("community.search.community")}</span>
                    </span>
                  </Link>
                  {/* فرع: انضمام للفرع نفسه  •  مجتمع: انضمام مع اختيار الفروع */}
                  {branch ? (
                    <JoinButton
                      size="small"
                      isJoined={isJoined}
                      label={isJoined ? t("community.join.leaveNamed", { name }) : t("community.join.joinNamed", { name })}
                      onToggle={() => memberships.toggleBranch(community.id, branch.id)}
                    />
                  ) : (
                    <CommunityJoinButton size="small" community={community} onPick={() => setPicking(community)} />
                  )}
                </li>
              );
            })}
          </ul>
          {picking && <BranchPicker community={picking} onClose={() => setPicking(null)} />}
          {filter === "all" && results.communities.length > PREVIEW && (
            <button type="button" className="search-group__more" onClick={() => update({ type: "communities" })}>
              {t("community.search.showAll", { value: results.communities.length })}
            </button>
          )}
        </section>
      )}

      {/* الأشخاص */}
      {term && (filter === "all" || filter === "people") && peopleToShow.length > 0 && (
        <section className="search-group">
          <h2 className="search-group__title">{t("community.search.filters.people")}</h2>
          <ul>
            {peopleToShow.map((person) => {
              const followed = isFollowing(person.id);

              return (
                <li key={person.id} className="aside-person search-person">
                  <Link to={communityProfilePath(person.handle)} className="aside-person__link" onClick={rememberSearch}>
                    <span className="aside-person__avatar" aria-hidden="true">
                      <Avatar person={person} />
                    </span>
                    <span className="aside-person__text">
                      <span className="aside-person__name">
                        <bdi>
                          <Highlight text={person.name} query={term} />
                        </bdi>{" "}
                        <UserBadges badges={person.badges} size={14} />
                      </span>
                      <span className="aside-person__handle" dir="ltr">
                        @<Highlight text={person.handle} query={term} />
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
          {filter === "all" && results.people.length > PREVIEW && (
            <button type="button" className="search-group__more" onClick={() => update({ type: "people" })}>
              {t("community.search.showAll", { value: results.people.length })}
            </button>
          )}
        </section>
      )}

      {/* المنشورات والأسئلة */}
      {term && showPosts && postsToShow.length > 0 && (
        <section className="search-group">
          {filter === "all" && <h2 className="search-group__title">{t("community.search.postsAndQuestions")}</h2>}
          <ul>
            {postsToShow.map((post) => (
              <li key={post.id}>
                <PostResult post={post} query={term} onOpen={rememberSearch} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default CommunitySearch;