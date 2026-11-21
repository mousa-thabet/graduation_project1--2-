import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext } from "react-router";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import PostCard from "../Posts/PostCard/PostCard.jsx";
import StreamCard from "../Streams/StreamCard/StreamCard.jsx";
import { formatTimeAgo } from "../../../utils/format.js";
import "./History.css";

const TABS = ["saved", "liked", "comments", "streams"];

// أيقونة كل تبويب عندما يكون فارغًا
const EMPTY_ICONS = { saved: "bookmark", liked: "heart", comments: "comment", streams: "film" };

/**
 * صفحة السجل: المنشورات المحفوظة، والتي أعجبتني، وتعليقاتي، والبثوث المسجّلة التي أعجبتني.
 */
function History() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { feed, streams } = useOutletContext();
  const [tab, setTab] = useState("saved");

  const savedPosts = feed.posts.filter((post) => post.isSaved);
  const likedPosts = feed.posts.filter((post) => post.isLiked);

  // تعليقاتي من كل المنشورات، الأحدث أولًا
  const myComments = feed.posts
    .flatMap((post) => post.comments.filter((comment) => comment.isMine).map((comment) => ({ comment, post })))
    .sort((a, b) => b.comment.createdAt - a.comment.createdAt);

  const likedRecordings = streams.recordings.filter((recording) => recording.isLiked);

  const counts = {
    saved: savedPosts.length,
    liked: likedPosts.length,
    comments: myComments.length,
    streams: likedRecordings.length,
  };
  const tabPosts = tab === "saved" ? savedPosts : likedPosts;

  function handleTagClick(tag) {
    navigate(`/study/search?q=${encodeURIComponent(`#${tag}`)}`);
  }

  return (
    <>
      <StudyHeader title={t("studyApp.nav.history")}>
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
              {t(`studyApp.history.${item}`)} ({counts[item]})
            </button>
          ))}
        </div>
      </StudyHeader>

      {counts[tab] === 0 && (
        <EmptyState
          icon={EMPTY_ICONS[tab]}
          title={t(`studyApp.history.empty.${tab}`)}
          text={t(`studyApp.history.emptyText.${tab}`)}
        />
      )}

      {/* المحفوظات والإعجابات */}
      {(tab === "saved" || tab === "liked") &&
        tabPosts.map((post) => <PostCard key={post.id} post={post} actions={feed} onTagClick={handleTagClick} />)}

      {/* تعليقاتي: كل تعليق يفتح منشوره */}
      {tab === "comments" && (
        <ul className="history-comments">
          {myComments.map(({ comment, post }) => (
            <li key={comment.id}>
              <Link to={`/study/post/${post.id}`} className="history-comment">
                <span className="history-comment__meta">
                  {t("studyApp.history.commentOn", { name: post.author.name })} ·{" "}
                  {formatTimeAgo(comment.createdAt, i18n.resolvedLanguage)}
                </span>
                <p className="history-comment__text">{comment.text}</p>
                {post.text && <p className="history-comment__post">{post.text}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* البثوث المسجّلة التي أعجبتني */}
      {tab === "streams" && counts.streams > 0 && (
        <div className="stream-grid">
          {likedRecordings.map((recording) => (
            <StreamCard key={recording.id} stream={recording} isLive={false} />
          ))}
        </div>
      )}
    </>
  );
}

export default History;