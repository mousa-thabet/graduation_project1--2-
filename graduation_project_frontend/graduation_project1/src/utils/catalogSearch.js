// البحث داخل الامتحانات والدورات (نفس البحث الذكي في التواصل)
import { rankItems } from "./search.js";
import { findBranch, findCommunity } from "../data/communities.js";

// اسم المكان باللغتين، حتى يطلع الامتحان لو كتبت "قواعد" أو "Databases"
function placeNames(item) {
  const community = findCommunity(item.communityId);
  const branch = findBranch(item.communityId, item.branchId);
  return [community, branch].filter(Boolean).flatMap((place) => Object.values(place.name));
}

/**
 * ترتيب الامتحانات أو الدورات حسب قربها من البحث (الفاضي يرجع الكل كما هو).
 * getExtra(item): نصوص إضافية يُبحث فيها (مثل أسئلة الامتحان أو عناوين الدروس)
 */
export function searchCatalog(items, query, getExtra = () => []) {
  if (!query.trim()) return items;

  return rankItems(items, query, [
    { get: (item) => item.title, weight: 1 },
    { get: (item) => item.author.name, weight: 0.9 },
    { get: (item) => placeNames(item), weight: 0.85 },
    { get: (item) => item.description, weight: 0.7 },
    { get: (item) => getExtra(item), weight: 0.6 },
  ]).map(({ item }) => item);
}

// طرق الترتيب (لما ما في بحث؛ مع البحث الترتيب حسب الأقرب)
export const CATALOG_SORTS = ["newest", "oldest", "shortest"];

/**
 * ترتيب الامتحانات أو الدورات: الأحدث، الأقدم، أو الأقصر.
 * getMinutes(item): مدة العنصر بالدقائق (للترتيب حسب الأقصر)
 */
export function sortCatalog(items, sort, getMinutes) {
  const sorted = [...items];
  if (sort === "oldest") return sorted.sort((a, b) => a.createdAt - b.createdAt);
  if (sort === "shortest") return sorted.sort((a, b) => getMinutes(a) - getMinutes(b) || b.createdAt - a.createdAt);
  return sorted.sort((a, b) => b.createdAt - a.createdAt);
}