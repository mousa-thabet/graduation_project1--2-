import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import Icon from "../../../../components/Icon/Icon.jsx";
import ReportDialog from "../../../../components/ReportDialog/ReportDialog.jsx";
import BlockedNotice from "../../../../components/BlockedNotice/BlockedNotice.jsx";
import Lightbox from "../../../../components/Lightbox/Lightbox.jsx";
import AudioPlayer from "../../../../components/AudioPlayer/AudioPlayer.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";
import { UserBadges } from "../../../../components/UserBadge/UserBadge.jsx";
import Comments from "./Comments/Comments.jsx";
import Poll from "./Poll/Poll.jsx";
import { MAX_POST_LENGTH, REPORT_LIMIT } from "../../../../data/studyPosts.js";
import { useProfilePath } from "../../../../hooks/useProfilePath.js";
import { formatCount, formatTimeAgo, splitPostText } from "../../../../utils/format.js";
import "./PostCard.css";

// نص المنشور: الوسوم أزرار، والإشارات (@حساب) روابط لحساب الشخص
function PostText({ text, onTagClick }) {
  const profilePath = useProfilePath();

  return (
    <p className="post__text">
      {splitPostText(text).map((part, index) => {
        if (part.startsWith("#")) {
          return (
            <button
              key={index}
              type="button"
              dir="auto"
              className="post__hashtag"
              onClick={() => onTagClick(part.slice(1))}
            >
              {part}
            </button>
          );
        }

        if (part.startsWith("@")) {
          return (
            <Link key={index} to={profilePath(part.slice(1))} dir="ltr" className="post__mention">
              {part}
            </Link>
          );
        }

        return part;
      })}
    </p>
  );
}

// المدة التي ننتظرها لنعرف هل الضغط مفرد أم مزدوج
const DOUBLE_CLICK_DELAY = 250;

// الصورة: ضغطة تكبّرها، وضغطتان تعجب بالمنشور (مثل إنستغرام)
function PostImage({ src, burstKey, onZoom, onDoubleLike }) {
  const { t } = useTranslation();
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleClick() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onZoom, DOUBLE_CLICK_DELAY);
  }

  function handleDoubleClick() {
    clearTimeout(timerRef.current);
    onDoubleLike();
  }

  return (
    <button
      type="button"
      className="post__media-button"
      aria-label={t("studyApp.post.zoom")}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <img className="post__media" src={src} alt="" loading="lazy" />

      {/* قلب كبير يظهر عند الضغط المزدوج (key جديد يعيد الحركة) */}
      {burstKey > 0 && (
        <span key={burstKey} className="post__heart-burst" aria-hidden="true">
          <Icon name="heart" size={88} strokeWidth={1.5} />
        </span>
      )}
    </button>
  );
}

// الصورة أو الفيديو أو الصوت المرفق
function PostMedia({ media, ...imageProps }) {
  // الملف ما زال يُقرأ من IndexedDB
  if (!media.src) return <div className="post__media post__media--loading" />;

  if (media.type === "image") return <PostImage src={media.src} {...imageProps} />;

  if (media.type === "video") {
    return <video className="post__media" src={media.src} autoPlay muted loop playsInline controls />;
  }

  return <AudioPlayer src={media.src} title={media.name} />;
}

// نموذج تعديل نص المنشور
function EditForm({ initialText, canBeEmpty, onSave, onCancel }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  const remaining = MAX_POST_LENGTH - text.length;
  const canSave = (text.trim() !== "" || canBeEmpty) && remaining >= 0 && text.trim() !== initialText;

  // مربع النص يكبر مع الكتابة
  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [text]);

  // المؤشر في نهاية النص عند الفتح
  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (canSave) onSave(text.trim());
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") onCancel();
  }

  return (
    <form className="post__edit" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        aria-label={t("studyApp.post.edit")}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="post__edit-bar">
        <span className={`post__edit-count ${remaining < 20 ? "is-warning" : ""} ${remaining < 0 ? "is-over" : ""}`}>
          {remaining}
        </span>
        <button type="button" className="post__edit-cancel" onClick={onCancel}>
          {t("studyApp.post.cancel")}
        </button>
        <button type="submit" className="post__edit-save" disabled={!canSave}>
          {t("studyApp.post.save")}
        </button>
      </div>
    </form>
  );
}

