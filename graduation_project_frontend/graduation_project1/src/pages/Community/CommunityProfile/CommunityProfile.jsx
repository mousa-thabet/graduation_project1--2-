import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import EditProfileDialog from "../../Profile/EditProfileDialog.jsx";
import CommunityPostCard from "../CommunityPostCard/CommunityPostCard.jsx";
import CommunityProfileHeader from "./CommunityProfileHeader.jsx";
import { ExamCard } from "../Exams/Exams.jsx";
import { CourseCard } from "../Courses/Courses.jsx";
import { STUDIO_PATH, isDraft } from "../Courses/courseUtils.js";
import { findCommunity, localName } from "../../../data/communities.js";
import { CURRENT_USER } from "../../../data/currentUser.js";
import { COMMUNITY_PEOPLE, findCommunityPerson } from "../../../data/communityPeople.js";
import { getFollowersList, getFollowingList } from "../../../utils/people.js";
import { formatCount, formatTimeAgo } from "../../../utils/format.js";
import { useScrollTabs } from "../../../hooks/useScrollTabs.js";
import "../../Profile/Profile.css";
import "../Exams/Exams.css";
import "../Courses/Courses.css";
import "./CommunityProfile.css";

// كل التبويبات بالترتيب (الإعجابات والمسودات خاصة بي)
const ALL_TABS = [
  "posts",
  "questions",
  "videos",
  "lives",
  "exams",
  "courses",
  "answers",
  "likes",
  "drafts",
];
// تبويبات المحتوى التعليمي: بتظهر بس إذا فيها شي (أو إذا أنا بقدر أنشر فيها)
const OPTIONAL_TABS = ["videos", "lives", "exams", "courses"];
const PRIVATE_TABS = ["likes", "drafts"];

// أيقونة كل تبويب عندما يكون فارغًا
const EMPTY_ICONS = {
  posts: "feather",
  questions: "comment",
  videos: "video",
  lives: "radio",
  exams: "checkSquare",
  courses: "graduation",
  answers: "comment",
  likes: "heart",
  drafts: "draft",
};

// تبويبات بتعرض منشورات (بطاقة منشور التواصل)
const POST_TABS = ["posts", "questions", "videos", "lives", "likes"];

// حقول حساب التواصل في نافذة التعديل (تحت الاسم والنبذة)
const EDIT_FIELDS = ["headline", "university", "website"];

/**
 * محتوى حساب التواصل لشخص واحد.
 * person: صاحب الحساب (أنا أو شخص آخر) بكل معلوماته في التواصل
 */
