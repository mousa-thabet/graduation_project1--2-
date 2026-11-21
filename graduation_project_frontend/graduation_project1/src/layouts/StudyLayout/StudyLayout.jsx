import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import Logo from "../../components/Logo/Logo.jsx";
import CommunityIcon from "../../components/CommunityIcon/CommunityIcon.jsx";
import LanguageToggle from "../../components/LanguageToggle/LanguageToggle.jsx";
import StudySidebar, {
  LogoutButton,
  NotificationsButton,
  SectionSwitcher,
  ThemeButton,
} from "./StudySidebar/StudySidebar.jsx";
import StudyAside from "./StudyAside/StudyAside.jsx";
import SessionWidget from "./SessionWidget/SessionWidget.jsx";
import LiveWidget from "./LiveWidget/LiveWidget.jsx";
import { useTheme } from "../../hooks/useTheme.js";
import { useFollowing } from "../../hooks/useFollowing.js";
import { useStudyPosts } from "../../hooks/useStudyPosts.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import { useStudySession } from "../../hooks/useStudySession.js";
import { useProfile } from "../../hooks/useProfile.js";
import { useDrafts } from "../../hooks/useDrafts.js";
import { useStreams } from "../../hooks/useStreams.js";
import { useMySounds } from "../../hooks/useMySounds.js";
import { useMyScenes } from "../../hooks/useMyScenes.js";
import { useOfficialLibrary } from "../../hooks/useOfficialLibrary.js";
import { useMyLibrary } from "../../hooks/useMyLibrary.js";
import { COMMUNITY_SOUNDS, SESSION_SOUNDS } from "../../data/sessionSounds.js";
import { SESSION_SCENES } from "../../data/sessionScenes.js";
import { CURRENT_USER } from "../../data/currentUser.js";
import { formatClock } from "../../utils/format.js";
import { simulateLike } from "../../utils/simulateServer.js";
import "./StudyLayout.css";
import "./PlanMode.css";

// الشاشات الكبيرة: إخفاء القائمة بزر ☰ (الاختيار بينحفظ)
const SIDEBAR_HIDDEN_KEY = "areatk-study-sidebar-hidden";

// قائمة قسم خطتي (صفحة الخطة بتفتح بنفس القالب)
const PLAN_PATH = "/plan";
// صفحة الجلسة: الطالب مركّز بالدراسة، فما في زر نشر عائم على الموبايل (كان يغطي الإحصائيات)
const SESSION_PATH = "/study/session";
const PLAN_NAV_ITEMS = [
  { id: "plan", icon: "calendar", to: PLAN_PATH, end: true, label: "studyApp.sections.plan" },
  { id: "notifications", icon: "bell", to: "/notifications" },
];

/**
 * زر ☰ للشاشات الكبيرة: بيظهر القائمة الجانبية وبيخفيها
 * (مع نقطة حمراء لو القائمة مخفية وفي إشعارات غير مقروءة)
 */
function SidebarToggle({ isOpen, hasUnread, onClick }) {
  const { t } = useTranslation();
  const label = t(isOpen ? "community.menu.close" : "community.menu.open");

  return (
    <button
      type="button"
      className="study-menu-button"
      aria-label={label}
      title={label}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      <CommunityIcon name="menu" size={22} />
      {hasUnread && !isOpen && <span className="study-menu-button__dot" aria-hidden="true" />}
    </button>
  );
}

/**
 * قالب قسم ادرس معي: قائمة جانبية + المحتوى + عمود جانبي.
 * الوضع الفاتح أو الداكن، ومن تتابعهم، والمنشورات (feed)، والإشعارات، وجلستي، وحسابي والمسودات، والبثوث، وأصواتي،
 * ومكتبة المنصة (أصوات وخلفيات الإدارة) تصل للصفحات عبر Outlet context.
 * البيانات هنا مرة واحدة، فأي تغيير يظهر فورًا في الصفحة والقائمة والعمود الجانبي معًا،
 * والجلسة والبث يبقيان شغالين عند التنقل بين الصفحات.
 */
function StudyLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const studyTheme = useTheme();
  const following = useFollowing();
  const posts = useStudyPosts();
  const notifications = useNotifications();
  // أصواتي المرفوعة: قرار الإدارة يصل كإشعار، والمقبولة تُضاف لخلاط الجلسة
  const mySounds = useMySounds({
    onReviewed(sound) {
      notifications.receive({
        type: sound.status === "approved" ? "soundApproved" : "soundRejected",
        section: "study",
        title: sound.name,
      });
    },
  });
  // خلفياتي المرفوعة: نفس فكرة أصواتي، والمقبولة بتنضاف لخلفيات الجلسة
  const myScenes = useMyScenes({
    onReviewed(scene) {
      const isApproved = scene.status === "approved";
      notifications.receive({
        type: isApproved ? "sceneApproved" : "sceneRejected",
        section: "study",
        i18nKey: `uploads.notifications.${isApproved ? "sceneApproved" : "sceneRejected"}`,
        title: scene.name,
      });
    },
  });
  // أصوات وخلفيات رفعتها الإدارة (بتوصل فورًا حتى لو الأدمن بتبويب ثاني)
  const official = useOfficialLibrary();
  const scenes = [...SESSION_SCENES, ...official.scenes, ...myScenes.approved];
  const session = useStudySession([...official.sounds, ...mySounds.approved]);
  // كل أصوات المكتبة: المنصة، الإدارة، الطلبة، وأصواتي المقبولة
  const librarySounds = [...SESSION_SOUNDS, ...official.sounds, ...COMMUNITY_SOUNDS, ...mySounds.approved];
  // مكتبتي: اللي اختاره الطالب، وجلستي بتعرض بس اللي نقله منها
  const library = useMyLibrary();
  const sessionSounds = librarySounds.filter((sound) => library.inSession("sounds", sound.id));
  const sessionScenes = scenes.filter((scene) => library.inSession("scenes", scene.id));

  // صوت شغّال وانشال من جلستي: بيوقف
  function stopIfLeaving(kind, id) {
    if (kind === "sounds" && library.inSession(kind, id) && session.mixer.isPlaying(id)) {
      session.mixer.toggle({ id });
    }
  }

  const myLibrary = {
    ...library,
    toggle(kind, id) {
      if (library.has(kind, id)) stopIfLeaving(kind, id);
      library.toggle(kind, id);
    },
    toggleSession(kind, id) {
      stopIfLeaving(kind, id);
      library.toggleSession(kind, id);
    },
  };
  const profile = useProfile();
  const drafts = useDrafts();
  const streams = useStreams();
  const { timer } = session;
  const { activeRoom } = streams;
  // الشاشات الكبيرة: القائمة الجانبية ظاهرة أو مخفية
  const [isSidebarHidden, setIsSidebarHidden] = useState(() => localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "yes");

  useEffect(() => {
    localStorage.setItem(SIDEBAR_HIDDEN_KEY, isSidebarHidden ? "yes" : "no");
  }, [isSidebarHidden]);

  // النشر مع محاكاة السيرفر: بعد ثوانٍ يعجب شخص بالمنشور ويصل إشعار
  function addPost(data) {
    const postId = posts.addPost(data);

    simulateLike((person) => {
      posts.receiveLike(postId);
      notifications.receive({ type: "like", section: "study", actor: person, postId });
    });
  }

  // منشوراتي وتعليقاتي تظهر باسمي وصورتي الحاليين (حتى لو غيّرتهما بعد النشر)
  const withMe = (author) => (author.id === CURRENT_USER.id ? profile.me : author);
  const feedPosts = posts.posts.map((post) => ({
    ...post,
    author: withMe(post.author),
    comments: post.comments.map((comment) => ({ ...comment, author: withMe(comment.author) })),
  }));

  // المنشور المثبّت في حسابي جزء من أدوات المنشورات (يظهر في قائمة ⋯)
  const feed = {
    ...posts,
    posts: feedPosts,
    addPost,
    pinnedPostId: profile.profile.pinnedPostId,
    togglePin: profile.togglePin,
  };

  const isSession = pathname === SESSION_PATH;
  const showSessionWidget = timer.isActive && !isSession;
  // صفحة خطتي: المبدّل على "خطتي"، قائمتها الخاصة، وبدون العمود الجانبي
  const isPlan = pathname === PLAN_PATH;
  const section = isPlan ? "plan" : "study";

  // الوقت الباقي في عنوان التبويب أثناء الجلسة: "24:13 · وقت الدراسة"
  useEffect(() => {
    if (!timer.isActive) return;

    const originalTitle = document.title;
    document.title = `${formatClock(timer.secondsLeft)} · ${t(`studyApp.session.phases.${timer.phase}`)}`;

    return () => {
      document.title = originalTitle;
    };
  }, [timer.isActive, timer.secondsLeft, timer.phase, t]);

  return (
    <div
      className={`study-app ${isSidebarHidden ? "is-sidebar-hidden" : ""} ${isPlan ? "is-plan" : ""} ${isSession ? "is-session" : ""}`}
    >
      {/* الشاشات الكبيرة: ☰ بيظهر القائمة وبيخفيها */}
      <SidebarToggle
        isOpen={!isSidebarHidden}
        hasUnread={notifications.unreadCount > 0}
        onClick={() => setIsSidebarHidden((current) => !current)}
      />

      <StudySidebar
        {...studyTheme}
        me={profile.me}
        unreadCount={notifications.unreadCount}
        section={section}
        navItems={isPlan ? PLAN_NAV_ITEMS : undefined}
      />

      <main className="study-app__main">
        {/* شريط علوي للموبايل فقط */}
        <div className="study-app__mobile-top">
          <Logo />
          <SectionSwitcher current={section} />
          <div className="study-app__mobile-tools">
            <NotificationsButton unreadCount={notifications.unreadCount} />
            <ThemeButton {...studyTheme} />
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>

        <Outlet
          context={{
            ...studyTheme,
            ...following,
            feed,
            notifications,
            session,
            profile,
            drafts,
            streams,
            mySounds,
            myScenes,
            myLibrary,
            librarySounds,
            sessionSounds,
            sessionScenes,
            officialSounds: official.sounds,
            scenes,
          }}
        />
      </main>

      {/* جلستك شغالة: تظهر في كل الصفحات ما عدا صفحة جلستي */}
      {showSessionWidget && <SessionWidget timer={timer} />}

      {/* أنت في بث: تظهر في كل الصفحات ما عدا صفحة البث نفسه */}
      {activeRoom && pathname !== `/study/streams/live/${activeRoom.id}` && (
        <LiveWidget streams={streams} isStacked={showSessionWidget} />
      )}

      {!isPlan && <StudyAside posts={feed.posts} liveRooms={streams.rooms} {...following} />}
    </div>
  );
}

export default StudyLayout;