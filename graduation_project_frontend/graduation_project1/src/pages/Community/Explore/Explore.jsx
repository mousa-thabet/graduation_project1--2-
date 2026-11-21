import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import BranchPicker, { CommunityJoinButton } from "../BranchPicker/BranchPicker.jsx";
import { COMMUNITIES, GENERAL_ID, communityPath, localName } from "../../../data/communities.js";
import { formatCount } from "../../../utils/format.js";
import "./Explore.css";

// كم فرع بيبيّن بالبطاقة (والباقي "+5")
const BRANCH_PREVIEW = 4;

/**
 * المجتمعات: /community/explore
 * كل المسارات، والانضمام لأي مسار مع اختيار فروعه (نافذة فيها بحث، مش كل الفروع على البطاقة).
 * البطاقة بتعرض فروعي بالمسار (أو أول كم فرع إذا ما اخترت)، والباقي بنافذة الفروع.
 */
function Explore() {
  const { t, i18n } = useTranslation();
  const { feed } = useOutletContext();
  const [picking, setPicking] = useState(null);
  const language = i18n.resolvedLanguage;

  // عدد المنشورات في كل مسار
  const postsIn = (communityId) => feed.posts.filter((post) => post.communityId === communityId).length;

  return (
    <>
      <StudyHeader title={t("community.nav.explore")} />

      <p className="explore__intro">{t("community.explore.intro")}</p>

      <ul className="explore">
        {COMMUNITIES.map((community) => {
          return (
            <li key={community.id} className="explore-card" style={{ "--track": community.color }}>
              <Link to={communityPath(community.id)} className="explore-card__main">
                <span className="explore-card__icon">
                  <CommunityIcon name={community.id} size={26} />
                </span>

                <span className="explore-card__text">
                  <strong className="explore-card__name">{localName(community, language)}</strong>
                  <span className="explore-card__description">
                    {community.description[language] ?? community.description.en}
                  </span>
                  <span className="explore-card__stats">
                    {t("community.membersCount", { value: formatCount(community.members, language) })}
                    <span aria-hidden="true">·</span>
                    {t("community.postsCount", { value: postsIn(community.id) })}
                    {community.id === GENERAL_ID && (
                      <>
                        <span aria-hidden="true">·</span>
                        {t("community.welcome.generalNote")}
                      </>
                    )}
                  </span>
                </span>
              </Link>

              <div className="explore-card__join">
                <CommunityJoinButton community={community} onPick={() => setPicking(community)} />
              </div>

              {/* الفروع: فروعي (أو أول كم فرع)، والباقي بنافذة الفروع */}
              {community.branches.length > 0 && (
                <BranchPreview community={community} onBrowse={() => setPicking(community)} />
              )}
            </li>
          );
        })}
      </ul>

      {picking && <BranchPicker community={picking} onClose={() => setPicking(null)} />}

      {/* اقتراح فرع جديد (لأصحاب الشارات) */}
      <Link to="/community/branch-requests" className="explore-badges">
        <span className="explore-badges__icon">
          <CommunityIcon name="branch" size={24} />
        </span>
        <span>
          <strong>{t("community.branchRequests.title")}</strong>
          <span>{t("community.branchRequests.exploreText")}</span>
        </span>
      </Link>

      {/* الشارات */}
      <Link to="/community/badges" className="explore-badges">
        <span className="explore-badges__icon">
          <CommunityIcon name="badge" size={24} />
        </span>
        <span>
          <strong>{t("community.explore.badgesTitle")}</strong>
          <span>{t("community.explore.badgesText")}</span>
        </span>
      </Link>
    </>
  );
}

/**
 * سطر فروع المسار بالبطاقة: عددها، فروعي فيه (أو أول كم فرع)، و"+5"، وزر "تصفّح الفروع".
 * ما بيكبر مهما زادت الفروع.
 */
function BranchPreview({ community, onBrowse }) {
  const { t, i18n } = useTranslation();
  const { memberships } = useOutletContext();
  const language = i18n.resolvedLanguage;
  const joinedIds = memberships.joinedBranchesOf(community.id);
  const joined = community.branches.filter((branch) => joinedIds.includes(branch.id));
  // إذا ما اخترت فروع: أول كم فرع كعيّنة (باهتة)
  const shown = (joined.length > 0 ? joined : community.branches).slice(0, BRANCH_PREVIEW);
  const rest = (joined.length > 0 ? joined.length : community.branches.length) - shown.length;

  return (
    <div className="explore-card__branches">
      <span className="explore-card__branches-count">
        <CommunityIcon name="branch" size={15} />
        {t("branches.count", { count: community.branches.length })}
      </span>

      {shown.map((branch) => (
        <Link
          key={branch.id}
          to={communityPath(community.id, branch.id)}
          className={`explore-chip ${joinedIds.includes(branch.id) ? "is-joined" : ""}`}
          dir="auto"
        >
          {localName(branch, language)}
        </Link>
      ))}
      {rest > 0 && <span className="explore-chip explore-chip--more">{t("branches.more", { count: rest })}</span>}

      <button type="button" className="explore-card__browse" onClick={onBrowse}>
        {t(memberships.isJoined(community.id) ? "branches.manage" : "branches.browse")}
      </button>
    </div>
  );
}

export default Explore;