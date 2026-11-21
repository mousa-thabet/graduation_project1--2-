import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import Highlight from "../../../components/Highlight/Highlight.jsx";
import { communityPath, localName } from "../../../data/communities.js";
import { communityProfilePath } from "../../../data/communityPeople.js";
import { getCommunityPeople, searchCommunity, searchPath } from "../../../utils/communitySearch.js";
import "./SearchBox.css";

// أقصى عدد اقتراحات من كل نوع
const LIMITS = { communities: 2, people: 2, posts: 4 };

/**
 * مربع البحث مع اقتراحات فورية أثناء الكتابة (مثل يوتيوب):
 * قبل الكتابة: عمليات البحث الأخيرة  •  أثناء الكتابة: أقرب المجتمعات والأشخاص والمنشورات
 * الأسهم تتنقل بين الاقتراحات، Enter يفتح المختار (أو صفحة النتائج)، Esc يغلق.
 * posts: المنشورات  •  recentSearches: من useRecentSearches
 */
function SearchBox({ posts, recentSearches }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const listId = useId();
  const language = i18n.resolvedLanguage;

  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim();
  const items = query ? getSuggestions() : getRecent();

  // الاقتراحات: { key, kind, icon, color, label, sub, to }
  function getSuggestions() {
    const results = searchCommunity(query, { posts, people: getCommunityPeople(posts) });
    const places = results.communities.slice(0, LIMITS.communities).map(({ community, branch }) => ({
      key: `c-${community.id}-${branch?.id ?? ""}`,
      kind: "community",
      icon: community.id,
      color: community.color,
      label: localName(branch ?? community, language),
      sub: branch ? localName(community, language) : t("community.search.community"),
      to: communityPath(community.id, branch?.id),
    }));
    const people = results.people.slice(0, LIMITS.people).map((person) => ({
      key: `p-${person.id}`,
      kind: "person",
      icon: "user",
      label: person.name,
      sub: `@${person.handle}`,
      to: communityProfilePath(person.handle),
    }));
    const postItems = results.ranked
      .slice(0, LIMITS.posts)
      .map((post) => ({
        key: `post-${post.id}`,
        kind: post.type === "question" ? "question" : "post",
        icon: post.type === "question" ? "question" : "comment",
        label: post.text ?? "",
        sub: post.author.name,
        to: `/community/post/${post.id}`,
      }));

    return [...places, ...people, ...postItems];
  }

  // عمليات البحث الأخيرة
  function getRecent() {
    return recentSearches.searches.map((search) => ({
      key: `r-${search}`,
      kind: "recent",
      icon: "history",
      label: search,
      to: searchPath(search),
    }));
  }

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function open(item) {
    recentSearches.add(item.kind === "recent" ? item.label : query);
    navigate(item.to);
    setValue("");
    close();
  }

  // Enter بدون اختيار: صفحة كل النتائج
  function searchAll() {
    if (!query) return;

    recentSearches.add(query);
    navigate(searchPath(query));
    setValue("");
    close();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (items.length === 0 ? -1 : (index + step + items.length) % items.length));
    } else if (event.key === "Escape") {
      close();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) open(items[activeIndex]);
    else searchAll();
  }

  const showList = isOpen && items.length > 0;

  return (
    <div className="search-box-live">
      <form className="study-aside__search" role="search" onSubmit={handleSubmit}>
        <Icon name="search" size={18} />
        <input
          type="search"
          value={value}
          placeholder={t("community.search.placeholder")}
          aria-label={t("community.search.placeholder")}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={close}
          onKeyDown={handleKeyDown}
        />
      </form>

      {showList && (
        // onMouseDown: حتى لا يُغلق القائمةَ خروجُ المؤشر من مربع البحث قبل الضغط
        <ul id={listId} className="search-box-live__list" role="listbox" onMouseDown={(event) => event.preventDefault()}>
          {!query && (
            <li className="search-box-live__head" role="presentation">
              <span>{t("community.search.recent")}</span>
              <button type="button" onClick={recentSearches.clear}>
                {t("community.search.clearRecent")}
              </button>
            </li>
          )}

          {items.map((item, index) => (
            <li
              key={item.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`search-box-live__item ${index === activeIndex ? "is-active" : ""}`}
              style={item.color ? { "--track": item.color } : undefined}
              onClick={() => open(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className={`search-box-live__icon search-box-live__icon--${item.kind}`}>
                {item.kind === "person" || item.kind === "recent" ? (
                  <Icon name={item.icon} size={16} />
                ) : (
                  <CommunityIcon name={item.kind === "post" ? "hash" : item.icon} size={16} />
                )}
              </span>
              <span className="search-box-live__text">
                <span className="search-box-live__label" dir="auto">
                  <Highlight text={item.label} query={query} />
                </span>
                {item.sub && (
                  <span className="search-box-live__sub" dir="auto">
                    {item.sub}
                  </span>
                )}
              </span>
            </li>
          ))}

          {query && (
            <li className="search-box-live__all" role="presentation">
              <button type="button" onClick={searchAll}>
                <Icon name="search" size={14} />
                {t("community.search.seeAll", { query })}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default SearchBox;