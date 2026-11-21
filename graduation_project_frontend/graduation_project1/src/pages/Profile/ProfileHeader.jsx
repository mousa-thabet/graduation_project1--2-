import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import Avatar from "../../components/Avatar/Avatar.jsx";
import ReportDialog from "../../components/ReportDialog/ReportDialog.jsx";
import { profilePath } from "../../data/studyPeople.js";
import { formatCount, splitPostText } from "../../utils/format.js";

// النبذة: الوسوم تفتح البحث، والإشارات تفتح حساب الشخص
function RichText({ text }) {
  return splitPostText(text).map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <Link key={index} to={`/study/search?q=${encodeURIComponent(part)}`} dir="auto" className="profile__tag">
          {part}
        </Link>
      );
    }

    if (part.startsWith("@")) {
      return (
        <Link key={index} to={profilePath(part.slice(1))} dir="ltr" className="profile__tag">
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

// الدراسة: دقائق إن كانت أقل من ساعة، وإلا ساعات
function useStudyTime(minutes) {
  const { t } = useTranslation();
  return minutes < 60
    ? t("studyApp.session.minutes", { count: minutes })
    : t("studyApp.profile.hours", { count: Math.floor(minutes / 60) });
}

/**
 * رأس صفحة الحساب: الغلاف والصورة، الاسم والتوثيق، النبذة والمعلومات،
 * العدّادات (يتابع، المتابعون، المنشورات) وإحصائيات الدراسة، وأزرار التعديل أو المتابعة.
 * person: صاحب الحساب  •  isMe: حسابي  •  counts: { following, followers, posts }
 */
function ProfileHeader({ person, isMe, counts, isFollowed, onToggleFollow, onEdit }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);
  const studyTime = useStudyTime(person.studyMinutes);

  const joined = new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(person.joinedAt);
  const basePath = `/profile/${person.handle}`;

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
      .writeText(`${window.location.origin}${profilePath(person.handle)}`)
      .then(() => setToast(t("studyApp.profile.linkCopied")))
      .catch(() => setToast(t("studyApp.post.copyFailed")));
  }

  function handleReport() {
    setIsReporting(false);
    setToast(t("studyApp.profile.reported"));
  }

  return (
    <section className="profile">
      {/* الغلاف: صورة مرفوعة أو تدرّج من ألوان القالب */}
      <div className={`profile__cover ${person.cover ? "" : "profile__cover--default"}`}>
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
          {person.verified && (
            <span
              className="profile__verified"
              role="img"
              aria-label={t("studyApp.profile.verified")}
              title={t("studyApp.profile.verified")}
            >
              <Icon name="verified" size={20} strokeWidth={2.2} />
            </span>
          )}
        </h2>

        <div className="profile__handle-row">
          <span className="profile__handle" dir="ltr">
            @{person.handle}
          </span>
          {person.followsMe && <span className="profile__badge">{t("studyApp.profile.followsYou")}</span>}
        </div>

        {person.bio && (
          <p className="profile__bio">
            <RichText text={person.bio} />
          </p>
        )}

        {/* المعلومات: الجامعة، المكان، الموقع، وتاريخ الانضمام */}
        <ul className="profile__meta">
          {person.university && (
            <li>
              <Icon name="graduation" size={16} />
              <bdi>{person.university}</bdi>
            </li>
          )}
          {person.location && (
            <li>
              <Icon name="mapPin" size={16} />
              <bdi>{person.location}</bdi>
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
            {t("studyApp.profile.joined", { date: joined })}
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
          <span>{t("studyApp.aside.postsCount", { count: counts.posts })}</span>
        </div>

        {/* إحصائيات الدراسة من جلستي */}
        <div className="profile__stats">
          <span className="profile__stat">
            <span aria-hidden="true">🔥</span>
            {t("studyApp.profile.streak", { count: person.streak })}
          </span>
          <span className="profile__stat">
            <Icon name="timer" size={16} />
            {t("studyApp.profile.studied", { time: studyTime })}
          </span>
        </div>
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

export default ProfileHeader;