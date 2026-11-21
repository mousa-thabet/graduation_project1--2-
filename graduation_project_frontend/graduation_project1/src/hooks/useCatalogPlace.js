
import { useState } from "react";
import { findCommunity } from "../data/communities.js";

/**
 * فلتر المكان بقوائم الامتحانات والدورات: المجتمع، وبعد ما تختار مجتمع بيظهر فلتر الفروع جنبه.
 * items: العناصر بعد التبويب (قبل الفلتر)  •  memberships: من useMemberships
 * يرجع:
 * - filtered: العناصر بالمجتمع والفرع المختارين
 * - key: بيتغيّر مع كل تغيير بالفلتر (حتى "عرض المزيد" يرجع لأول 10)
 * - filterProps: للـ CatalogFilters
 */
export function useCatalogPlace(items, memberships) {
  // "all" = الكل
  const [place, setPlace] = useState({ communityId: "all", branchId: "all" });
  const { communityId, branchId } = place;

  const inCommunity = (item) => communityId === "all" || item.communityId === communityId;
  const inBranch = (item) => branchId === "all" || item.branchId === branchId;
  const filtered = items.filter((item) => inCommunity(item) && inBranch(item));

  // فروع المجتمع المختار: اللي انضممت لها، أو اللي فيها عناصر (مثل امتحاناتي)
  const community = communityId === "all" ? null : findCommunity(communityId);
  const branches = (community?.branches ?? []).filter(
    (branch) =>
      memberships.isBranchJoined(communityId, branch.id) ||
      items.some((item) => item.communityId === communityId && item.branchId === branch.id)
  );

  return {
    filtered,
    key: `${communityId}/${branchId}`,
    isFiltered: communityId !== "all",
    filterProps: {
      communities: memberships.myCommunities,
      allCount: items.length,
      countOf: (id) => items.filter((item) => item.communityId === id).length,
      communityId,
      // مجتمع جديد: الفرع يرجع "كل الفروع"
      onCommunity: (id) => setPlace({ communityId: id, branchId: "all" }),
      branches,
      branchId,
      onBranch: (id) => setPlace((current) => ({ ...current, branchId: id })),
      branchCountOf: (id) => items.filter((item) => item.communityId === communityId && item.branchId === id).length,
      onClear: () => setPlace({ communityId: "all", branchId: "all" }),
    },
  };
}