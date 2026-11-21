import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import PostCard from "../Posts/PostCard/PostCard.jsx";

/**
 * صفحة منشور واحد: /study/post/:postId
 * يظهر المنشور مع تعليقاته مفتوحة.
 */
function PostDetail() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();

  const { feed } = useOutletContext();
  const post = feed.posts.find((item) => item.id === postId);

  // بعد حذف المنشور نرجع للمنشورات
  function handleDelete(id) {
    feed.deletePost(id);
    navigate("/study");
  }

  // الضغط على وسم يفتح نتائج البحث عنه
  function handleTagClick(tag) {
    navigate(`/study/search?q=${encodeURIComponent(`#${tag}`)}`);
  }

  return (
    <>
      <StudyHeader title={t("studyApp.detail.title")} backTo="/study" />

      {post ? (
        <PostCard
          key={post.id}
          post={post}
          isDetail
          actions={{ ...feed, deletePost: handleDelete }}
          onTagClick={handleTagClick}
        />
      ) : (
        <EmptyState icon="comment" title={t("studyApp.detail.notFound")} text={t("studyApp.detail.notFoundText")} />
      )}
    </>
  );
}

export default PostDetail;