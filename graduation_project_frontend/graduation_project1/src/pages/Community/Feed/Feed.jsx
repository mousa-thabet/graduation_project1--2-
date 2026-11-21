import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router";

import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import CommunityComposer from "../CommunityComposer/CommunityComposer.jsx";
import PostList, {
  TypeTabs,
} from "../PostList/PostList.jsx";

import { filterByType } from "../PostList/postFilters.js";

function Feed() {
  const { t } = useTranslation();
  const { feed, memberships, me } = useOutletContext();

  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState("all");
  const [draft, setDraft] = useState(
    location.state?.draft ?? null
  );

  const composerRef = useRef(null);

  useEffect(() => {
    if (!location.state?.compose) return;

    const textarea = composerRef.current;

    textarea?.focus();
    textarea?.setSelectionRange(
      textarea.value.length,
      textarea.value.length
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    navigate(".", {
      replace: true,
      state: null,
    });
  }, [location.state, navigate]);

  const visiblePosts = filterByType(
    feed.posts.filter(memberships.isInFeed),
    tab
  );

  return (
    <>
      <StudyHeader title={t("community.nav.home")}>
        <TypeTabs
          value={tab}
          onChange={setTab}
        />
      </StudyHeader>

      <CommunityComposer
        key={draft?.id ?? "new"}
        feed={feed}
        me={me}
        composerRef={composerRef}
        myCommunities={memberships.myCommunities}
        draft={draft}
        onDraftDone={() => setDraft(null)}
      />

      <PostList
        posts={visiblePosts}
        actions={feed}
        empty={{
          icon: "home",
          title: t("community.feed.emptyTitle"),
          text: t("community.feed.emptyText"),
        }}
      />
    </>
  );
}

export default Feed;