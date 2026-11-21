// تصفية منشورات التواصل حسب نوعها

// تبويبات نوع المنشور
export const TYPE_TABS = ["all", "posts", "questions", "videos", "live"];

// النوع في كل تبويب (المنشورات القديمة بدون نوع = منشور عادي)
const TAB_TYPES = { posts: "post", questions: "question", videos: "video", live: "live" };

// تصفية المنشورات حسب التبويب
export function filterByType(posts, tab) {
  const type = TAB_TYPES[tab];
  if (!type) return posts;

  return posts.filter((post) => (post.type ?? "post") === type);
}