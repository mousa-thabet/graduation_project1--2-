import { Navigate, Route, Routes, useParams } from "react-router";
import MainLayout from "./layouts/MainLayout/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout/AuthLayout.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import StudyLayout from "./layouts/StudyLayout/StudyLayout.jsx";
import Posts from "./pages/Study/Posts/Posts.jsx";
import PostDetail from "./pages/Study/PostDetail/PostDetail.jsx";
import Search from "./pages/Study/Search/Search.jsx";
import History from "./pages/Study/History/History.jsx";
import Session from "./pages/Study/Session/Session.jsx";
import Library from "./pages/Study/Library/Library.jsx";
import Notifications from "./pages/Notifications/Notifications.jsx";
import Streams from "./pages/Study/Streams/Streams.jsx";
import StreamRoom from "./pages/Study/Streams/StreamRoom/StreamRoom.jsx";
import StreamReplay from "./pages/Study/Streams/StreamReplay/StreamReplay.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import ProfileConnections from "./pages/Profile/ProfileConnections.jsx";
import Plan from "./pages/Plan/Plan.jsx";
import About from "./pages/Info/About.jsx";
import Privacy from "./pages/Info/Privacy.jsx";
import CommunityLayout from "./layouts/CommunityLayout/CommunityLayout.jsx";
import Welcome from "./pages/Community/Welcome/Welcome.jsx";
import Feed from "./pages/Community/Feed/Feed.jsx";
import Explore from "./pages/Community/Explore/Explore.jsx";
import CommunityPage from "./pages/Community/CommunityPage/CommunityPage.jsx";
import Saved from "./pages/Community/Saved/Saved.jsx";
import CommunitySearch from "./pages/Community/CommunitySearch/CommunitySearch.jsx";
import Badges from "./pages/Community/Badges/Badges.jsx";
import CommunityPostDetail from "./pages/Community/CommunityPostDetail/CommunityPostDetail.jsx";
import CommunityProfile from "./pages/Community/CommunityProfile/CommunityProfile.jsx";
import CommunityConnections from "./pages/Community/CommunityProfile/CommunityConnections.jsx";
import Exams from "./pages/Community/Exams/Exams.jsx";
import ExamEditor from "./pages/Community/Exams/ExamEditor.jsx";
import ExamTake from "./pages/Community/Exams/ExamTake.jsx";
import BranchRequests from "./pages/Community/BranchRequests/BranchRequests.jsx";
import Courses from "./pages/Community/Courses/Courses.jsx";
import CourseEditor from "./pages/Community/Courses/CourseEditor.jsx";
import CourseView from "./pages/Community/Courses/CourseView.jsx";
import CourseStudio from "./pages/Community/Courses/CourseStudio.jsx";
import CommunityLive from "./pages/Community/CommunityLive/CommunityLive.jsx";
import Experience from "./pages/Community/Experience/Experience.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import AdminLayout from "./layouts/AdminLayout/AdminLayout.jsx";
import AdminOverview from "./pages/Admin/AdminOverview.jsx";
import AdminBadges from "./pages/Admin/AdminBadges.jsx";
import AdminBranches from "./pages/Admin/AdminBranches.jsx";
import AdminReports from "./pages/Admin/AdminReports.jsx";
import AdminCommunities from "./pages/Admin/AdminCommunities.jsx";
import AdminLibrary from "./pages/Admin/AdminLibrary.jsx";
import AdminRequests from "./pages/Admin/AdminRequests.jsx";
import AdminAppeals from "./pages/Admin/AdminAppeals.jsx";
import RequireAuth from "./components/RequireAuth/RequireAuth.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";
import { useAuth } from "./hooks/useAuth.js";

// أول صفحة بالموقع: ما في واجهة أولية.
// مش مسجّل ← صفحة تسجيل الدخول  •  مسجّل ← الرئيسية (التواصل)
function StartPage() {
  const { isLoggedIn } = useAuth();

  return <Navigate to={isLoggedIn ? "/community" : "/login"} replace />;
}