function ProfileView({ person, isMe }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    feed,
    profile,
    communityProfile,
    drafts,
    following,
    isFollowing,
    toggleFollow,
    me,
    badges,
    exams,
    courses,
  } = useOutletContext();
  const [tab, setTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);

  const language = i18n.resolvedLanguage;
  const listArgs = { isMe, person, me, myFollowing: following, people: COMMUNITY_PEOPLE };

  // منشوراته حسب النوع، والمثبّت أول المنشورات
  const authorPosts = feed.posts.filter((post) => post.author.id === person.id);
  const ofType = (type) => authorPosts.filter((post) => (post.type ?? "post") === type);
  const ownPosts = ofType("post");
  const pinnedPost = authorPosts.find((post) => post.id === person.pinnedPostId && post.type !== "question");
  const posts = pinnedPost ? [pinnedPost, ...ownPosts.filter((post) => post !== pinnedPost)] : ownPosts;
  const questions = ofType("question");
  const videos = ofType("video");
  // البثوث: الشغال هلأ أول، وبعدين المسجّلة
  const lives = ofType("live").sort((a, b) => (b.live?.status === "live") - (a.live?.status === "live"));

  // امتحاناته ودوراته اللي نشرها
  const isAuthor = (item) => (isMe ? item.isMine : item.author.id === person.id);
  const authorExams = exams.exams.filter(isAuthor);
  // الدورات المنشورة بس (المسودات بصفحة "دوراتي")
  const authorCourses = courses.courses.filter(isAuthor).filter((course) => !isDraft(course));

  // إجاباته: ردوده على أسئلة غيره، الأحدث أولًا
  const answers = feed.posts
    .filter((post) => post.type === "question" && post.author.id !== person.id)
    .flatMap((post) =>
      post.comments.filter((comment) => comment.author.id === person.id).map((comment) => ({ comment, post }))
    )
    .sort((a, b) => b.comment.createdAt - a.comment.createdAt);

  const likedPosts = feed.posts.filter((post) => post.isLiked);

  const counts = {
    following: getFollowingList(listArgs).length,
    followers: getFollowersList(listArgs).length,
    posts: authorPosts.length,
    answers: answers.length,
  };

  // عدد عناصر كل تبويب (لمعرفة هل هو فارغ)
  const tabCounts = {
    posts: posts.length,
    questions: questions.length,
    videos: videos.length,
    lives: lives.length,
    exams: authorExams.length,
    courses: authorCourses.length,
    answers: answers.length,
    likes: likedPosts.length,
    drafts: drafts.drafts.length,
  };

  // التبويبات الظاهرة: الخاصة لي بس، والتعليمية إذا فيها شي
  // (ولي: البث والامتحانات والدورات إذا معي شارة القيمة العلمية، لأني بقدر أنشر فيها)
  const tabs = ALL_TABS.filter((item) => {
    if (PRIVATE_TABS.includes(item)) return isMe;
    if (!OPTIONAL_TABS.includes(item)) return true;
    if (tabCounts[item] > 0) return true;
    return isMe && (item === "videos" || badges.isScholar);
  });
  // التبويبات كثيرة: تدرّج على الطرف اللي فيه تبويبات مخفية، والمختار بيتحرك للنص
  const tabsScroll = useScrollTabs(tab, tabs.length);

  // منشورات التبويب المفتوح
  const tabPosts = { posts, questions, videos, lives, likes: likedPosts }[tab] ?? [];

  // إكمال مسودة: تفتح في صندوق الكتابة بالرئيسية مع نوعها ومكانها ووسومها
  function continueDraft(draft) {
    navigate("/community", { state: { compose: true, draft } });
  }

  // الاسم والصورة مشتركان (حسابي العام)، والباقي خاص بالتواصل
  function handleSave({ fields, avatar, cover }) {
    const { name, ...communityFields } = fields;
    profile.updateProfile({ fields: { name }, avatar });
    communityProfile.updateProfile({ fields: communityFields, cover });
    setIsEditing(false);
  }

  return (
    <>
      <StudyHeader title={person.name} backTo={isMe ? undefined : "/community"} />

      <CommunityProfileHeader
        person={person}
        isMe={isMe}
        counts={counts}
        isFollowed={!isMe && isFollowing(person.id)}
        onToggleFollow={() => toggleFollow(person.id)}
        onEdit={() => setIsEditing(true)}
      />

      <div className="profile-tabs">
        <div ref={tabsScroll.ref} className={`study-tabs community-profile__tabs ${tabsScroll.fadeClass}`} role="tablist">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => setTab(item)}
            >
              {t(`community.profile.tabs.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* الإعجابات والمسودات خاصة: تظهر لي فقط */}
      {(tab === "likes" || tab === "drafts") && <p className="profile-hint">🔒 {t("community.profile.private")}</p>}

      {tabCounts[tab] === 0 && (
        <EmptyState
          icon={EMPTY_ICONS[tab]}
          title={t(`community.profile.empty.${tab}`)}
          text={isMe ? t(`community.profile.emptyText.${tab}`) : undefined}
        >
          {isMe && tab === "exams" && (
            <Link to="/community/create-exam" className="search-clear">
              {t("community.exams.create")}
            </Link>
          )}
          {isMe && tab === "courses" && (
            <Link to="/community/courses/new" className="search-clear">
              {t("community.courses.create")}
            </Link>
          )}
        </EmptyState>
      )}

      {/* المنشورات، الأسئلة، الفيديوهات، البثوث، والإعجابات */}
      {POST_TABS.includes(tab) && tabCounts[tab] > 0 && (
        <div className="feed">
          {tabPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              actions={feed}
              isPinned={tab === "posts" && post.id === person.pinnedPostId}
            />
          ))}
        </div>
      )}

      {/* الامتحانات اللي نشرها */}
      {tab === "exams" && tabCounts.exams > 0 && (
        <ul className="exams-list community-profile__catalog">
          {authorExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} result={exams.results[exam.id]} me={me} />
          ))}
        </ul>
      )}

      {/* حسابي: رابط "دوراتي" لإنشاء الدورات وتعديلها ومسوداتها */}
      {isMe && badges.isScholar && tab === "courses" && (
        <Link to={STUDIO_PATH} className="exams-create">
          <span className="exams-create__icon">
            <Icon name="graduation" size={22} />
          </span>
          <span>
            <strong>{t("studio.manage")}</strong>
            <span>{t("studio.studioCardText")}</span>
          </span>
        </Link>
      )}

      {/* الدورات اللي نشرها */}
      {tab === "courses" && tabCounts.courses > 0 && (
        <ul className="courses-list community-profile__catalog">
          {authorCourses.map((course) => (
            <CourseCard key={course.id} course={course} me={me} />
          ))}
        </ul>
      )}

      {/* الإجابات: كل إجابة تفتح سؤالها */}
      {tab === "answers" && (
        <ul className="profile-replies">
          {answers.map(({ comment, post }) => (
            <li key={comment.id}>
              <Link to={`/community/post/${post.id}`} className="profile-reply">
                <span className="profile-reply__meta">
                  {t("community.profile.answerOn", { name: post.author.name })} ·{" "}
                  {formatTimeAgo(comment.createdAt, language)}
                </span>
                <p className="profile-reply__text">{comment.text}</p>
                <p className="profile-reply__post">{post.text}</p>
                <span className="community-profile__likes">
                  <Icon name="heart" size={14} /> {formatCount(comment.likes, language)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* المسودات: أكمل الكتابة أو احذف */}
      {tab === "drafts" && (
        <ul className="profile-drafts">
          {drafts.drafts.map((draft) => {
            const community = findCommunity(draft.communityId);

            return (
              <li key={draft.id} className="profile-draft">
                {community && (
                  <span className="community-profile__draft-place" style={{ "--track": community.color }}>
                    {t(`community.types.${draft.type ?? "post"}`)} · {localName(community, language)}
                  </span>
                )}
                <p className="profile-draft__text">{draft.text}</p>
                <div className="profile-draft__bar">
                  <span className="profile-draft__meta">
                    {t("studyApp.profile.drafts.updated", { time: formatTimeAgo(draft.updatedAt, language) })}
                    {draft.poll && <> · {t("studyApp.profile.drafts.withPoll")}</>}
                  </span>
                  <button type="button" className="profile-draft__delete" onClick={() => drafts.deleteDraft(draft.id)}>
                    <Icon name="trash" size={16} />
                    {t("studyApp.profile.drafts.delete")}
                  </button>
                  <button type="button" className="profile-draft__continue" onClick={() => continueDraft(draft)}>
                    <Icon name="feather" size={16} />
                    {t("studyApp.profile.drafts.continue")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isEditing && (
        <EditProfileDialog
          profile={{ name: profile.profile.name, ...communityProfile.profile }}
          avatar={profile.me.avatar}
          cover={communityProfile.cover}
          textFields={EDIT_FIELDS}
          labels={{
            headline: t("community.profile.form.headline"),
            university: t("community.profile.form.university"),
          }}
          bioPlaceholder={t("community.profile.form.bioPlaceholder")}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

/**
 * حساب التواصل: /community/profile لحسابي، و /community/profile/اسم_المستخدم لأي شخص.
 * منفصل عن حساب ادرس معي: نبذة وتخصص وغلاف ومتابعات ومسودات خاصة بالتواصل.
 */
function CommunityProfile() {
  const { t } = useTranslation();
  const { handle } = useParams();
  const { profile, communityProfile, memberships, following, me } = useOutletContext();

  const isMe = !handle || handle === CURRENT_USER.handle;

  // أنا بنفس شكل بيانات باقي الأشخاص
  const person = isMe
    ? {
        ...communityProfile.profile,
        ...me,
        name: profile.profile.name,
        cover: communityProfile.cover,
        communities: memberships.joinedCommunities,
        follows: following,
        followsMe: false,
      }
    : findCommunityPerson(handle);

  if (!person) {
    return (
      <>
        <StudyHeader title={t("studyApp.nav.profile")} backTo="/community" />
        <EmptyState icon="userX" title={t("studyApp.profile.notFound")} text={t("studyApp.profile.notFoundText")} />
      </>
    );
  }

  // key: صفحة جديدة (تبويب "المنشورات") عند الانتقال من حساب لآخر
  return <ProfileView key={person.handle} person={person} isMe={isMe} />;
}

export default CommunityProfile;