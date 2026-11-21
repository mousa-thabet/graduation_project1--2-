// حسابات مشتقة من المنشورات (لا تُخزَّن، بل تُحسب كل مرة)
import { SUGGESTED_PEOPLE } from "../data/studyPeople.js";
import { CURRENT_USER } from "../data/currentUser.js";
import { REPORT_LIMIT } from "../data/studyPosts.js";

// كل الأشخاص المعروفين: الاقتراحات + كتّاب المنشورات (بدون تكرار وبدوني)
export function getPeople(posts) {
  const people = new Map(SUGGESTED_PEOPLE.map((person) => [person.id, person]));

  posts.forEach(({ author }) => {
    if (author.id !== CURRENT_USER.id && !people.has(author.id)) people.set(author.id, author);
  });

  return [...people.values()];
}

// أكثر الوسوم استخدامًا: { tag, count } مرتبة من الأكثر للأقل
export function getTrendingTags(posts, limit = 5) {
  const counts = new Map();

  posts
    .filter((post) => post.text && post.reports < REPORT_LIMIT)
    .forEach((post) => {
      // الوسم يُحسب مرة واحدة في المنشور حتى لو تكرر
      const tags = new Set(post.text.match(/#[\p{L}\p{N}_]+/gu)?.map((tag) => tag.slice(1)));
      tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });

  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}