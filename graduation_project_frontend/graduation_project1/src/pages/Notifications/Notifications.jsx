import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import StudyHeader from "../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../Study/EmptyState/EmptyState.jsx";
import { formatTimeAgo } from "../../utils/format.js";
import "./Notifications.css";

// التبويبات: الكل أو قسم واحد
const TABS = ["all", "social", "study", "plan"];

// اسم التبويب: أسماء الأقسام موجودة في studyApp.sections
const tabLabel = (tab) => (tab === "social" ? "studyApp.sections.social" : `studyApp.notifications.tabs.${tab}`);

// أيقونة كل نوع إشعار
const TYPE_ICONS = {
  like: "heart",
  follow: "users",
  mention: "atSign",
  live: "radio",
  plan: "calendar",
  soundApproved: "music",
  soundRejected: "music",
  sceneApproved: "image",
  sceneRejected: "image",
  badgeApproved: "shield",
  badgeRejected: "shield",
  branchApproved: "plus",
  branchRejected: "plus",
  communityLive: "radio",
  newExam: "checkSquare",
  newCourse: "graduation",
  reportReviewed: "flag",
};

// إلى أين يأخذنا الضغط على الإشعار
// link: رابط جاهز يرسله القسم مع الإشعار (مثل منشور في التواصل)
function getLink(notification) {
  if (notification.link) return notification.link;

  switch (notification.type) {
    case "like":
    case "mention":
      return `/study/post/${notification.postId}`;
    case "follow":
      return `/study/search?q=${encodeURIComponent(`@${notification.actor.handle}`)}`;
    // البث نفسه (وإن كان انتهى تظهر صفحة "انتهى هذا البث")
    case "live":
      return notification.roomId ? `/study/streams/live/${notification.roomId}` : "/study/streams";
    // قرار الإدارة في صوت رفعته: يفتح أصواتي في المكتبة
    case "soundApproved":
    case "soundRejected":
      return "/study/library?tab=sounds";
    // قرار الإدارة في خلفية رفعتها: يفتح الخلفيات في المكتبة
    case "sceneApproved":
    case "sceneRejected":
      return "/study/library?tab=scenes";
    // قرار الإدارة في طلب شارة
    case "badgeApproved":
    case "badgeRejected":
      return "/community/badges";
    default:
      return "/plan";
  }
}

/**
 * إشعار واحد: أيقونة النوع، صاحب الإشعار، النص، وجزء من المنشور إن وجد.
 * postText: نص المنشور المرتبط (اختياري)
 */
function NotificationItem({ notification, postText, onOpen }) {
  const { i18n } = useTranslation();
  const { type, actor, isRead } = notification;

  return (
    <li>
      <Link
        to={getLink(notification)}
        className={`notification notification--${type} ${isRead ? "" : "is-unread"}`}
        onClick={() => onOpen(notification.id)}
      >
        <span className="notification__icon">
          <Icon name={TYPE_ICONS[type]} size={22} />
        </span>

        <span className="notification__body">
          {actor && (
            <span className="notification__avatar" aria-hidden="true">
              {actor.name.charAt(0)}
            </span>
          )}

          {/* Trans: نص مترجم بداخله وسوم: <b> للخط العريض، و<t> لعزل العنوان الإنجليزي عن العربي */}
          <span className="notification__text">
            {/* i18nKey: مفتاح ترجمة خاص يرسله القسم مع الإشعار (مثل إشعارات التواصل) */}
            <Trans
              i18nKey={notification.i18nKey ?? `studyApp.notifications.types.${type}`}
              values={{ name: actor?.name, title: notification.title, task: notification.task }}
              components={{ b: <strong dir="auto" />, t: <bdi /> }}
            />
          </span>

          {postText && <span className="notification__post">{postText}</span>}

          <span className="notification__time">{formatTimeAgo(notification.createdAt, i18n.resolvedLanguage)}</span>
        </span>

        {!isRead && <span className="notification__dot" aria-hidden="true" />}
      </Link>
    </li>
  );
}

/**
 * صفحة الإشعارات (مشتركة بين الأقسام): /notifications و /community/notifications
 */
function Notifications() {
  const { t } = useTranslation();
  const { notifications, feed } = useOutletContext();
  const [tab, setTab] = useState("all");

  const visible =
    tab === "all"
      ? notifications.notifications
      : notifications.notifications.filter((notification) => notification.section === tab);

  // نص المنشور المرتبط بالإشعار (إن كان موجودًا)
  function getPostText(postId) {
    return postId ? feed.posts.find((post) => post.id === postId)?.text : null;
  }

  return (
    <>
      <StudyHeader title={t("studyApp.nav.notifications")}>
        <div className="study-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => setTab(item)}
            >
              {t(tabLabel(item))}
            </button>
          ))}
        </div>
      </StudyHeader>

      {/* عدد غير المقروءة وزر تحديد الكل */}
      {notifications.unreadCount > 0 && (
        <div className="notifications-bar">
          <span>{t("studyApp.nav.unread", { count: notifications.unreadCount })}</span>
          <button type="button" onClick={notifications.markAllRead}>
            <Icon name="check" size={16} strokeWidth={2.5} />
            {t("studyApp.notifications.markAll")}
          </button>
        </div>
      )}

      {visible.length > 0 ? (
        <ul className="notifications">
          {visible.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              postText={getPostText(notification.postId)}
              onOpen={notifications.markRead}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="bell"
          title={t("studyApp.notifications.empty")}
          text={t("studyApp.notifications.emptyText")}
        />
      )}
    </>
  );
}

export default Notifications;