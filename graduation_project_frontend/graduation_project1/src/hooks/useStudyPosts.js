import { useEffect, useRef, useState } from "react";
import { STUDY_POSTS } from "../data/studyPosts.js";
import { CURRENT_USER } from "../data/currentUser.js";
import { deleteMedia, getMedia, saveMedia } from "../utils/mediaStore.js";

const STORAGE_KEY = "areatk-study-feed";

const EMPTY_STATE = {
  myPosts: [],
  liked: [],
  reported: [],
  comments: {},
  likedComments: [],
  reportedComments: [],
  saved: [],
  votes: {},
};

function loadState(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) return { ...EMPTY_STATE, ...saved };
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return EMPTY_STATE;
}

// الرابط المؤقت (blob) لا يُحفظ؛ نحفظ رقم الملف فقط ونقرأه من IndexedDB لاحقًا
function toSavedPost(post) {
  if (!post.media?.mediaId) return post;

  const { src, ...media } = post.media;
  return { ...post, media };
}

// إضافة عنصر إلى قائمة أو إزالته منها
function toggleItem(list, item) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

/**
 * المنشورات: النشر والتعديل، الإعجاب، الحفظ، الاستطلاعات، التعليقات والردود، والإبلاغ.
 * النصوص والتفاعلات في localStorage، والملفات المرفوعة في IndexedDB.
 * يُستدعى مرة واحدة في القالب (StudyLayout أو CommunityLayout) ويصل لكل الصفحات عبر Outlet context.
 *
 * نفس الكود يخدم القسمين، وكل قسم له منشوراته ومكان حفظه:
 * storageKey: مفتاح الحفظ  •  initialPosts: المنشورات التجريبية
 */
