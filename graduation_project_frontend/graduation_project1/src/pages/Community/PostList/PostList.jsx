import { useTranslation } from "react-i18next";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import CommunityPostCard from "../CommunityPostCard/CommunityPostCard.jsx";
import { TYPE_TABS } from "./postFilters.js";

/**
 * تبويبات "الكل / منشورات / أسئلة" داخل رأس الصفحة.
 * tabs: أسماء التبويبات (تُترجم من community.tabs)
 */
export function TypeTabs({ value, onChange, tabs = TYPE_TABS }) {
  const { t } = useTranslation();

  return (
    <div className="study-tabs" role="tablist">
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={value === item}
          className="study-tabs__tab"
          onClick={() => onChange(item)}
        >
          {t(`community.tabs.${item}`)}
        </button>
      ))}
    </div>
  );
}

/**
 * قائمة منشورات التواصل، أو رسالة إن كانت فارغة.
 * empty: { icon, title, text } لرسالة القائمة الفارغة
 */
function PostList({ posts, actions, empty }) {
  if (posts.length === 0) return <EmptyState {...empty} />;

  return (
    <div className="feed">
      {posts.map((post) => (
        <CommunityPostCard key={post.id} post={post} actions={actions} />
      ))}
    </div>
  );
}

export default PostList;