// رابط التعديل القديم (/community/exams/:examId/edit) ← قسم إنشاء امتحان
function OldExamEdit() {
  const { examId } = useParams();

  return <Navigate to={`/community/create-exam/${examId}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route index element={<StartPage />} />

      {/* الصفحات التي تظهر فيها القائمة والذيل وزر الواتساب */}
      <Route element={<MainLayout />}>
        <Route path="about" element={<About />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>

      {/* الأقسام كلها لازم تسجيل دخول (بدونه ← صفحة الدخول، وبعدها بيرجع على نفس الصفحة) */}
      <Route element={<RequireAuth />}>
        {/* قسم ادرس معي بقالبه الخاص (ومعه خطتي) */}
        <Route element={<StudyLayout />}>
          <Route path="study" element={<Posts />} />
          <Route path="study/post/:postId" element={<PostDetail />} />
          <Route path="study/search" element={<Search />} />
          {/* البثوث: القائمة، والبث المباشر، ومشاهدة بث مسجّل */}
          <Route path="study/streams" element={<Streams />} />
          <Route path="study/streams/live/:roomId" element={<StreamRoom />} />
          <Route path="study/streams/replay/:recordingId" element={<StreamReplay />} />
          <Route path="study/session" element={<Session />} />
          <Route path="study/history" element={<History />} />
          <Route path="study/library" element={<Library />} />
          {/* خطتي: بنفس القالب، بس بدون العمود الجانبي (المبدّل بيكون على "خطتي") */}
          <Route path="plan" element={<Plan />} />
          <Route path="notifications" element={<Notifications />} />
          {/* حسابي، وحساب أي شخص، وقائمتا المتابعين ومن يتابعهم */}
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:handle" element={<Profile />} />
          <Route path="profile/:handle/:list" element={<ProfileConnections />} />
        </Route>

        {/* قسم التواصل بقالبه الخاص (أول دخول: صفحة "شو بيهمك؟") */}
        <Route path="community" element={<CommunityLayout />}>
          <Route index element={<Feed />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="explore" element={<Explore />} />
          {/* مجتمع، أو فرع داخل مجتمع */}
          <Route path="c/:communityId" element={<CommunityPage />} />
          <Route path="c/:communityId/:branchId" element={<CommunityPage />} />
          <Route path="saved" element={<Saved />} />
          <Route path="search" element={<CommunitySearch />} />
          <Route path="badges" element={<Badges />} />
          {/* قسم الامتحانات: القائمة، وتقديم امتحان */}
          <Route path="exams" element={<Exams />} />
          <Route path="exams/:examId" element={<ExamTake />} />
          {/* قسم إنشاء امتحان (شارة القيمة العلمية فقط): امتحان جديد، أو تعديل امتحاني */}
          <Route path="create-exam" element={<ExamEditor />} />
          <Route path="create-exam/:examId" element={<ExamEditor />} />
          {/* الروابط القديمة بتحوّل على القسم الجديد */}
          <Route path="exams/new" element={<Navigate to="/community/create-exam" replace />} />
          <Route path="exams/:examId/edit" element={<OldExamEdit />} />
          {/* قسم الدورات: القائمة، إنشاء دورة (شارة القيمة العلمية)، مشاهدة دورة، وتعديلها */}
          <Route path="courses" element={<Courses />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:courseId" element={<CourseView />} />
          <Route path="courses/:courseId/edit" element={<CourseEditor />} />
          {/* دوراتي (استوديو الدورات): إدارة دوراتي ومسوداتي (شارة القيمة العلمية) */}
          <Route path="studio" element={<CourseStudio />} />
          {/* غرفة البث المباشر */}
          <Route path="live/:postId" element={<CommunityLive />} />
          {/* استبيان فتح فرع جديد (لأصحاب الشارات) */}
          <Route path="branch-requests" element={<BranchRequests />} />
          <Route path="post/:postId" element={<CommunityPostDetail />} />
          <Route path="notifications" element={<Notifications />} />
          {/* حسابي في التواصل، وحساب أي شخص، وقوائم المتابعة (منفصلة عن ادرس معي) */}
          <Route path="profile" element={<CommunityProfile />} />
          <Route path="profile/:handle" element={<CommunityProfile />} />
          {/* صفحة الخبرات: لما تضغط على الدرع الأزرق أو الأخضر */}
          <Route path="profile/:handle/experience" element={<Experience />} />
          <Route path="profile/:handle/:list" element={<CommunityConnections />} />
        </Route>
      </Route>

      {/* صفحات الحساب */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* لوحة الأدمن: الدخول من /login نفسها، وبدون صلاحية أدمن بترجع عليها */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="badges" element={<AdminBadges />} />
        <Route path="branches" element={<AdminBranches />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="appeals" element={<AdminAppeals />} />
        {/* طلبات الرفع: أصوات وخلفيات الطلاب (قبول أو رفض) */}
        <Route path="requests" element={<AdminRequests />} />
        {/* إضافة مسار رئيسي أو فرع مباشرة (بدون طلب) */}
        <Route path="communities" element={<AdminCommunities />} />
        {/* مكتبة الدراسة: أصوات وخلفيات رسمية من المنصة */}
        <Route path="library" element={<AdminLibrary />} />
      </Route>

      {/* أي رابط غير معروف */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;