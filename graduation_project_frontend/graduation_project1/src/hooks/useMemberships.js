import { useEffect, useState } from "react";
import { COMMUNITIES, GENERAL_ID, branchKey } from "../data/communities.js";

const STORAGE_KEY = "areatk-community-memberships";

// onboarded: اختار اهتماماته أول مرة  •  communities: أرقام المجتمعات  •  branches: "community/branch"
const EMPTY_STATE = { onboarded: false, communities: [], branches: [] };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { ...EMPTY_STATE, ...saved };
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return EMPTY_STATE;
}

// فروع مجتمع معيّن من قائمة المفاتيح: "frontend/react" ← "react"
const branchesOf = (keys, communityId) =>
  keys.filter((key) => key.startsWith(`${communityId}/`)).map((key) => key.slice(communityId.length + 1));

/**
 * المجتمعات والفروع التي انضممت لها.
 *
 * القواعد:
 * - الانضمام لمجتمع ما بيضمّك لفروعه: إنت بتختار الفروع اللي بدك ياها (أو ولا فرع).
 * - مجتمع بدون فروع مختارة: بتوصلك منشوراته اللي مش بفرع معيّن بس.
 * - مغادرة المجتمع = مغادرة كل فروعه.
 * - الانضمام لفرع من مجتمع لم تنضم له = انضمام للمجتمع بهذا الفرع فقط.
 * - مغادرة آخر فرع ما بتطلّعك من المجتمع.
 * - المجتمع العام (الشمولي) يعرض منشورات كل المسارات.
 */
export function useMemberships() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const isJoined = (communityId) => state.communities.includes(communityId);
  const isBranchJoined = (communityId, branchId) => state.branches.includes(branchKey(communityId, branchId));

  // أول دخول: حفظ اختيارات "شو بيهمك؟"
  function completeOnboarding(communities, branches) {
    setState({ onboarded: true, communities, branches });
  }

  // انضمام للمجتمع لحاله (بدون فروع)، أو مغادرته مع كل فروعه
  function toggleCommunity(communityId) {
    setState((current) => {
      if (current.communities.includes(communityId)) {
        return {
          ...current,
          communities: current.communities.filter((id) => id !== communityId),
          branches: current.branches.filter((key) => !key.startsWith(`${communityId}/`)),
        };
      }

      return { ...current, communities: [...current.communities, communityId] };
    });
  }

  // اختيار فروع مجتمع (من نافذة الفروع): بيضمّك للمجتمع، وفروعه بتصير هاي بالزبط
  // branchIds: ["react", "vue"] أو [] (المجتمع بدون فروع)
  function setCommunityBranches(communityId, branchIds) {
    setState((current) => ({
      ...current,
      communities: current.communities.includes(communityId)
        ? current.communities
        : [...current.communities, communityId],
      branches: [
        ...current.branches.filter((key) => !key.startsWith(`${communityId}/`)),
        ...branchIds.map((branchId) => branchKey(communityId, branchId)),
      ],
    }));
  }

  function toggleBranch(communityId, branchId) {
    const key = branchKey(communityId, branchId);

    setState((current) => {
      // مغادرة الفرع: بتضل بالمجتمع
      if (current.branches.includes(key)) {
        return { ...current, branches: current.branches.filter((item) => item !== key) };
      }

      return {
        ...current,
        branches: [...current.branches, key],
        communities: current.communities.includes(communityId)
          ? current.communities
          : [...current.communities, communityId],
      };
    });
  }

  // هل يظهر المنشور في الرئيسية؟
  function isInFeed(post) {
    if (post.isMine) return true;

    const isGeneralMember = state.communities.includes(GENERAL_ID);
    const fitsBranch = !post.branchId || isBranchJoined(post.communityId, post.branchId);

    // منشورات المجتمع العام نفسه تتبع فروعه، ومنشورات باقي المسارات تظهر كلها لعضو العام
    if (post.communityId !== GENERAL_ID && isGeneralMember) return true;
    return isJoined(post.communityId) && fitsBranch;
  }

  // هل المحتوى (امتحان، دورة...) من مجتمع أنا داخل فيه؟ (بدون قاعدة العام الشمولي)
  // item: { communityId, branchId, isMine }
  function isInMyCommunities(item) {
    if (item.isMine) return true;
    return isJoined(item.communityId) && (!item.branchId || isBranchJoined(item.communityId, item.branchId));
  }

  // مجتمعاتي بترتيب القائمة الأصلي
  const myCommunities = COMMUNITIES.filter((community) => state.communities.includes(community.id));

  // أرقام الفروع اللي انضممت لها بمجتمع معيّن: ["react", "vue"]
  const joinedBranchesOf = (communityId) => branchesOf(state.branches, communityId);

  return {
    isOnboarded: state.onboarded,
    joinedCommunities: state.communities,
    joinedBranches: state.branches,
    myCommunities,
    isJoined,
    isBranchJoined,
    joinedBranchesOf,
    isInFeed,
    isInMyCommunities,
    completeOnboarding,
    toggleCommunity,
    setCommunityBranches,
    toggleBranch,
  };
}