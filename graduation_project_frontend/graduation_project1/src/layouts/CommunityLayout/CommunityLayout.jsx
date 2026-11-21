import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import Logo from "../../components/Logo/Logo.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import LanguageToggle from "../../components/LanguageToggle/LanguageToggle.jsx";
import CommunityIcon from "../../components/CommunityIcon/CommunityIcon.jsx";
import StudySidebar, {
  NotificationsButton,
  SectionSwitcher,
  ThemeButton,
} from "../StudyLayout/StudySidebar/StudySidebar.jsx";
import CommunityAside from "./CommunityAside/CommunityAside.jsx";
import AdminModeBar from "./AdminModeBar/AdminModeBar.jsx";
import { useTheme } from "../../hooks/useTheme.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { useFollowing } from "../../hooks/useFollowing.js";
import { useStudyPosts } from "../../hooks/useStudyPosts.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import { useProfile } from "../../hooks/useProfile.js";
import { useCommunityProfile } from "../../hooks/useCommunityProfile.js";
import { useDrafts } from "../../hooks/useDrafts.js";
import { useMemberships } from "../../hooks/useMemberships.js";
import { useBadges } from "../../hooks/useBadges.js";
import { useBranchRequests } from "../../hooks/useBranchRequests.js";
import { useExams } from "../../hooks/useExams.js";
import { useCourses } from "../../hooks/useCourses.js";
import { useCommunityAlerts } from "../../hooks/useCommunityAlerts.js";
import { useReports } from "../../hooks/useReports.js";
import { useAdminSession } from "../../hooks/useAdmin.js";
import { postTitle, useModeration } from "../../hooks/useModeration.js";
import { usePlacesSync } from "../../hooks/usePlacesSync.js";
import { useRecentSearches } from "../../hooks/useRecentSearches.js";
import { COMMUNITY_POSTS } from "../../data/communityPosts.js";
import { LIVE_POSTS } from "../../data/communityLive.js";
import { CURRENT_USER } from "../../data/currentUser.js";
import { communityPath, findCommunity, localName } from "../../data/communities.js";
import { simulateLike } from "../../utils/simulateServer.js";
// ستايل ادرس معي: نفس التخطيط والمكونات
import "../StudyLayout/StudyLayout.css";
import "./CommunityLayout.css";

const BASE_PATH = "/community";
// من هاد العرض وفوق القائمة الجانبية ثابتة، وتحته بتصير خلف زر ☰ (نفس الرقم بـ CommunityLayout.css)
const WIDE_SCREEN = "(min-width: 1281px)";
// الشاشات الكبيرة: إخفاء القائمة بزر ☰ (الاختيار بينحفظ)
const SIDEBAR_HIDDEN_KEY = "areatk-community-sidebar-hidden";

// عناصر قائمة التواصل (الأسئلة بتنشاف من تبويب "أسئلة" بالرئيسية، والبحث من خانة البحث بالعمود الجانبي)
const NAV_ITEMS = [
  { id: "home", icon: "home", to: BASE_PATH, end: true, label: "community.nav.home" },
  { id: "explore", icon: "explore", IconComponent: CommunityIcon, to: `${BASE_PATH}/explore`, label: "community.nav.explore" },
  { id: "exams", icon: "checkSquare", to: `${BASE_PATH}/exams`, label: "community.nav.exams" },
  { id: "courses", icon: "graduation", to: `${BASE_PATH}/courses`, label: "community.nav.courses" },
  { id: "saved", icon: "bookmark", to: `${BASE_PATH}/saved`, label: "community.nav.saved" },
  { id: "badges", icon: "badge", IconComponent: CommunityIcon, to: `${BASE_PATH}/badges`, label: "community.nav.badges" },
  { id: "notifications", icon: "bell", to: `${BASE_PATH}/notifications` },
];

// الموبايل: أهم 4 صفحات بالشريط السفلي (مثل ادرس معي)، والباقي خلف زر "المزيد" ☰
const BOTTOM_NAV_IDS = ["home", "explore", "exams", "courses"];
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => BOTTOM_NAV_IDS.includes(item.id));

// إنشاء امتحان مش بالقائمة: زره بتبويب "نشرتها" بقسم الامتحانات (لأصحاب شارة القيمة العلمية)

