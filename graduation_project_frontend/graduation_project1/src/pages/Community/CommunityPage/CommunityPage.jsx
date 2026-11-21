import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";

import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import JoinButton from "../JoinButton/JoinButton.jsx";

import BranchPicker, {
  CommunityJoinButton,
} from "../BranchPicker/BranchPicker.jsx";

import CommunityComposer from "../CommunityComposer/CommunityComposer.jsx";
import PostList, { TypeTabs } from "../PostList/PostList.jsx";
import { filterByType } from "../PostList/postFilters.js";

import {
  GENERAL_ID,
  communityPath,
  findBranch,
  findCommunity,
  localName,
} from "../../../data/communities.js";

import { formatCount } from "../../../utils/format.js";

import "../../Study/Search/Search.css";
import "./CommunityPage.css";

function CommunityPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { communityId, branchId } = useParams();
  const { feed, memberships, me, badges } = useOutletContext();

  const [tab, setTab] = useState("all");
  const [isPicking, setIsPicking] = useState(false);

  const language = i18n.resolvedLanguage;
  const isArabic = language === "ar";

  const community = findCommunity(communityId);
  const branch = findBranch(communityId, branchId);

  if (!community || (branchId && !branch)) {
    return (
      <>
        <StudyHeader
          title={t("community.page.notFound")}
          backTo="/community/explore"
        />

        <EmptyState
          icon="search"
          title={t("community.page.notFound")}
          text={t("community.page.notFoundText")}
        >
          <Link to="/community/explore" className="search-clear">
            {t("community.nav.explore")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const isGeneral = community.id === GENERAL_ID;
  const communityName = localName(community, language);

  const title = branch
    ? localName(branch, language)
    : communityName;

  const isJoined = branch
    ? memberships.isBranchJoined(community.id, branch.id)
    : memberships.isJoined(community.id);

  // خيارات الفلتر: الفروع المنضم لها فقط.
  const joinedBranches = community.branches.filter((item) =>
    memberships.isBranchJoined(community.id, item.id)
  );

  // عند فتح رابط فرع غير منضم له، يظهر اسمه الحالي بخيار معطّل.
  const isOutsideJoinedBranches =
    branch &&
    !joinedBranches.some((item) => item.id === branch.id);

  const placePosts = feed.posts.filter((post) => {
    if (branch) {
      return (
        post.communityId === community.id &&
        post.branchId === branch.id
      );
    }

    return isGeneral || post.communityId === community.id;
  });

  const visiblePosts = filterByType(placePosts, tab);

  return (
    <>
      <StudyHeader
        title={title}
        backTo={
          branch
            ? communityPath(community.id)
            : "/community/explore"
        }
      >
        <TypeTabs value={tab} onChange={setTab} />
      </StudyHeader>

      <section
        className="community-hero"
        style={{ "--track": community.color }}
      >
        <div className="community-hero__cover" aria-hidden="true">
          <CommunityIcon
            name={community.id}
            size={140}
            strokeWidth={1.2}
          />
        </div>

        <div className="community-hero__body">
          <span className="community-hero__icon">
            <CommunityIcon name={community.id} size={30} />
          </span>

          <div className="community-hero__text">
            {branch && (
              <Link
                to={communityPath(community.id)}
                className="community-hero__parent"
              >
                {communityName}
              </Link>
            )}

            <h2 className="community-hero__title">{title}</h2>

            {!branch && (
              <p className="community-hero__description">
                {community.description[language] ??
                  community.description.en}
              </p>
            )}

            <p className="community-hero__stats">
              {!branch && (
                <>
                  {t("community.membersCount", {
                    value: formatCount(
                      community.members,
                      language
                    ),
                  })}

                  <span aria-hidden="true">·</span>
                </>
              )}

              {t("community.postsCount", {
                value: placePosts.length,
              })}
            </p>
          </div>

          {branch ? (
            <JoinButton
              isJoined={isJoined}
              label={t(
                isJoined
                  ? "community.join.leaveNamed"
                  : "community.join.joinNamed",
                { name: title }
              )}
              onToggle={() =>
                memberships.toggleBranch(
                  community.id,
                  branch.id
                )
              }
            />
          ) : (
            <CommunityJoinButton
              community={community}
              onPick={() => setIsPicking(true)}
            />
          )}
        </div>

        {community.branches.length > 0 && (
          <div className="community-content-filter">
            <label className="community-content-filter__field">
              <span>
                {isArabic
                  ? "تصفية حسب الفرع"
                  : "Filter by branch"}
              </span>

              <select
                value={branch?.id ?? ""}
                onChange={(event) =>
                  navigate(
                    communityPath(
                      community.id,
                      event.target.value
                    )
                  )
                }
              >
                <option value="">
                  {isArabic
                    ? "العام (كل المحتوى)"
                    : "General (all content)"}
                </option>

                {isOutsideJoinedBranches && (
                  <option value={branch.id} disabled>
                    {localName(branch, language)}
                  </option>
                )}

                {joinedBranches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {localName(item, language)}
                  </option>
                ))}
              </select>
            </label>

            {badges.hasBadge && (
              <Link
                to={`/community/branch-requests?community=${community.id}`}
                className="community-content-filter__suggest"
              >
                <Icon
                  name="plus"
                  size={14}
                  strokeWidth={2.5}
                />

                {t("community.branchRequests.suggest")}
              </Link>
            )}
          </div>
        )}
      </section>

      {isPicking && (
        <BranchPicker
          community={community}
          onClose={() => setIsPicking(false)}
        />
      )}

      {memberships.isJoined(community.id) ? (
        <CommunityComposer
          key={`${community.id}/${branch?.id ?? ""}`}
          feed={feed}
          me={me}
          myCommunities={memberships.myCommunities}
          defaultCommunityId={community.id}
          defaultBranchId={branch?.id ?? ""}
        />
      ) : (
        <p className="community-disclaimer">
          <Icon name="lock" size={16} />

          {t("community.page.joinToPost", {
            name: communityName,
          })}
        </p>
      )}

      <PostList
        posts={visiblePosts}
        actions={feed}
        empty={{
          icon: "comment",
          title: t("community.page.emptyTitle"),
          text: t("community.page.emptyText"),
        }}
      />
    </>
  );
}

export default CommunityPage;