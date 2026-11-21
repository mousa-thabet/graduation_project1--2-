import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import ReportDialog from "../../../components/ReportDialog/ReportDialog.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import { GENERAL_ID, communityPath, findCommunity, localName } from "../../../data/communities.js";
import { communityProfilePath } from "../../../data/communityPeople.js";
import { searchPath } from "../../../utils/communitySearch.js";
import { formatCount, splitPostText } from "../../../utils/format.js";

// النبذة: الوسوم تفتح بحث التواصل، والإشارات تفتح حساب الشخص في التواصل
function RichText({ text }) {
  return splitPostText(text).map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <Link key={index} to={searchPath(part)} dir="auto" className="profile__tag">
          {part}
        </Link>
      );
    }

    if (part.startsWith("@")) {
      return (
        <Link key={index} to={communityProfilePath(part.slice(1))} dir="ltr" className="profile__tag">
          {part}
        </Link>
      );
    }

    return part;
  });
}

// "https://github.com/omar" ← "github.com/omar"
function shortUrl(url) {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname === "/" ? "" : pathname}`;
  } catch {
    return url;
  }
}

/**
 * رأس حساب التواصل: الغلاف، الصورة، الاسم والشارات، التخصص، النبذة، المعلومات،
 * العدّادات (يتابع، المتابعون، المنشورات، الإجابات)، والمسارات التي هو فيها.
 * person: صاحب الحساب  •  isMe: حسابي  •  counts: { following, followers, posts, answers }
 */
function CommunityProfileHeader({ person, isMe, counts, isFollowed, onToggleFollow, onEdit }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  const joined = new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(person.joinedAt);
  const basePath = communityProfilePath(person.handle);
  // مساراته بترتيب انضمامه، ولون أول مسار تخصصي (غير العام) للغلاف الافتراضي
  const tracks = person.communities.map(findCommunity).filter(Boolean);
  const mainTrack = tracks.find((community) => community.id !== GENERAL_ID) ?? tracks[0];
  const mainColor = mainTrack?.color ?? "var(--color-primary)";

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

  function copyLink() {
    setIsMenuOpen(false);
    navigator.clipboard
      .writeText(`${window.location.origin}${basePath}`)
      .then(() => setToast(t("studyApp.profile.linkCopied")))
      .catch(() => setToast(t("studyApp.post.copyFailed")));
  }

  function handleReport() {
    setIsReporting(false);
    setToast(t("studyApp.profile.reported"));
  }

  return (
    <section className="profile community-profile" style={{ "--track": mainColor }}>
      {/* الغلاف: صورة مرفوعة أو تدرّج بلون مساره الأول */}
      <div className={`profile__cover ${person.cover ? "" : "community-profile__cover"}`}>
        {person.cover && <img src={person.cover} alt="" />}
      </div>

      <div className="profile__top">
        <span className="profile__avatar">
          <Avatar person={person} />
        </span>

        <div className="profile__actions">
          {isMe ? (
            <button type="button" className="profile__button" onClick={onEdit}>
              {t("studyApp.profile.edit")}
            </button>
          ) : (
            <>
              {/* قائمة ⋯: نسخ الرابط والإبلاغ */}
              <div className="profile__menu" ref={menuRef}>
                <button
                  type="button"
                  className="profile__icon-button"
                  aria-label={t("studyApp.profile.more")}
                  title={t("studyApp.profile.more")}
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                >
                  <Icon name="more" size={18} />
                </button>

                {isMenuOpen && (
                  <div className="profile__menu-list" role="menu">
                    <button type="button" role="menuitem" className="profile__menu-item" onClick={copyLink}>
                      <Icon name="link" size={16} />
                      {t("studyApp.profile.copyLink")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="profile__menu-item is-danger"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsReporting(true);
                      }}
                    >
                      <Icon name="flag" size={16} />
                      {t("studyApp.profile.report")}
                    </button>
                  </div>
                )}
              </div>

              {/* زر المتابعة: "تتابعه" يصير "إلغاء المتابعة" عند المرور عليه */}
              <button
                type="button"
                className={`profile__follow ${isFollowed ? "is-following" : ""}`}
                aria-pressed={isFollowed}
                onClick={onToggleFollow}
              >
                <span className="profile__follow-text">
                  {isFollowed ? t("studyApp.profile.following") : t("studyApp.profile.follow")}
                </span>
                {isFollowed && <span className="profile__follow-hover">{t("studyApp.profile.unfollow")}</span>}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile__info">
        <h2 className="profile__name">
          <bdi>{person.name}</bdi>
          <UserBadges badges={person.badges} size={20} handle={person.handle} />
        </h2>

        <div className="profile__handle-row">
          <span className="profile__handle" dir="ltr">
            @{person.handle}
          </span>
          {person.followsMe && <span className="profile__badge">{t("studyApp.profile.followsYou")}</span>}
        </div>

        {/* التخصص (مثل LinkedIn) */}
        {person.headline && (
          <p className="community-profile__headline" dir="auto">
            {person.headline}
          </p>
        )}

        {person.bio && (
          <p className="profile__bio">
            <RichText text={person.bio} />
          </p>
        )}

        {/* المعلومات: الجامعة، الموقع، وتاريخ الانضمام للتواصل */}
        <ul className="profile__meta">
          {person.university && (
            <li>
              <Icon name="graduation" size={16} />
              <bdi>{person.university}</bdi>
            </li>
          )}
          {person.website && (
            <li>
              <Icon name="link" size={16} />
              <a href={person.website} target="_blank" rel="noopener noreferrer" dir="ltr" className="profile__link">
                {shortUrl(person.website)}
              </a>
            </li>
          )}
          <li>
            <Icon name="calendar" size={16} />
            {t("community.profile.joined", { date: joined })}
          </li>
        </ul>

        {/* العدّادات: يتابع والمتابعون يفتحان القائمة */}
        <div className="profile__counts">
          <Link to={`${basePath}/following`}>
            <strong>{formatCount(counts.following, language)}</strong> {t("studyApp.profile.followingLabel")}
          </Link>
          <Link to={`${basePath}/followers`}>
            <strong>{formatCount(counts.followers, language)}</strong> {t("studyApp.profile.followersLabel")}
          </Link>
          <span>
            <strong>{formatCount(counts.posts, language)}</strong> {t("community.profile.postsLabel")}
          </span>
          <span>
            <strong>{formatCount(counts.answers, language)}</strong> {t("community.profile.answersLabel")}
          </span>
        </div>

        {/* مساراته: كل مسار يفتح صفحته */}
        {tracks.length > 0 && (
          <div className="community-profile__tracks">
            {tracks.map((community) => (
              <Link
                key={community.id}
                to={communityPath(community.id)}
                className="community-profile__track"
                style={{ "--track": community.color }}
              >
                <CommunityIcon name={community.id} size={14} />
                {localName(community, language)}
              </Link>
            ))}
          </div>
        )}
      </div>

      {isReporting && <ReportDialog onSubmit={handleReport} onClose={() => setIsReporting(false)} />}

      {toast && (
        <div className="post-toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </section>
  );
}

export default CommunityProfileHeader;