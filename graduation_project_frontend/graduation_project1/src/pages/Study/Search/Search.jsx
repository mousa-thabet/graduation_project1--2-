import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import PostCard from "../Posts/PostCard/PostCard.jsx";
import { SUGGESTED_TAGS } from "../../../data/studyPosts.js";
import { getPeople } from "../../../utils/feed.js";
import "./Search.css";

const TABS = ["posts", "people"];

/**
 * صفحة البحث: /study/search?q=...
 * تبحث في نصوص المنشورات والوسوم وأسماء الأشخاص.
 */
function Search() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFollowing, toggleFollow, feed } = useOutletContext();
  const { posts } = feed;

  const [tab, setTab] = useState("posts");

  const query = searchParams.get("q") ?? "";
  const term = query.trim().toLowerCase();
  const handleTerm = term.replace(/^@/, "");

  const matchingPosts = term
    ? posts.filter(
        (post) =>
          post.text?.toLowerCase().includes(term) ||
          post.author.name.toLowerCase().includes(term) ||
          post.author.handle.toLowerCase().includes(handleTerm)
      )
    : [];

  const matchingPeople = term
    ? getPeople(posts).filter(
        (person) => person.name.toLowerCase().includes(term) || person.handle.toLowerCase().includes(handleTerm)
      )
    : [];

  function search(value) {
    setSearchParams(value.trim() ? { q: value.trim() } : {});
  }

  function handleSubmit(event) {
    event.preventDefault();
    search(new FormData(event.target).get("q"));
  }

  const counts = { posts: matchingPosts.length, people: matchingPeople.length };

  return (
    <>
      <StudyHeader title={t("studyApp.search.title")} backTo="/study">
        {/* key يعيد تعبئة الحقل عند تغيّر البحث من مكان آخر */}
        <form key={query} className="search-box" role="search" onSubmit={handleSubmit}>
          <Icon name="search" size={18} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t("studyApp.aside.search")}
            aria-label={t("studyApp.aside.search")}
            autoFocus={!query}
          />
        </form>

        {term && (
          <div className="study-tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className="study-tabs__tab"
                onClick={() => setTab(item)}
              >
                {t(`studyApp.search.${item}`)} ({counts[item]})
              </button>
            ))}
          </div>
        )}
      </StudyHeader>

      {/* قبل البحث: وسوم مقترحة */}
      {!term && (
        <EmptyState icon="search" title={t("studyApp.search.promptTitle")} text={t("studyApp.search.promptText")}>
          <div className="search-tags">
            {SUGGESTED_TAGS.map((tag) => (
              <button key={tag} type="button" dir="auto" className="search-tag" onClick={() => search(`#${tag}`)}>
                #{tag}
              </button>
            ))}
          </div>
        </EmptyState>
      )}

      {/* المنشورات */}
      {term && tab === "posts" &&
        (matchingPosts.length > 0 ? (
          matchingPosts.map((post) => (
            <PostCard key={post.id} post={post} actions={feed} onTagClick={(tag) => search(`#${tag}`)} />
          ))
        ) : (
          <EmptyState
            icon="search"
            title={t("studyApp.search.noResults", { query })}
            text={t("studyApp.search.noResultsText")}
          />
        ))}

      {/* الأشخاص */}
      {term && tab === "people" &&
        (matchingPeople.length > 0 ? (
          <ul className="search-people">
            {matchingPeople.map((person) => {
              const followed = isFollowing(person.id);

              return (
                <li key={person.id} className="aside-person">
                  <span className="aside-person__avatar" aria-hidden="true">
                    {person.name.charAt(0)}
                  </span>
                  <span className="aside-person__text">
                    <span className="aside-person__name">{person.name}</span>
                    <span className="aside-person__handle" dir="ltr">
                      @{person.handle}
                    </span>
                  </span>
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
        ) : (
          <EmptyState
            icon="users"
            title={t("studyApp.search.noResults", { query })}
            text={t("studyApp.search.noResultsText")}
          />
        ))}

      {term && (
        <button type="button" className="search-clear" onClick={() => navigate("/study/search")}>
          {t("studyApp.search.clear")}
        </button>
      )}
    </>
  );
}

export default Search;