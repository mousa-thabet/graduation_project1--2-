import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import StudyHeader from "../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import PostCard from "../Study/Posts/PostCard/PostCard.jsx";
import StreamCard from "../Study/Streams/StreamCard/StreamCard.jsx";
import ProfileHeader from "./ProfileHeader.jsx";
import EditProfileDialog from "./EditProfileDialog.jsx";
import { CURRENT_USER } from "../../data/currentUser.js";
import { findPersonByHandle } from "../../data/studyPeople.js";
import { getFollowersList, getFollowingList } from "../../utils/people.js";
import { formatTimeAgo } from "../../utils/format.js";
import { useNow } from "../../hooks/useNow.js";
import { useScrollTabs } from "../../hooks/useScrollTabs.js";
import "./Profile.css";

// تبويبات حسابي، وتبويبات حساب أي شخص آخر (الإعجابات والمسودات خاصة بي، مثل X)
const MY_TABS = ["posts", "replies", "media", "likes", "drafts", "streams"];
const OTHER_TABS = ["posts", "replies", "media", "streams"];

// أيقونة كل تبويب عندما يكون فارغًا
const EMPTY_ICONS = {
  posts: "feather",
  replies: "comment",
  media: "image",
  likes: "heart",
  drafts: "draft",
  streams: "radio",
};

/**
 * محتوى صفحة الحساب لشخص واحد.
 * person: صاحب الحساب (أنا أو شخص آخر) بكل معلوماته
 */