// صفحات عريضة بدون العمود الجانبي (محرّر الامتحان بدّه مساحة)
const isWidePage = (pathname) => pathname.startsWith(`${BASE_PATH}/create-exam`);

/**
 * زر القائمة ☰ (مع نقطة حمراء إن وُجدت إشعارات غير مقروءة)
 * showClose: لما تكون مفتوحة بيصير ✕ (الشاشات الأصغر)، وعلى الكبيرة بيضل ☰
 */
function MenuButton({ isOpen, hasUnread, onClick, className = "", showClose = true }) {
  const { t } = useTranslation();
  const label = t(isOpen ? "community.menu.close" : "community.menu.open");

  return (
    <button
      type="button"
      className={`community-menu-button ${className}`}
      aria-label={label}
      title={label}
      aria-expanded={isOpen}
      aria-controls="community-drawer"
      onClick={onClick}
    >
      {isOpen && showClose ? <Icon name="x" size={22} /> : <CommunityIcon name="menu" size={22} />}
      {hasUnread && !isOpen && <span className="community-menu-button__dot" aria-hidden="true" />}
    </button>
  );
}

/**
 * الشريط السفلي للموبايل: الرئيسية، المجتمعات، الامتحانات، الدورات، و"المزيد" ☰ بيفتح القائمة كاملة.
 * بنفس شكل شريط ادرس معي (كلاس study-sidebar)، وبيظهر على الشاشات الصغيرة بس.
 */
function BottomNav({ isMenuOpen, onMore }) {
  const { t } = useTranslation();
  const moreLabel = t(isMenuOpen ? "community.menu.close" : "community.menu.open");

  return (
    <div className="study-sidebar community-bottom-nav">
      <nav className="study-nav" aria-label={t("community.menu.open")}>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const ItemIcon = item.IconComponent ?? Icon;
          const label = t(item.label);

          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `study-nav__link ${isActive ? "is-active" : ""}`}
              title={label}
              aria-label={label}
            >
              <span className="study-nav__icon">
                <ItemIcon name={item.icon} size={24} />
              </span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className="study-nav__link community-bottom-nav__more"
          title={moreLabel}
          aria-label={moreLabel}
          aria-expanded={isMenuOpen}
          aria-controls="community-drawer"
          onClick={onMore}
        >
          <span className="study-nav__icon">
            <CommunityIcon name="menu" size={24} />
          </span>
        </button>
      </nav>
    </div>
  );
}

/**
 * قالب قسم التواصل: القائمة الخضرا على الطرف، والمنشورات في الوسط، والعمود الجانبي.
 * على الشاشات الأصغر القائمة بتصير خلف زر ☰، وبتتسكّر عند الانتقال لصفحة، أو Esc، أو الضغط خارجها.
 * أول دخول: صفحة "شو بيهمك؟" إجبارية قبل أي صفحة أخرى.
 * كل بيانات القسم تصل للصفحات عبر Outlet context، وكلها منفصلة عن ادرس معي
 * (المنشورات، المسودات، الحساب) ما عدا الاسم والصورة والمتابعة.
 * وضع الإدارة (الأدمن داخل من اللوحة): بيظهر باسم الإدارة، وبدل الإبلاغ في حجب، وبيشوف المحجوب.
 * المحجوب ما بيشوفه غير الأدمن وصاحبه، وصاحبه بيقدر يطلب مراجعة.
 */
function CommunityLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { pathname } = location;
  // وضع الإدارة: الأدمن مسجّل دخول بهاد التبويب (لاحقًا: الدور بيجي من السيرفر)
  const { isAdmin } = useAdminSession();
  const theme = useTheme();
  const isWideScreen = useMediaQuery(WIDE_SCREEN);
  // مجتمع أو فرع جديد من الأدمن (حتى لو بتبويب ثاني) بيظهر فورًا
  usePlacesSync();
  // نفس متابعات ادرس معي: اللي بتابعه بأي قسم بيبين بالثاني
  const following = useFollowing();
  const memberships = useMemberships();
  const notifications = useNotifications();
  const profile = useProfile();
  const communityProfile = useCommunityProfile();
  const drafts = useDrafts({ storageKey: "areatk-community-drafts" });
  const recentSearches = useRecentSearches();
  // نفس كود منشورات ادرس معي، لكن بمنشورات التواصل ومكان حفظ مختلف
  // (المنشورات التجريبية فيها بث مباشر شغال)
  const posts = useStudyPosts({ storageKey: "areatk-community-feed", initialPosts: [...LIVE_POSTS, ...COMMUNITY_POSTS] });
  // القائمة مفتوحة في هذه الزيارة فقط (location.key جديد مع كل انتقال)، فأي انتقال يغلقها تلقائيًا
  const [menuOpenAt, setMenuOpenAt] = useState(null);
  const isMenuOpen = menuOpenAt === location.key;
  // الشاشات الكبيرة: القائمة الجانبية ظاهرة أو مخفية
  const [isSidebarHidden, setIsSidebarHidden] = useState(() => localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "yes");

  useEffect(() => {
    localStorage.setItem(SIDEBAR_HIDDEN_KEY, isSidebarHidden ? "yes" : "no");
  }, [isSidebarHidden]);

  // قرار الإدارة في طلب الشارة يصل كإشعار
  const badges = useBadges({
    onReviewed(request) {
      const isApproved = request.status === "approved";
      const community = findCommunity(request.communityId);

      notifications.receive({
        type: isApproved ? "badgeApproved" : "badgeRejected",
        section: "social",
        i18nKey: `community.notifications.${request.type}${isApproved ? "Approved" : "Rejected"}`,
        title: community ? localName(community, i18n.resolvedLanguage) : "",
      });
    },
  });

  // قرار الإدارة في طلب فتح فرع: إشعار، وعند الموافقة أنضم للفرع الجديد تلقائيًا
  const branchRequests = useBranchRequests({
    onReviewed(request) {
      const isApproved = request.status === "approved";
      const community = findCommunity(request.communityId);

      if (isApproved) memberships.toggleBranch(request.communityId, request.branchId);

      notifications.receive({
        type: isApproved ? "branchApproved" : "branchRejected",
        section: "social",
        i18nKey: `community.notifications.${isApproved ? "branchApproved" : "branchRejected"}`,
        title: `${community ? localName(community, i18n.resolvedLanguage) : ""} › ${request.name}`,
        link: isApproved ? communityPath(request.communityId, request.branchId) : `${BASE_PATH}/branch-requests`,
      });
    },
  });
  // المحجوب (من الأدمن مباشرة أو بعد بلاغ): بيختفي من كل مكان، إلا عن الأدمن
  // وإشعار لصاحب المنشور لما ينحجب، ولما الإدارة تقرر بطلب مراجعته
  const moderation = useModeration({
    onBlocked(entry) {
      notifications.receive({
        type: "reportReviewed",
        section: "social",
        i18nKey: "moderation.notifications.blocked",
        title: entry.title,
        link: `${BASE_PATH}/post/${entry.targetId}`,
      });
    },
    onAppealReviewed(appeal) {
      notifications.receive({
        type: "reportReviewed",
        section: "social",
        i18nKey: `moderation.notifications.${appeal.status === "approved" ? "appealApproved" : "appealRejected"}`,
        title: appeal.title,
        link: `${BASE_PATH}/post/${appeal.targetId}`,
      });
    },
  });
  const isHidden = (targetType, targetId) => !isAdmin && moderation.isBlocked(targetType, targetId);
  const allExams = useExams();
  const allCourses = useCourses();
  const exams = {
    ...allExams,
    exams: allExams.exams.filter((exam) => !isHidden("exam", exam.id)),
    findExam: (id) => (isHidden("exam", id) ? null : allExams.findExam(id)),
  };
  const courses = {
    ...allCourses,
    courses: allCourses.courses.filter((course) => !isHidden("course", course.id)),
    findCourse: (id) => (isHidden("course", id) ? null : allCourses.findCourse(id)),
  };

  // البلاغات على الامتحانات والدورات والبثوث: الأدمن بيقرر، وبيوصلني إشعار بالنتيجة
  const reports = useReports({
    onReviewed(report) {
      const isRemoved = report.status === "removed";
      const paths = { exam: "exams", course: "courses", live: "live" };

      notifications.receive({
        type: "reportReviewed",
        section: "social",
        i18nKey: `community.notifications.${isRemoved ? "reportRemoved" : "reportKept"}`,
        title: report.title,
        // انحذف: ما في شي نفتحه، فبنرجع للرئيسية
        link: isRemoved ? BASE_PATH : `${BASE_PATH}/${paths[report.targetType]}/${report.targetId}`,
      });
    },
  });

  // Esc يغلق القائمة
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpenAt(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const isWelcome = pathname === `${BASE_PATH}/welcome`;

  function toggleMenu() {
    setMenuOpenAt(isMenuOpen ? null : location.key);
  }

  // النشر مع محاكاة السيرفر: بعد ثوانٍ يعجب شخص بالمنشور ويصل إشعار
  // ترجع رقم المنشور (البث يحتاجه حتى يفتح غرفته)
  function addPost(data) {
    const postId = posts.addPost(data);

    simulateLike((person) => {
      posts.receiveLike(postId);
      notifications.receive({
        type: "like",
        section: "social",
        actor: person,
        postId,
        link: `${BASE_PATH}/post/${postId}`,
      });
    });

    return postId;
  }

  // إشعارات: حدا بتابعه بلّش بث، أو امتحان/دورة جديدة بمجتمعاتي
  useCommunityAlerts({
    posts: posts.posts,
    exams: exams.exams,
    courses: courses.courses,
    following: following.following,
    isInMyCommunities: memberships.isInMyCommunities,
    onAlert({ kind, item }) {
      const community = findCommunity(item.communityId);
      const place = community ? localName(community, i18n.resolvedLanguage) : "";
      const links = {
        live: `${BASE_PATH}/live/${item.id}`,
        exam: `${BASE_PATH}/exams/${item.id}`,
        course: `${BASE_PATH}/courses/${item.id}`,
      };

      notifications.receive({
        type: { live: "communityLive", exam: "newExam", course: "newCourse" }[kind],
        section: "social",
        i18nKey: `community.notifications.${{ live: "liveStarted", exam: "newExam", course: "newCourse" }[kind]}`,
        actor: item.author,
        // عنوان البث هو نص المنشور، والامتحان والدورة إلهم عنوان
        title: `${kind === "live" ? item.text : item.title} · ${place}`,
        link: links[kind],
      });
    },
  });

  // منشوراتي وتعليقاتي تظهر باسمي وصورتي وشاراتي الحالية
  const me = { ...profile.me, badges: badges.myBadges };
  const withMe = (author) => (author.id === CURRENT_USER.id ? me : author);
  // محجوب: المنشور نفسه، أو البث (من زر الحجب بغرفة البث)
  const isPostBlocked = (post) =>
    moderation.isBlocked("post", post.id) || (post.type === "live" && moderation.isBlocked("live", post.id));
  const feedPosts = posts.posts
    .map((post) => ({ ...post, isBlocked: isPostBlocked(post) }))
    // المحجوب بيشوفه الأدمن وصاحبه بس
    .filter((post) => !post.isBlocked || isAdmin || post.isMine)
    .map((post) => ({
      ...post,
      author: withMe(post.author),
      comments: post.comments.map((comment) => ({ ...comment, author: withMe(comment.author) })),
    }));

  // بلاغ على منشور: بيوصل للأدمن (مع صاحب المنشور حتى لو انحجب يوصله إشعار)
  function reportPost(postId, reason) {
    posts.report(postId);
    const post = posts.posts.find((item) => item.id === postId);
    if (!post) return;

    reports.report({
      targetType: "post",
      targetId: postId,
      title: postTitle(post) || t("moderation.admin.noText"),
      reason: reason ?? "other",
      ownerId: post.author.id,
    });
  }

  // الأدمن: حجب منشور أو إلغاء حجبه
  function toggleBlock(post) {
    if (post.isBlocked) {
      moderation.unblock("post", post.id);
      if (post.type === "live") moderation.unblock("live", post.id);
      return;
    }

    moderation.block({
      targetType: "post",
      targetId: post.id,
      title: postTitle(post) || t("moderation.admin.noText"),
      ownerId: post.author.id,
    });
  }

  // صاحب المنشور المحجوب: طلب مراجعة
  function requestReview(post, note) {
    moderation.requestReview({
      targetType: "post",
      targetId: post.id,
      title: postTitle(post) || t("moderation.admin.noText"),
      note,
    });
  }

  // المنشور المثبّت في حسابي بالتواصل (منفصل عن ادرس معي)
  const feed = {
    ...posts,
    posts: feedPosts,
    addPost,
    report: reportPost,
    pinnedPostId: communityProfile.profile.pinnedPostId,
    togglePin: communityProfile.togglePin,
    // الحجب والمراجعة (PostCard بيستخدمهم)
    isAdmin,
    toggleBlock,
    appealFor: moderation.appealFor,
    requestReview,
  };

  // وضع الإدارة: القائمة الجانبية باسم الإدارة (مش حساب الطالب)
  const sidebarMe = isAdmin ? { id: "admin", name: t("moderation.adminName"), handle: "admin", badges: [] } : me;

  const context = {
    ...theme,
    ...following,
    feed,
    memberships,
    badges,
    branchRequests,
    exams,
    courses,
    reports,
    notifications,
    profile,
    communityProfile,
    drafts,
    recentSearches,
    me,
    moderation: { ...moderation, isAdmin },
    basePath: BASE_PATH,
  };

  // أول دخول: لازم يختار اهتماماته
  if (!memberships.isOnboarded && !isWelcome) return <Navigate to={`${BASE_PATH}/welcome`} replace />;
  // اختارها من قبل: صفحة الترحيب لا تظهر مرة ثانية
  if (memberships.isOnboarded && isWelcome) return <Navigate to={BASE_PATH} replace />;

  // صفحة الترحيب بدون القائمة والعمود الجانبي
  if (isWelcome) {
    return (
      <div className="community-welcome-shell">
        <Outlet context={context} />
      </div>
    );
  }

  const hasUnread = notifications.unreadCount > 0;
  const isWide = isWidePage(pathname);

  return (
    <div className={`study-app community-app ${isSidebarHidden ? "is-sidebar-hidden" : ""} ${isWide ? "is-wide" : ""}`}>
      {/* الشاشات الكبيرة: ☰ بيظهر القائمة وبيخفيها */}
      <MenuButton
        className="community-menu-button--desktop"
        isOpen={!isSidebarHidden}
        hasUnread={hasUnread}
        showClose={false}
        onClick={() => setIsSidebarHidden((current) => !current)}
      />

      {/* القائمة الجانبية: على الشاشات الكبيرة ثابتة وبتنخفى بزر ☰، وعلى الأصغر بتنزلق من الجنب عند الضغط على ☰
          (inert: لا يصلها التنقل بالكيبورد وهي مخفية) */}
      <div
        id="community-drawer"
        className={`community-drawer ${isMenuOpen ? "is-open" : ""}`}
        inert={isWideScreen ? isSidebarHidden : !isMenuOpen}
      >
        <div className="community-drawer__backdrop" onClick={() => setMenuOpenAt(null)} />
        <StudySidebar
          {...theme}
          me={sidebarMe}
          unreadCount={notifications.unreadCount}
          navItems={NAV_ITEMS}
          section="social"
          composeTo={BASE_PATH}
          profileTo={`${BASE_PATH}/profile`}
        />
      </div>

      <main className="study-app__main">
        {/* الشاشات الأصغر: شريط علوي فيه ☰ والأدوات
            (الموبايل: ☰ بينتقل للشريط السفلي، وبمكانه مبدّل الأقسام مثل ادرس معي) */}
        <div className="community-topbar">
          <MenuButton isOpen={isMenuOpen} hasUnread={hasUnread} onClick={toggleMenu} />
          <Logo />
          <SectionSwitcher current="social" />
          <div className="community-topbar__tools">
            <NotificationsButton unreadCount={notifications.unreadCount} to={`${BASE_PATH}/notifications`} />
            <ThemeButton {...theme} />
            <LanguageToggle />
          </div>
        </div>

        {/* الأدمن بيتصفح المجتمعات: شريط "وضع الإدارة" */}
        {isAdmin && <AdminModeBar />}

        <Outlet context={context} />
      </main>

      {/* الموبايل: الشريط السفلي */}
      <BottomNav isMenuOpen={isMenuOpen} onMore={toggleMenu} />

      {!isWide && (
        <CommunityAside
          posts={feedPosts}
          memberships={memberships}
          recentSearches={recentSearches}
          label={t("community.aside.label")}
          {...following}
        />
      )}
    </div>
  );
}

export default CommunityLayout;