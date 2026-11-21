import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import CommunityPostCard from "../CommunityPostCard/CommunityPostCard.jsx";

/**
 * صفحة منشور أو سؤال: /community/post/:postId
 * التعليقات مفتوحة، وتحت السؤال تنبيه أن الإجابات آراء أصحابها.
 */
function CommunityPostDetail() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { feed } = useOutletContext();
  const post = feed.posts.find((item) => item.id === postId);
  const isQuestion = post?.type === "question";

  // بعد حذف المنشور نرجع للرئيسية
  function handleDelete(id) {
    feed.deletePost(id);
    navigate("/community");
  }

  return (
    <>
      <StudyHeader title={t(isQuestion ? "community.types.question" : "community.types.post")} backTo="/community" />

      {post ? (
        <>
          {isQuestion && (
            <p className="community-disclaimer">
              <CommunityIcon name="badge" size={16} />
              {t("community.disclaimer")}
            </p>
          )}
          <CommunityPostCard key={post.id} post={post} isDetail actions={{ ...feed, deletePost: handleDelete }} />
        </>
      ) : (
        <EmptyState icon="comment" title={t("studyApp.detail.notFound")} text={t("studyApp.detail.notFoundText")} />
      )}
    </>
  );
}

export default CommunityPostDetail;