function ProfileView({ person, isMe }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { feed, profile, drafts, streams, following, isFollowing, toggleFollow } = useOutletContext();
  const [tab, setTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);

  const language = i18n.resolvedLanguage;
  const tabs = isMe ? MY_TABS : OTHER_TABS;
  // التبويبات أعرض من الموبايل: تدرّج على الطرف اللي فيه تبويبات مخفية، والمختار بيتحرك للنص
  const tabsScroll = useScrollTabs(tab, tabs.length);
  const listArgs = { isMe, person, me: profile.me, myFollowing: following };

  // منشوراته، والمثبّت أولًا
  const pinnedId = isMe ? profile.profile.pinnedPostId : person.pinnedPostId;
  const authorPosts = feed.posts.filter((post) => post.author.id === person.id);
  const pinnedPost = authorPosts.find((post) => post.id === pinnedId);
  const posts = pinnedPost ? [pinnedPost, ...authorPosts.filter((post) => post !== pinnedPost)] : authorPosts;

  // ردوده (تعليقاته) على كل المنشورات، الأحدث أولًا
  const replies = feed.posts
    .flatMap((post) =>
      post.comments.filter((comment) => comment.author.id === person.id).map((comment) => ({ comment, post }))
    )
    .sort((a, b) => b.comment.createdAt - a.comment.createdAt);

  const mediaPosts = authorPosts.filter((post) => post.media?.src);
  const likedPosts = feed.posts.filter((post) => post.isLiked);

  // بثوثه: المباشر الآن أولًا ثم المسجّلة (الأحدث أولًا)
  const liveRooms = streams.rooms.filter((room) => room.host.id === person.id);
  const recordings = streams.recordings
    .filter((recording) => recording.host.id === person.id)
    .sort((a, b) => b.endedAt - a.endedAt);
  // المؤقت المشترك على بطاقة البث المباشر يتحدّث فقط وتبويب البثوث مفتوح
  const now = useNow(tab === "streams" && liveRooms.length > 0);

  const counts = {
    following: getFollowingList(listArgs).length,
    followers: getFollowersList(listArgs).length,
    posts: authorPosts.length,
  };

  // عدد عناصر كل تبويب (لمعرفة هل هو فارغ)
  const tabCounts = {
    posts: posts.length,
    replies: replies.length,
    media: mediaPosts.length,
    likes: likedPosts.length,
    drafts: drafts.drafts.length,
    streams: liveRooms.length + recordings.length,
  };

  function handleTagClick(tag) {
    navigate(`/study/search?q=${encodeURIComponent(`#${tag}`)}`);
  }

  // إكمال مسودة: تفتح في صندوق الكتابة بصفحة المنشورات
  function continueDraft(draft) {
    navigate("/study", { state: { compose: true, draft } });
  }

  return (
    <>
      <StudyHeader title={person.name} backTo={isMe ? undefined : "/study"} />

      <ProfileHeader
        person={person}
        isMe={isMe}
        counts={counts}
        isFollowed={!isMe && isFollowing(person.id)}
        onToggleFollow={() => toggleFollow(person.id)}
        onEdit={() => setIsEditing(true)}
      />

      {/* التبويبات (بنفس شكل تبويبات القسم، ويتبع القالب) */}
      <div className="profile-tabs">
        <div ref={tabsScroll.ref} className={`study-tabs ${tabsScroll.fadeClass}`} role="tablist">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => setTab(item)}
            >
              {t(`studyApp.profile.tabs.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* الإعجابات خاصة: تظهر لي فقط */}
      {tab === "likes" && <p className="profile-hint">🔒 {t("studyApp.profile.privateLikes")}</p>}

      {tabCounts[tab] === 0 && (
        <EmptyState
          icon={EMPTY_ICONS[tab]}
          title={t(`studyApp.profile.empty.${tab}`)}
          text={isMe ? t(`studyApp.profile.emptyText.${tab}`) : undefined}
        />
      )}

      {/* المنشورات والإعجابات */}
      {(tab === "posts" || tab === "likes") && tabCounts[tab] > 0 && (
        <div className="feed">
          {(tab === "posts" ? posts : likedPosts).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              actions={feed}
              isPinned={tab === "posts" && post.id === pinnedId}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}

      {/* الردود: كل رد يفتح منشوره */}
      {tab === "replies" && (
        <ul className="profile-replies">
          {replies.map(({ comment, post }) => (
            <li key={comment.id}>
              <Link to={`/study/post/${post.id}`} className="profile-reply">
                <span className="profile-reply__meta">
                  {t("studyApp.profile.replyOn", { name: post.author.name })} ·{" "}
                  {formatTimeAgo(comment.createdAt, language)}
                </span>
                <p className="profile-reply__text">{comment.text}</p>
                {post.text && <p className="profile-reply__post">{post.text}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* الوسائط: شبكة صور وفيديوهات وأصوات */}
      {tab === "media" && (
        <ul className="profile-media">
          {mediaPosts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/study/post/${post.id}`}
                className={`profile-media__item profile-media__item--${post.media.type}`}
                aria-label={post.text || post.media.name || t("studyApp.profile.tabs.media")}
              >
                {post.media.type === "image" && <img src={post.media.src} alt="" loading="lazy" />}
                {post.media.type === "video" && <video src={post.media.src} muted playsInline preload="metadata" />}
                {post.media.type === "audio" && (
                  <>
                    <Icon name="music" size={28} />
                    <span>{post.media.name}</span>
                  </>
                )}
                {post.media.type === "video" && (
                  <span className="profile-media__badge">
                    <Icon name="play" size={14} strokeWidth={2.5} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* البثوث: المباشر الآن والمسجّلة */}
      {tab === "streams" && tabCounts.streams > 0 && (
        <div className="stream-grid">
          {liveRooms.map((room) => (
            <StreamCard key={room.id} stream={room} isLive now={now} />
          ))}
          {recordings.map((recording) => (
            <StreamCard key={recording.id} stream={recording} isLive={false} />
          ))}
        </div>
      )}

      {/* المسودات: أكمل الكتابة أو احذف */}
      {tab === "drafts" && (
        <ul className="profile-drafts">
          {drafts.drafts.map((draft) => (
            <li key={draft.id} className="profile-draft">
              <p className="profile-draft__text">{draft.text}</p>
              <div className="profile-draft__bar">
                <span className="profile-draft__meta">
                  {t("studyApp.profile.drafts.updated", { time: formatTimeAgo(draft.updatedAt, language) })}
                  {draft.poll && <> · {t("studyApp.profile.drafts.withPoll")}</>}
                </span>
                <button type="button" className="profile-draft__delete" onClick={() => drafts.deleteDraft(draft.id)}>
                  <Icon name="trash" size={16} />
                  {t("studyApp.profile.drafts.delete")}
                </button>
                <button type="button" className="profile-draft__continue" onClick={() => continueDraft(draft)}>
                  <Icon name="feather" size={16} />
                  {t("studyApp.profile.drafts.continue")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isEditing && (
        <EditProfileDialog
          profile={profile.profile}
          avatar={profile.me.avatar}
          cover={profile.cover}
          onSave={(changes) => {
            profile.updateProfile(changes);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

/**
 * صفحة الحساب (مثل X): /profile لحسابي، و /profile/اسم_المستخدم لأي شخص.
 */
function Profile() {
  const { t } = useTranslation();
  const { handle } = useParams();
  const { profile, session } = useOutletContext();

  const isMe = !handle || handle === CURRENT_USER.handle;

  // أنا بنفس شكل بيانات باقي الأشخاص (الإحصائيات من جلستي)
  const person = isMe
    ? {
        ...profile.profile,
        ...profile.me,
        cover: profile.cover,
        verified: false,
        followsMe: false,
        studyMinutes: session.stats.totalMinutes,
        streak: session.stats.streak,
      }
    : findPersonByHandle(handle);

  if (!person) {
    return (
      <>
        <StudyHeader title={t("studyApp.nav.profile")} backTo="/study" />
        <EmptyState icon="userX" title={t("studyApp.profile.notFound")} text={t("studyApp.profile.notFoundText")} />
      </>
    );
  }

  // key: صفحة جديدة (تبويب "المنشورات") عند الانتقال من حساب لآخر
  return <ProfileView key={person.handle} person={person} isMe={isMe} />;
}

export default Profile;