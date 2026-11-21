// البحث في قسم التواصل: المنشورات والأسئلة والأشخاص والمجتمعات وفروعها
import { COMMUNITIES, findBranch, findCommunity } from "../data/communities.js";
import { REPORT_LIMIT } from "../data/studyPosts.js";
import { SUGGESTED_PEOPLE } from "../data/studyPeople.js";
import { CURRENT_USER } from "../data/currentUser.js";
import { rankItems } from "./search.js";

// رابط صفحة نتائج البحث
export const searchPath = (query) => `/community/search?q=${encodeURIComponent(query.trim())}`;

// أنواع النتائج (فلاتر صفحة البحث)
export const SEARCH_FILTERS = ["all", "questions", "posts", "people", "communities"];

// كل المجتمعات والفروع كعناصر بحث: { community, branch }
// (دالة مش ثابت، حتى يدخل بالبحث أي مجتمع أو فرع جديد ضافه الأدمن)
const getPlaces = () =>
  COMMUNITIES.flatMap((community) => [
    { community, branch: null },
    ...community.branches.map((branch) => ({ community, branch })),
  ]);

// اسم المجتمع أو الفرع بكل اللغات (حتى يجد "Frontend" من يكتب بالعربي أو بالإنجليزي)
const allNames = (item) => (item ? Object.values(item.name) : []);

// حقول البحث في المنشور، وأهمية كل حقل
const POST_FIELDS = [
  { get: (post) => post.text, weight: 1 },
  { get: (post) => post.tags, weight: 1.1 },
  { get: (post) => [post.author.name, post.author.handle], weight: 0.8 },
  { get: (post) => allNames(findCommunity(post.communityId)), weight: 0.6 },
  { get: (post) => allNames(findBranch(post.communityId, post.branchId)), weight: 0.6 },
];

const PERSON_FIELDS = [{ get: (person) => [person.name, person.handle] }];

const PLACE_FIELDS = [
  { get: ({ community, branch }) => allNames(branch ?? community), weight: 1.1 },
  { get: ({ community, branch }) => (branch ? branch.tags : community.branches.flatMap((item) => item.tags)) },
  { get: ({ community, branch }) => (branch ? [] : Object.values(community.description)), weight: 0.5 },
];

/**
 * البحث في كل القسم مرة واحدة.
 * posts: المنشورات والأسئلة  •  people: الأشخاص
 * يرجع: { ranked, questions, posts, people, communities } كل واحدة مرتبة من الأقرب للأبعد
 * ranked: المنشورات والأسئلة معًا
 */
export function searchCommunity(query, { posts, people }) {
  // المنشورات المخفية بسبب البلاغات لا تظهر في البحث
  const visiblePosts = posts.filter((post) => post.reports < REPORT_LIMIT);
  const rankedPosts = rankItems(visiblePosts, query, POST_FIELDS).map(({ item }) => item);

  return {
    ranked: rankedPosts,
    questions: rankedPosts.filter((post) => post.type === "question"),
    posts: rankedPosts.filter((post) => post.type !== "question"),
    people: rankItems(people, query, PERSON_FIELDS).map(({ item }) => item),
    communities: rankItems(getPlaces(), query, PLACE_FIELDS).map(({ item }) => item),
  };
}

// أكثر وسوم الأدوات استخدامًا: [{ tag, count }]
export function getTopTags(posts, limit = 6) {
  const counts = new Map();

  posts.forEach((post) => (post.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));

  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

// الأشخاص أصحاب الشارات من كتّاب المنشورات والتعليقات (بدون تكرار وبدوني)
export function getBadgeHolders(posts) {
  const people = new Map();

  posts.forEach((post) => {
    [post.author, ...post.comments.map((comment) => comment.author)].forEach((person) => {
      const isOther = person.id !== CURRENT_USER.id;
      if (isOther && person.badges?.length > 0 && !people.has(person.id)) people.set(person.id, person);
    });
  });

  return [...people.values()];
}

// كل الأشخاص في القسم (كتّاب المنشورات والتعليقات + الاقتراحات) مع شاراتهم، بدوني
export function getCommunityPeople(posts) {
  const people = new Map();

  posts.forEach((post) => {
    [post.author, ...post.comments.map((comment) => comment.author)].forEach((person) => {
      if (person.id !== CURRENT_USER.id && !people.has(person.id)) people.set(person.id, person);
    });
  });

  SUGGESTED_PEOPLE.forEach((person) => {
    if (!people.has(person.id)) people.set(person.id, person);
  });

  return [...people.values()];
}