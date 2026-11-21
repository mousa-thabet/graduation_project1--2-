import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import Icon from "../../../components/Icon/Icon.jsx";
import PostCard from "../../Study/Posts/PostCard/PostCard.jsx";
import { communityPath, findBranch, findCommunity, localName } from "../../../data/communities.js";
import { searchPath } from "../../../utils/communitySearch.js";
import { formatDuration, livePath } from "../CommunityLive/liveUtils.js";
import "../CommunityLive/CommunityLive.css";
import "./CommunityPostCard.css";

// رابط البحث عن وسم
const tagPath = (tag) => searchPath(`#${tag}`);

/**
 * من أين المنشور: "Front-End › Frameworks · #React" بسطر واحد بلون هادي.
 * كل جزء رابط: المسار، الفرع، ووسوم الأدوات.
 * ويظهر نوع المنشور قبلها: سؤال، فيديو، أو بث (المنشور العادي بدون علامة).
 */
export function PostOrigin({ post }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const community = findCommunity(post.communityId);
  const branch = findBranch(post.communityId, post.branchId);

  if (!community) return null;

  return (
    <div className="post-origin">
      {post.type === "question" && (
        <span className="post-origin__type">
          <CommunityIcon name="question" size={13} strokeWidth={2.5} />
          {t("community.types.question")}
        </span>
      )}
      {post.type === "video" && (
        <span className="post-origin__type">
          <Icon name="video" size={13} strokeWidth={2.5} />
          {t("community.types.video")}
        </span>
      )}
      {post.type === "live" && (
        <span className="post-origin__type post-origin__type--live">
          <Icon name="radio" size={13} strokeWidth={2.5} />
          {t(post.live?.status === "live" ? "community.types.live" : "community.live.recorded")}
        </span>
      )}

      <Link to={communityPath(community.id)} className="post-origin__community">
        {localName(community, language)}
      </Link>

      {branch && (
        <>
          <span className="post-origin__separator" aria-hidden="true">
            ›
          </span>
          <Link to={communityPath(community.id, branch.id)} className="post-origin__branch">
            {localName(branch, language)}
          </Link>
        </>
      )}

      {post.tags?.map((tag) => (
        <Link key={tag} to={tagPath(tag)} className="post-origin__tag" dir="ltr">
          #{tag}
        </Link>
      ))}
    </div>
  );
}

/**
 * شريط البث تحت سطر المكان: "🔴 مباشر الآن · انضم"، أو "انتهى البث · مدته 12:05"
 */
function LiveBanner({ post }) {
  const { t } = useTranslation();
  const { status, startedAt, endedAt } = post.live;

  if (status === "live") {
    return (
      <Link to={livePath(post.id)} className="live-banner is-live">
        <span className="live-badge">
          <span className="live-badge__dot" aria-hidden="true" />
          {t("community.live.badge")}
        </span>
        <span className="live-banner__text">{t(post.isMine ? "community.live.backToLive" : "community.live.join")}</span>
        <Icon name="play" size={16} />
      </Link>
    );
  }

  return (
    <p className="live-banner">
      <Icon name="radio" size={16} />
      {t("community.live.endedAfter", { duration: formatDuration(endedAt - startedAt) })}
      {!post.media && ` · ${t("community.live.noRecording")}`}
    </p>
  );
}

/**
 * منشور في قسم التواصل: نفس PostCard مع سطر "من أين المنشور" وروابط /community.
 * الوسوم داخل النص تفتح صفحة البحث.
 * isPinned: المنشور مثبّت في الحساب (يظهر فوقه "منشور مثبّت")
 * منشور البث: يظهر تحته شريط "انضم للبث" أو "انتهى البث" (والتسجيل كفيديو)
 */
function CommunityPostCard({ post, actions, isDetail, isPinned }) {
  const navigate = useNavigate();

  return (
    <div className={`community-post community-post--${post.type ?? "post"}`}>
      <PostCard
        post={post}
        actions={actions}
        isDetail={isDetail}
        isPinned={isPinned}
        basePath="/community"
        meta={
          <>
            <PostOrigin post={post} />
            {post.type === "live" && post.live && <LiveBanner post={post} />}
          </>
        }
        onTagClick={(tag) => navigate(tagPath(tag))}
      />
    </div>
  );
}

export default CommunityPostCard;