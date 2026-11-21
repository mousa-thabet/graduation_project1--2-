import {
  Link,
  NavLink,
  Navigate,
  Outlet,
} from "react-router";

import { useTranslation } from "react-i18next";

import Logo from "../../components/Logo/Logo.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import LanguageToggle from "../../components/LanguageToggle/LanguageToggle.jsx";

import {
  useAdminData,
  useAdminSession,
} from "../../hooks/useAdmin.js";

import { useAuth } from "../../hooks/useAuth.js";
import { useSoundRequests } from "../../hooks/useMySounds.js";
import { useSceneRequests } from "../../hooks/useMyScenes.js";

import "./AdminLayout.css";

// أقسام اللوحة (pendingKey: عدد اللي بيستنى قرار  •  label: مفتاح ترجمة خاص)
const NAV_ITEMS = [
  {
    id: "overview",
    to: "/admin",
    end: true,
    icon: "chart",
  },
  // تصفح المجتمعات كإدارة (بنفس التبويب حتى تضل جلسة الأدمن): بدل الإبلاغ في حجب
  {
    id: "browse",
    to: "/community",
    icon: "eye",
    label: "moderation.admin.navBrowse",
  },
  {
    id: "badges",
    to: "/admin/badges",
    icon: "shield",
    pendingKey: "badges",
  },
  {
    id: "branches",
    to: "/admin/branches",
    icon: "layers",
    pendingKey: "branches",
  },
  {
    id: "reports",
    to: "/admin/reports",
    icon: "flag",
    pendingKey: "reports",
  },
  // طلبات المراجعة: أصحاب المنشورات المحجوبة
  {
    id: "appeals",
    to: "/admin/appeals",
    icon: "message",
    pendingKey: "appeals",
    label: "moderation.admin.navAppeals",
  },
  // طلبات الرفع: أصوات وخلفيات الطلاب بقسم قبول ورفض لحاله
  {
    id: "requests",
    to: "/admin/requests",
    icon: "upload",
    pendingKey: "uploads",
    label: "uploads.admin.nav",
  },
  {
    id: "communities",
    to: "/admin/communities",
    icon: "users",
  },
  {
    id: "library",
    to: "/admin/library",
    icon: "music",
  },
];

function AdminLayout() {
  const { t } = useTranslation();

  const session = useAdminSession();
  const auth = useAuth();
  const admin = useAdminData();

  // طلبات رفع الطلاب (أصوات وخلفيات)
  const soundRequests = useSoundRequests();
  const sceneRequests = useSceneRequests();

  const pending = {
    ...admin.pending,
    uploads: [...soundRequests, ...sceneRequests].filter(
      (item) => item.status === "pending"
    ).length,
  };

  if (!session.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo />

          <span className="admin-sidebar__tag">
            {t("admin.tag")}
          </span>
        </div>

        <nav
          className="admin-nav"
          aria-label={t("admin.navLabel")}
        >
          {NAV_ITEMS.map((item) => {
            const count = item.pendingKey
              ? pending[item.pendingKey]
              : 0;

            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                className="admin-nav__link"
              >
                <Icon name={item.icon} size={20} />

                <span>
                  {t(item.label ?? `admin.nav.${item.id}`)}
                </span>

                {count > 0 && (
                  <span
                    className="admin-nav__count"
                    aria-label={t("admin.pendingCount", {
                      count,
                    })}
                  >
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar__tools">
          <Link
            to="/community"
            target="_blank"
            rel="noopener"
            className="admin-sidebar__tool"
          >
            <Icon name="link" size={18} />

            <span className="admin-sidebar__label">
              {t("admin.openPlatform")}
            </span>
          </Link>

          <LanguageToggle />

          <button
            type="button"
            className="admin-sidebar__tool"
            onClick={auth.logout}
          >
            <Icon name="logOut" size={18} />

            <span className="admin-sidebar__label">
              {t("admin.logout")}
            </span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet
          context={{
            ...admin,
            pending,
            soundRequests,
            sceneRequests,
          }}
        />
      </main>
    </div>
  );
}

export default AdminLayout;