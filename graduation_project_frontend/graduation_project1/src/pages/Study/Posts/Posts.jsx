import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router";

import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import Composer from "./Composer/Composer.jsx";
import PostCard from "./PostCard/PostCard.jsx";

import { getPeople } from "../../../utils/feed.js";

import "./Posts.css";

const TABS = ["forYou", "following"];

function Posts() {
  const { t } = useTranslation();

  const {
    following,
    feed,
    profile,
    drafts,
  } = useOutletContext();

  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState("forYou");
  const [tag, setTag] = useState(null);

  const [draft, setDraft] = useState(
    location.state?.draft ?? null
  );

  const [toast, setToast] = useState(null);
  const composerRef = useRef(null);

  useEffect(() => {
    if (!location.state?.compose) return;

    const textarea = composerRef.current;

    textarea.focus();
    textarea.setSelectionRange(
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

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(
      () => setToast(null),
      2200
    );

    return () => clearTimeout(timer);
  }, [toast]);

  function handlePost(data) {
    feed.addPost(data);

    if (draft) {
      drafts.deleteDraft(draft.id);
    }

    setDraft(null);
  }

  function handleSaveDraft(data) {
    drafts.saveDraft({
      id: draft?.id,
      ...data,
    });

    setDraft(null);
    setToast(t("studyApp.profile.drafts.saved"));
  }

  const visiblePosts = feed.posts.filter(
    (post) =>
      (tab === "forYou" ||
        following.includes(post.author.id) ||
        post.isMine) &&
      (!tag || post.text?.includes(`#${tag}`))
  );

  return (
    <>
      <StudyHeader title={t("studyApp.nav.posts")}>
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
              {t(`studyApp.feed.${item}`)}
            </button>
          ))}
        </div>
      </StudyHeader>

      <Composer
        key={draft?.id ?? "new"}
        ref={composerRef}
        me={profile.me}
        initialDraft={draft}
        people={getPeople(feed.posts)}
        onPost={handlePost}
        onSaveDraft={handleSaveDraft}
        // "فيديو بث مباشر": صفحة البثوث، وبتفتح نافذة "ابدأ بث" مباشرة
        onLive={() => navigate("/study/streams", { state: { goLive: true } })}
      />

      {tag && (
        <div className="feed-filter">
          <span>
            {t("studyApp.feed.filteredBy")}
          </span>

          <button
            type="button"
            className="feed-filter__chip"
            onClick={() => setTag(null)}
          >
            #{tag}
            <Icon
              name="x"
              size={14}
              strokeWidth={2.5}
            />
          </button>
        </div>
      )}

      {visiblePosts.length > 0 ? (
        <div className="feed">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              actions={feed}
              onTagClick={setTag}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            tab === "following" ? "users" : "home"
          }
          title={t(
            tab === "following"
              ? "studyApp.feed.emptyFollowing"
              : "studyApp.feed.emptyTitle"
          )}
          text={t(
            tab === "following"
              ? "studyApp.feed.emptyFollowingText"
              : "studyApp.feed.emptyText"
          )}
        />
      )}

      {toast && (
        <div className="post-toast" role="status">
          <Icon name="check" size={16} />
          {toast}
        </div>
      )}
    </>
  );
}

export default Posts;