// العناصر التي لها عمل خاص، فالضغط عليها لا يفتح المنشور
const INTERACTIVE = "button, a, input, textarea, video, audio, form, [role='menu'], [role='slider']";

/**
 * منشور واحد: الكاتب، النص، الاستطلاع، المرفق، الإعجاب، الحفظ، المشاركة، التعليقات، والقائمة.
 * actions: دوال useStudyPosts (إعجاب، تعليق، تعديل، حذف، إبلاغ...)
 * isDetail: المنشور معروض في صفحته الخاصة (التعليقات مفتوحة ولا ينتقل عند الضغط).
 * isPinned: المنشور مثبّت (يظهر فوقه "منشور مثبّت" في صفحة الحساب).
 * basePath: القسم الذي يُفتح فيه المنشور ("/study" أو "/community")
 * meta: سطر إضافي تحت اسم الكاتب (مثل: من أين المنشور في قسم التواصل) — اختياري
 * شارات الكاتب (post.author.badges) تظهر بجانب اسمه إن وُجدت، والضغط عليها بيفتح صفحة خبراته.
 * الأدمن (actions.isAdmin، بالتواصل): بالقائمة "احجب المنشور" بدل الإبلاغ.
 * المنشور المحجوب (post.isBlocked): شريط فوقه، وصاحبه بيقدر يطلب مراجعة.
 */
