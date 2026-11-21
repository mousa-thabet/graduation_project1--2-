import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../Icon/Icon.jsx";
import "./BlockedNotice.css";

const MAX_NOTE = 300;

/**
 * شريط المنشور المحجوب (فوق المنشور):
 * - الأدمن: "محجوب" (ولو صاحبه طلب مراجعة: رابط لطلبات المراجعة)
 * - صاحب المنشور: "الإدارة حجبت منشورك" وزر "اطلب مراجعة" (مع رسالة اختيارية)،
 *   وبعدها حالة الطلب: بيستنى قرار، أو الإدارة قررت يضل محجوب
 * actions: isAdmin، appealFor(type, id)، requestReview(post, note)
 */
function BlockedNotice({ post, actions }) {
  const { t } = useTranslation();
  const [isWriting, setIsWriting] = useState(false);
  const [note, setNote] = useState("");
  const appeal = actions.appealFor?.("post", post.id);

  function handleSubmit(event) {
    event.preventDefault();
    actions.requestReview(post, note.trim());
    setIsWriting(false);
    setNote("");
  }

  if (actions.isAdmin) {
    return (
      <div className="blocked-notice is-admin" role="note">
        <Icon name="eyeOff" size={16} />
        <span>
          {t("moderation.notice.admin")}
          {appeal?.status === "pending" && ` ${t("moderation.notice.adminAppeal")}`}
        </span>
        {appeal?.status === "pending" && (
          <Link to="/admin/appeals" className="blocked-notice__link">
            {t("moderation.notice.openAppeals")}
          </Link>
        )}
      </div>
    );
  }

  // طلب مراجعة جديد: ما في طلب، أو آخر طلب انقبل وبعدين انحجب من جديد
  const canRequest = !appeal || appeal.status === "approved";

  return (
    <div className="blocked-notice" role="note">
      <Icon name="eyeOff" size={16} />
      <span>{t("moderation.notice.mine")}</span>

      {canRequest && !isWriting && (
        <button type="button" className="blocked-notice__button" onClick={() => setIsWriting(true)}>
          {t("moderation.notice.request")}
        </button>
      )}

      {appeal?.status === "pending" && (
        <p className="blocked-notice__status">
          <Icon name="clock" size={14} />
          {t("moderation.notice.pending")}
        </p>
      )}

      {appeal?.status === "rejected" && (
        <p className="blocked-notice__status is-rejected">
          <Icon name="x" size={14} />
          {t("moderation.notice.rejected")}
        </p>
      )}

      {/* رسالة للإدارة (اختيارية) */}
      {isWriting && (
        <form className="blocked-notice__form" onSubmit={handleSubmit}>
          <label>
            <span>{t("moderation.notice.note")}</span>
            <textarea
              dir="auto"
              rows={2}
              autoFocus
              maxLength={MAX_NOTE}
              value={note}
              placeholder={t("moderation.notice.notePlaceholder")}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="blocked-notice__actions">
            <button type="button" className="blocked-notice__cancel" onClick={() => setIsWriting(false)}>
              {t("moderation.notice.cancel")}
            </button>
            <button type="submit" className="blocked-notice__button">
              {t("moderation.notice.send")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BlockedNotice;