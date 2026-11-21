import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router";
import Logo from "../../../components/Logo/Logo.jsx";
import Icon from "../../../components/Icon/Icon.jsx";
import LanguageToggle from "../../../components/LanguageToggle/LanguageToggle.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import { useAdminSession } from "../../../hooks/useAdmin.js";
import { useAuth } from "../../../hooks/useAuth.js";
import "./StudySidebar.css";

const SECTIONS = [
  { id: "social", icon: "message", href: "/community" },
  { id: "study", icon: "headphones", href: "/study" },
  { id: "plan", icon: "calendar", href: "/plan" },
];

// الإشعارات آخر القائمة (قبل حسابي)، بنفس مكانها بقائمة التواصل
const NAV_ITEMS = [
  { id: "posts", icon: "home", to: "/study", end: true },
  { id: "streams", icon: "radio", to: "/study/streams" },
  { id: "session", icon: "timer", to: "/study/session" },
  { id: "history", icon: "history", to: "/study/history" },
  { id: "library", icon: "book", to: "/study/library" },
  { id: "notifications", icon: "bell", to: "/notifications" },
];

const navClass = ({ isActive }) =>
  `study-nav__link ${isActive ? "is-active" : ""}`;

function UnreadBadge({ count }) {
  if (count === 0) return null;

  return (
    <span
      key={count}
      className="study-nav__badge"
      aria-hidden="true"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function useNotificationsLabel(count) {
  const { t } = useTranslation();
  const label = t("studyApp.nav.notifications");

  return count > 0
    ? `${label} (${t("studyApp.nav.unread", { count })})`
    : label;
}

export function NotificationsButton({
  unreadCount,
  to = "/notifications",
}) {
  const label = useNotificationsLabel(unreadCount);

  return (
    <NavLink
      to={to}
      className="study-sidebar__tool"
      aria-label={label}
      title={label}
    >
      <span className="study-nav__icon">
        <Icon name="bell" size={22} />
        <UnreadBadge count={unreadCount} />
      </span>
    </NavLink>
  );
}

export function SectionSwitcher({ current = "study" }) {
  const { t } = useTranslation();

  return (
    <nav
      className="study-sections"
      aria-label={t("studyApp.sections.label")}
    >
      {SECTIONS.map((section) => {
        const isCurrent = section.id === current;

        return (
          <Link
            key={section.id}
            to={section.href}
            className={`study-sections__link ${
              isCurrent ? "is-current" : ""
            }`}
            aria-current={isCurrent ? "page" : undefined}
            title={t(`studyApp.sections.${section.id}`)}
          >
            <Icon name={section.icon} size={18} />
            <span>
              {t(`studyApp.sections.${section.id}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ThemeButton({ isDark, toggleTheme }) {
  const { t } = useTranslation();

  const label = isDark
    ? t("studyApp.theme.toLight")
    : t("studyApp.theme.toDark");

  return (
    <button
      type="button"
      className="study-sidebar__tool"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      <Icon name={isDark ? "sun" : "moon"} size={22} />
      <span className="study-nav__text">{label}</span>
    </button>
  );
}

export function LogoutButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const label = t("actions.logout");

  return (
    <button
      type="button"
      className="study-sidebar__tool"
      aria-label={label}
      title={label}
      onClick={logout}
    >
      <Icon name="logOut" size={22} />
      <span className="study-nav__text">{label}</span>
    </button>
  );
}

function StudySidebar({
  isDark,
  toggleTheme,
  me,
  unreadCount,
  navItems = NAV_ITEMS,
  section = "study",
  composeTo = "/study",
  profileTo = "/profile",
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notificationsLabel =
    useNotificationsLabel(unreadCount);
  const { isAdmin } = useAdminSession();

  function openComposer() {
    navigate(composeTo, {
      state: { compose: true },
    });
  }

  return (
    <header className="study-sidebar">
      <div className="study-sidebar__top">
        <Logo />
        <SectionSwitcher current={section} />
      </div>

      <nav
        className="study-nav"
        aria-label={t("studyApp.nav.label")}
      >
        {navItems.map((item) => {
          const isNotifications =
            item.id === "notifications";

          const label = t(
            item.label ?? `studyApp.nav.${item.id}`
          );

          const ItemIcon = item.IconComponent ?? Icon;

          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              className={(state) =>
                `${navClass(state)} study-nav__link--${
                  item.id
                } ${
                  item.isDesktopOnly
                    ? "is-desktop-only"
                    : ""
                }`
              }
              title={label}
              aria-label={
                isNotifications
                  ? notificationsLabel
                  : undefined
              }
            >
              <span className="study-nav__icon">
                <ItemIcon
                  name={item.icon}
                  size={24}
                />

                {isNotifications && (
                  <UnreadBadge count={unreadCount} />
                )}
              </span>

              <span className="study-nav__text">
                {label}
              </span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={(state) =>
              `${navClass(
                state
              )} study-nav__link--admin is-desktop-only`
            }
            title={t("admin.tag")}
          >
            <span className="study-nav__icon">
              <Icon name="shield" size={24} />
            </span>

            <span className="study-nav__text">
              {t("admin.tag")}
            </span>
          </NavLink>
        )}

        <NavLink
          to={profileTo}
          end
          className={(state) =>
            `${navClass(state)} study-nav__profile`
          }
          title={t("studyApp.nav.profile")}
        >
          <span className="study-nav__icon">
            <Icon name="user" size={24} />
          </span>

          <span className="study-nav__text">
            {t("studyApp.nav.profile")}
          </span>
        </NavLink>
      </nav>

      <button
        type="button"
        className="study-post-button"
        aria-label={t("studyApp.composer.post")}
        onClick={openComposer}
      >
        <Icon name="feather" size={22} />
        <span className="study-nav__text">
          {t("studyApp.composer.post")}
        </span>
      </button>

      <div className="study-sidebar__bottom">
        <div className="study-sidebar__tools">
          <ThemeButton
            isDark={isDark}
            toggleTheme={toggleTheme}
          />

          <LanguageToggle />
        </div>

        <NavLink
          to={profileTo}
          end
          className="study-account"
          title={t("studyApp.nav.profile")}
        >
          <span
            className="study-account__avatar"
            aria-hidden="true"
          >
            <Avatar person={me} />
          </span>

          <span className="study-account__text">
            <strong dir="auto">{me.name}</strong>
            <span dir="ltr">@{me.handle}</span>
          </span>
        </NavLink>

        <LogoutButton />
      </div>
    </header>
  );
}

export default StudySidebar;