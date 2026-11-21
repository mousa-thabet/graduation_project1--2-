import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import PostList, { TypeTabs } from "../PostList/PostList.jsx";
import { filterByType } from "../PostList/postFilters.js";

/**
 * المحفوظات: /community/saved
 * المنشورات والأسئلة التي حفظتها بزر 🔖
 */
function Saved() {
  const { t } = useTranslation();
  const { feed } = useOutletContext();
  const [tab, setTab] = useState("all");

  const saved = filterByType(
    feed.posts.filter((post) => post.isSaved),
    tab
  );

  return (
    <>
      <StudyHeader title={t("community.nav.saved")}>
        <TypeTabs value={tab} onChange={setTab} />
      </StudyHeader>

      <PostList
        posts={saved}
        actions={feed}
        empty={{ icon: "bookmark", title: t("community.saved.emptyTitle"), text: t("community.saved.emptyText") }}
      />
    </>
  );
}

export default Saved;