import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../../../components/Icon/Icon.jsx";
import Avatar from "../../../../../components/Avatar/Avatar.jsx";
import { UserBadges } from "../../../../../components/UserBadge/UserBadge.jsx";
import { useProfilePath } from "../../../../../hooks/useProfilePath.js";
import { REPORT_LIMIT } from "../../../../../data/studyPosts.js";
import { formatCount, formatTimeAgo } from "../../../../../utils/format.js";
import "./Comments.css";

/**
 * تعليق واحد: الكاتب (رابط لحسابه) وشاراته، النص، والأزرار (إعجاب، رد، إبلاغ أو حذف).
 */
function Comment({ comment, isReply, onLike, onReply, onReport, onDelete }) {
  const { t, i18n } = useTranslation();
  // رابط حساب الكاتب داخل القسم المفتوح (ادرس معي أو التواصل)
  const profilePath = useProfilePath();
  const language = i18n.resolvedLanguage;
  const [showAnyway, setShowAnyway] = useState(false);

  // التعليق المخفي بسبب البلاغات
  if (comment.reports >= REPORT_LIMIT && !showAnyway) {
    return (
      <div className={`comment-hidden ${isReply ? "is-reply" : ""}`}>
        <Icon name="flag" size={14} />
        <span>{t("studyApp.comments.hidden")}</span>
        <button type="button" onClick={() => setShowAnyway(true)}>
          {t("studyApp.post.showAnyway")}
        </button>
      </div>
    );
  }

  return (
    <div className={`comment ${isReply ? "is-reply" : ""}`}>
      <Link to={profilePath(comment.author.handle)} className="comment__avatar" tabIndex={-1} aria-hidden="true">
        <Avatar person={comment.author} />
      </Link>

      <div className="comment__main">
        <div className="comment__body">
          <span className="comment__head">
            <Link to={profilePath(comment.author.handle)} className="comment__name">
              <strong dir="auto">{comment.author.name}</strong>
            </Link>{" "}
            <UserBadges badges={comment.author.badges} size={14} handle={comment.author.handle} />{" "}
            · {formatTimeAgo(comment.createdAt, language)}
          </span>
          {/* اسم الشخص الذي نرد عليه */}
          {comment.replyTo && (
            <span className="comment__reply-to">
              {t("studyApp.comments.replyTo")}{" "}
              <Link to={profilePath(comment.replyTo)} className="comment__mention">
                <bdi>@{comment.replyTo}</bdi>
              </Link>
            </span>
          )}
          <p>{comment.text}</p>
        </div>

        <div className="comment__actions">
          <button
            type="button"
            className={`comment__action comment__action--like ${comment.isLiked ? "is-liked" : ""}`}
            aria-pressed={comment.isLiked}
            aria-label={t("studyApp.post.like")}
            onClick={() => onLike(comment.id)}
          >
            <Icon name="heart" size={14} />
            {comment.likes > 0 && <span key={comment.likes}>{formatCount(comment.likes, language)}</span>}
          </button>

          <button type="button" className="comment__action" onClick={() => onReply(comment)}>
            {t("studyApp.comments.reply")}
          </button>

          {comment.isMine ? (
            <button type="button" className="comment__action is-danger" onClick={() => onDelete(comment.id)}>
              {t("studyApp.comments.delete")}
            </button>
          ) : (
            <button
              type="button"
              className="comment__action"
              disabled={comment.isReported}
              onClick={() => onReport(comment.id)}
            >
              {comment.isReported ? t("studyApp.comments.reported") : t("studyApp.comments.report")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * قائمة التعليقات مع الردود (مستوى واحد تحت كل تعليق) ونموذج الكتابة.
 * onSubmit(text, reply): reply = { parentId, handle } عند الرد
 */
function Comments({ comments, onSubmit, onLike, onReport, onDelete }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const inputRef = useRef(null);

  const topLevel = comments.filter((comment) => !comment.parentId);
  const repliesOf = (id) => comments.filter((comment) => comment.parentId === id);

  // الرد على رد يبقى تحت التعليق الأصلي نفسه
  function handleReply(comment) {
    setReplyTarget({ parentId: comment.parentId ?? comment.id, handle: comment.author.handle });
    inputRef.current.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (text.trim() === "") return;

    onSubmit(text.trim(), replyTarget);
    setText("");
    setReplyTarget(null);
  }

  const commentProps = { onLike, onReply: handleReply, onReport, onDelete };

  return (
    <div className="comments">
      {topLevel.map((comment) => (
        <div key={comment.id} className="comments__thread">
          <Comment comment={comment} {...commentProps} />
          {repliesOf(comment.id).map((reply) => (
            <Comment key={reply.id} comment={reply} isReply {...commentProps} />
          ))}
        </div>
      ))}

      {/* شريط "ترد على @..." */}
      {replyTarget && (
        <div className="comments__replying">
          <span>
            {t("studyApp.comments.replyingTo")}{" "}
            <bdi>@{replyTarget.handle}</bdi>
          </span>
          <button type="button" aria-label={t("studyApp.comments.cancelReply")} onClick={() => setReplyTarget(null)}>
            <Icon name="x" size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <form className="comments__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          maxLength={200}
          placeholder={t(replyTarget ? "studyApp.comments.replyPlaceholder" : "studyApp.post.commentPlaceholder")}
          aria-label={t("studyApp.post.commentPlaceholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" aria-label={t("studyApp.post.send")} disabled={text.trim() === ""}>
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}

export default Comments;