export function useStudyPosts({ storageKey = STORAGE_KEY, initialPosts = STUDY_POSTS } = {}) {
  const [state, setState] = useState(() => loadState(storageKey));
  const [mediaUrls, setMediaUrls] = useState({});
  const createdUrlsRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, myPosts: state.myPosts.map(toSavedPost) }));
  }, [state, storageKey]);

  // قراءة ملفات منشوراتي من IndexedDB مرة واحدة عند فتح الصفحة
  useEffect(() => {
    let isCancelled = false;
    const createdUrls = createdUrlsRef.current;

    state.myPosts
      .filter((post) => post.media?.mediaId && !post.media.src)
      .forEach(async ({ media }) => {
        const file = await getMedia(media.mediaId).catch(() => null);
        if (!file || isCancelled) return;

        const url = URL.createObjectURL(file);
        createdUrls.push(url);
        setMediaUrls((current) => ({ ...current, [media.mediaId]: url }));
      });

    // حذف الروابط المؤقتة من الذاكرة عند مغادرة الصفحة
    return () => {
      isCancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // إضافة تفاعلاتي على التعليق (إعجاب، بلاغ، هل هو تعليقي)
  function withMyCommentState(comment) {
    const isLiked = state.likedComments.includes(comment.id);
    const isReported = state.reportedComments.includes(comment.id);

    return {
      ...comment,
      isMine: comment.author.id === CURRENT_USER.id,
      isLiked,
      isReported,
      likes: (comment.likes ?? 0) + (isLiked ? 1 : 0),
      reports: (comment.reports ?? 0) + (isReported ? 1 : 0),
    };
  }

  // إضافة صوتي على الاستطلاع (إن صوّتُّ)
  function withMyVote(postId, poll) {
    const myVote = state.votes[postId];

    return {
      ...poll,
      myVote,
      options: poll.options.map((option) => ({ ...option, votes: option.votes + (option.id === myVote ? 1 : 0) })),
    };
  }

  // دمج منشوراتي مع منشورات الآخرين، وإضافة تفاعلاتي عليها
  const posts = [...state.myPosts, ...initialPosts]
    .map((post) => {
      const isLiked = state.liked.includes(post.id);
      const isReported = state.reported.includes(post.id);
      const media = post.media && { ...post.media, src: post.media.src ?? mediaUrls[post.media.mediaId] };

      return {
        ...post,
        media,
        isMine: post.author.id === CURRENT_USER.id,
        isLiked,
        isReported,
        isSaved: state.saved.includes(post.id),
        poll: post.poll && withMyVote(post.id, post.poll),
        likes: post.likes + (isLiked ? 1 : 0),
        reports: post.reports + (isReported ? 1 : 0),
        comments: [...post.comments, ...(state.comments[post.id] ?? [])].map(withMyCommentState),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // ----- المنشورات -----

  // file: الملف الأصلي من جهاز المستخدم، poll: نصوص خيارات الاستطلاع
  // achievement: إنجاز من جلستي { minutes, task, streak } (كلها اختيارية)
  // extra: معلومات إضافية تُحفظ مع المنشور (في التواصل: النوع، المجتمع، الفرع، الوسوم)
  // ترجع رقم المنشور الجديد
  function addPost({ text, file, poll, achievement, ...extra }) {
    const id = crypto.randomUUID();
    let media = null;

    if (file) {
      const src = URL.createObjectURL(file);
      createdUrlsRef.current.push(src);
      media = { type: file.type.split("/")[0], name: file.name, mediaId: id, src };
      saveMedia(id, file);
    }

    const post = {
      id,
      ...extra,
      ...(achievement && { kind: "achievement", achievement }),
      author: CURRENT_USER,
      createdAt: Date.now(),
      text,
      media,
      poll: poll?.length
        ? { options: poll.map((option, index) => ({ id: `${id}-${index}`, text: option, votes: 0 })) }
        : null,
      likes: 0,
      reports: 0,
      comments: [],
    };

    setState((current) => ({ ...current, myPosts: [post, ...current.myPosts] }));
    return id;
  }

  // إعجاب من شخص آخر على منشوري (سيصل من السيرفر لاحقًا)
  function receiveLike(postId) {
    setState((current) => ({
      ...current,
      myPosts: current.myPosts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)),
    }));
  }

  // تعديل نص منشوري مع حفظ وقت التعديل
  function editPost(postId, text) {
    setState((current) => ({
      ...current,
      myPosts: current.myPosts.map((post) =>
        post.id === postId ? { ...post, text, editedAt: Date.now() } : post
      ),
    }));
  }

  // تحديث معلومات منشوري (مثل حالة البث المباشر)، مع ملف اختياري يُحفظ كوسائط المنشور
  // مثال: انتهاء البث ← { live: { status: "ended" } } مع تسجيل البث كفيديو
  function updatePost(postId, changes, file) {
    let media = null;

    if (file) {
      const src = URL.createObjectURL(file);
      createdUrlsRef.current.push(src);
      media = { type: file.type.split("/")[0], name: file.name, mediaId: postId, src };
      saveMedia(postId, file);
    }

    setState((current) => ({
      ...current,
      myPosts: current.myPosts.map((post) =>
        post.id === postId ? { ...post, ...changes, ...(media && { media }) } : post
      ),
    }));
  }

  function deletePost(postId) {
    const post = state.myPosts.find((item) => item.id === postId);
    if (post?.media?.mediaId) deleteMedia(post.media.mediaId);

    setState((current) => ({
      ...current,
      myPosts: current.myPosts.filter((item) => item.id !== postId),
    }));
  }

  function toggleLike(postId) {
    setState((current) => ({ ...current, liked: toggleItem(current.liked, postId) }));
  }

  function toggleSave(postId) {
    setState((current) => ({ ...current, saved: toggleItem(current.saved, postId) }));
  }

  // صوت واحد فقط لكل مستخدم في الاستطلاع
  function vote(postId, optionId) {
    setState((current) =>
      current.votes[postId] ? current : { ...current, votes: { ...current.votes, [postId]: optionId } }
    );
  }

  // كل مستخدم يبلّغ مرة واحدة فقط على المنشور
  function report(postId) {
    setState((current) =>
      current.reported.includes(postId) ? current : { ...current, reported: [...current.reported, postId] }
    );
  }

  // ----- التعليقات -----

  // reply: { parentId, handle } عند الرد على تعليق (اختياري)
  function addComment(postId, text, reply) {
    const comment = {
      id: crypto.randomUUID(),
      author: CURRENT_USER,
      createdAt: Date.now(),
      text,
      likes: 0,
      reports: 0,
      ...(reply && { parentId: reply.parentId, replyTo: reply.handle }),
    };

    setState((current) => ({
      ...current,
      comments: { ...current.comments, [postId]: [...(current.comments[postId] ?? []), comment] },
    }));
  }

  // حذف تعليقي مع الردود التي تحته
  function deleteComment(postId, commentId) {
    setState((current) => ({
      ...current,
      comments: {
        ...current.comments,
        [postId]: (current.comments[postId] ?? []).filter(
          (comment) => comment.id !== commentId && comment.parentId !== commentId
        ),
      },
    }));
  }

  function toggleCommentLike(commentId) {
    setState((current) => ({ ...current, likedComments: toggleItem(current.likedComments, commentId) }));
  }

  // كل مستخدم يبلّغ مرة واحدة فقط على التعليق
  function reportComment(commentId) {
    setState((current) =>
      current.reportedComments.includes(commentId)
        ? current
        : { ...current, reportedComments: [...current.reportedComments, commentId] }
    );
  }

  return {
    posts,
    addPost,
    receiveLike,
    editPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleSave,
    vote,
    report,
    addComment,
    deleteComment,
    toggleCommentLike,
    reportComment,
  };
}