function PostCard({
  post,
  actions,
  onTagClick,
  isDetail = false,
  isPinned = false,
  basePath = "/study",
  meta,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // رابط حساب الكاتب داخل القسم المفتوح (ادرس معي أو التواصل)
  const profilePath = useProfilePath();
  const language = i18n.resolvedLanguage;

  const [showComments, setShowComments] = useState(isDetail);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  // reportTarget: { type: "post" } أو { type: "comment", id }
  const [reportTarget, setReportTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [heartBurst, setHeartBurst] = useState(0);
  const menuRef = useRef(null);

  const isUnderReview = post.reports >= REPORT_LIMIT;

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClick(event) {
      if (!menuRef.current.contains(event.target)) setIsMenuOpen(false);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isMenuOpen]);

  // إخفاء الرسالة الصغيرة بعد ثانيتين
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  // نسخ رابط المنشور
  function handleShare() {
    const url = `${window.location.origin}${basePath}/post/${post.id}`;

    navigator.clipboard
      .writeText(url)
      .then(() => setToast(t("studyApp.post.linkCopied")))
      .catch(() => setToast(t("studyApp.post.copyFailed")));
  }

  function handleSave() {
    actions.toggleSave(post.id);
    setToast(t(post.isSaved ? "studyApp.post.unsaved" : "studyApp.post.saved"));
  }

  // الضغط المزدوج يعجب فقط (لا يلغي الإعجاب)
  function handleDoubleLike() {
    if (!post.isLiked) actions.toggleLike(post.id);
    setHeartBurst((count) => count + 1);
  }

  function handleSaveEdit(text) {
    actions.editPost(post.id, text);
    setIsEditing(false);
  }

  // reason: سبب البلاغ (بالتواصل بيوصل للأدمن مع البلاغ)
  function handleReport(reason) {
    if (reportTarget.type === "post") actions.report(post.id, reason);
    else actions.reportComment(reportTarget.id);

    setReportTarget(null);
  }

  // الضغط على المنشور يفتح صفحته (مثل X)
  function handleOpen(event) {
    if (isDetail || isEditing || event.target.closest(INTERACTIVE)) return;
    navigate(`${basePath}/post/${post.id}`);
  }

  const minutes = post.achievement?.minutes ?? 0;
  const authorPath = profilePath(post.author.handle);
  // التثبيت في حسابي متاح لمنشوراتي فقط
  const canPin = post.isMine && actions.togglePin;
  const isPinnedInProfile = actions.pinnedPostId === post.id;

  // الأدمن: حجب المنشور أو إلغاء حجبه
  function handleToggleBlock() {
    setIsMenuOpen(false);
    actions.toggleBlock(post);
    setToast(t(post.isBlocked ? "moderation.unblockedToast" : "moderation.blockedToast"));
  }

  return (
    <>
      <article
        className={`post ${post.kind === "achievement" ? "post--achievement" : ""} ${isDetail ? "post--detail" : ""}`}
        onClick={handleOpen}
      >
        {/* الصورة تفتح حساب الكاتب (tabIndex=-1 لأن الاسم يفتحه أيضًا) */}
        <Link to={authorPath} className="post__avatar" tabIndex={-1} aria-hidden="true">
          <Avatar person={post.author} />
        </Link>

        <div className="post__body">
          {isPinned && (
            <span className="post__pinned">
              <Icon name="pin" size={14} strokeWidth={2.5} />
              {t("studyApp.profile.pinned")}
            </span>
          )}

          {/* الكاتب والوقت والقائمة */}
          <header className="post__head">
            <Link to={authorPath} className="post__name" dir="auto">
              {post.author.name}
            </Link>
            <UserBadges badges={post.author.badges} handle={post.author.handle} />
            <span className="post__handle" dir="ltr">
              @{post.author.handle}
            </span>
            <span className="post__time">· {formatTimeAgo(post.createdAt, language)}</span>
            {post.editedAt && <span className="post__edited">· {t("studyApp.post.edited")}</span>}

            <div className="post__menu" ref={menuRef}>
              <button
                type="button"
                className="post__menu-button"
                aria-label={t("studyApp.post.options")}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              >
                <Icon name="more" size={18} />
              </button>

              {isMenuOpen && (
                <div className="post__menu-list" role="menu">
                  {actions.isAdmin ? (
                    // الأدمن: حجب بدل الإبلاغ
                    <button
                      type="button"
                      role="menuitem"
                      className={`post__menu-item ${post.isBlocked ? "" : "is-danger"}`}
                      onClick={handleToggleBlock}
                    >
                      <Icon name={post.isBlocked ? "eye" : "eyeOff"} size={16} />
                      {post.isBlocked ? t("moderation.unblock") : t("moderation.block")}
                    </button>
                  ) : post.isMine ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        className="post__menu-item"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditing(true);
                        }}
                      >
                        <Icon name="feather" size={16} />
                        {t("studyApp.post.edit")}
                      </button>
                      {canPin && (
                        <button
                          type="button"
                          role="menuitem"
                          className="post__menu-item"
                          onClick={() => {
                            setIsMenuOpen(false);
                            actions.togglePin(post.id);
                            setToast(t(isPinnedInProfile ? "studyApp.profile.unpinned" : "studyApp.profile.pinnedToast"));
                          }}
                        >
                          <Icon name="pin" size={16} />
                          {isPinnedInProfile ? t("studyApp.profile.unpin") : t("studyApp.profile.pin")}
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        className="post__menu-item is-danger"
                        onClick={() => actions.deletePost(post.id)}
                      >
                        <Icon name="trash" size={16} />
                        {t("studyApp.post.delete")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="post__menu-item is-danger"
                      disabled={post.isReported}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setReportTarget({ type: "post" });
                      }}
                    >
                      <Icon name="flag" size={16} />
                      {post.isReported ? t("studyApp.post.reported") : t("studyApp.post.report")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {meta}

          {/* محجوب من الإدارة: بيشوفه الأدمن وصاحبه بس */}
          {post.isBlocked && <BlockedNotice post={post} actions={actions} />}

          {/* المنشور المخفي بسبب البلاغات */}
          {isUnderReview && !showAnyway ? (
            <div className="post__review">
              <Icon name="flag" size={16} />
              <span>{t("studyApp.post.underReview")}</span>
              <button type="button" onClick={() => setShowAnyway(true)}>
                {t("studyApp.post.showAnyway")}
              </button>
            </div>
          ) : (
            <>
              {isEditing ? (
                <EditForm
                  initialText={post.text}
                  canBeEmpty={Boolean(post.media)}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                post.text && <PostText text={post.text} onTagClick={onTagClick} />
              )}

              {/* بطاقة الإنجاز */}
              {post.achievement && (
                <div className="post__achievement">
                  <span className="post__achievement-icon">
                    <Icon name="timer" size={22} />
                  </span>
                  <div>
                    <strong>
                      {t("studyApp.post.studied", {
                        hours: Math.floor(minutes / 60),
                        minutes: minutes % 60,
                      })}
                    </strong>
                    <span>{post.achievement.task}</span>
                  </div>
                  <span className="post__streak">🔥 {post.achievement.streak}</span>
                </div>
              )}

              {post.poll && (
                <Poll poll={post.poll} showResults={post.isMine} onVote={(optionId) => actions.vote(post.id, optionId)} />
              )}

              {post.media && (
                <PostMedia
                  media={post.media}
                  burstKey={heartBurst}
                  onZoom={() => setIsZoomed(true)}
                  onDoubleLike={handleDoubleLike}
                />
              )}
            </>
          )}

          {/* الأزرار */}
          <div className="post__actions">
            <button
              type="button"
              className={`post__action post__action--comment ${showComments ? "is-open" : ""}`}
              aria-expanded={showComments}
              aria-label={t("studyApp.post.comments")}
              onClick={() => setShowComments((isOpen) => !isOpen)}
            >
              <Icon name="comment" size={18} />
              <span>{formatCount(post.comments.length, language)}</span>
            </button>

            <button
              type="button"
              className={`post__action post__action--like ${post.isLiked ? "is-liked" : ""}`}
              aria-pressed={post.isLiked}
              aria-label={t("studyApp.post.like")}
              onClick={() => actions.toggleLike(post.id)}
            >
              <Icon name="heart" size={18} />
              <span key={post.likes}>{formatCount(post.likes, language)}</span>
            </button>

            <button
              type="button"
              className={`post__action post__action--save ${post.isSaved ? "is-saved" : ""}`}
              aria-pressed={post.isSaved}
              aria-label={t("studyApp.post.save")}
              title={t("studyApp.post.save")}
              onClick={handleSave}
            >
              <Icon name="bookmark" size={18} />
            </button>

            <button
              type="button"
              className="post__action post__action--share"
              aria-label={t("studyApp.post.share")}
              title={t("studyApp.post.share")}
              onClick={handleShare}
            >
              <Icon name="upload" size={18} />
            </button>
          </div>

          {/* التعليقات */}
          {showComments && (
            <Comments
              comments={post.comments}
              onSubmit={(text, reply) => actions.addComment(post.id, text, reply)}
              onLike={actions.toggleCommentLike}
              onReport={(id) => setReportTarget({ type: "comment", id })}
              onDelete={(id) => actions.deleteComment(post.id, id)}
            />
          )}
        </div>
      </article>

      {/* النوافذ خارج المنشور حتى لا يفتح الضغطُ عليها صفحةَ المنشور */}
      {reportTarget && <ReportDialog onSubmit={handleReport} onClose={() => setReportTarget(null)} />}
      {isZoomed && <Lightbox src={post.media.src} onClose={() => setIsZoomed(false)} />}

      {toast && (
        <div className="post-toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </>
  );
}

export default PostCard;