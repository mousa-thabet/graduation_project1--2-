import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import { ExamAuthor } from "../Exams/Exams.jsx";
import ReportButton from "../ReportButton/ReportButton.jsx";
import { findCommunity } from "../../../data/communities.js";
import { useMediaUrl } from "../../../hooks/useMediaUrl.js";
import { formatCount } from "../../../utils/format.js";
import { STUDIO_PATH, coursePath, editCoursePath, isCourseReady, isDraft, totalMinutes } from "./courseUtils.js";
import "../../Study/Search/Search.css";
import "../Exams/Exams.css";
import "./Courses.css";
// شريط "هاي الدورة مسودة"
import "./CourseStudio.css";

/**
 * مشغّل الدرس: الفيديو (من IndexedDB) أو بطاقة "درس مكتوب"، والشرح تحته.
 */
function LessonPlayer({ lesson, number }) {
  const { t } = useTranslation();
  const { url, isLoading } = useMediaUrl(lesson.video?.mediaId);

  return (
    <section className="lesson-player">
      {lesson.video ? (
        url ? (
          // key: فيديو جديد لكل درس
          <video key={url} className="lesson-player__video" src={url} controls playsInline />
        ) : (
          <div className="lesson-player__screen">
            <Icon name="video" size={34} />
            <p>{t(isLoading ? "community.courses.videoLoading" : "community.courses.videoMissing")}</p>
          </div>
        )
      ) : (
        <div className="lesson-player__screen">
          <Icon name="book" size={34} />
          <p>{t("community.courses.textLesson")}</p>
        </div>
      )}

      <h2 className="lesson-player__title" dir="auto">
        <span>{t("community.courses.lessonNumber", { number })}</span>
        {lesson.title}
      </h2>
      {lesson.notes && (
        <p className="lesson-player__notes" dir="auto">
          {lesson.notes}
        </p>
      )}
    </section>
  );
}

/**
 * صفحة دورة: /community/courses/:courseId?lesson=l2
 * معلومات الدورة والتسجيل والتقدّم، مشغّل الدرس الحالي، وقائمة الدروس.
 * لازم تسجّل بالدورة (مجانًا) حتى تشوف الدروس، و"خلّصت الدرس" بيحسب تقدّمك.
 */
function CourseView() {
  const { t, i18n } = useTranslation();
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courses, me } = useOutletContext();
  const course = courses.findCourse(courseId);

  if (!course) {
    return (
      <>
        <StudyHeader title={t("community.courses.notFound")} backTo="/community/courses" />
        <EmptyState icon="graduation" title={t("community.courses.notFound")} text={t("community.courses.notFoundText")}>
          <Link to="/community/courses" className="search-clear">
            {t("community.nav.courses")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const community = findCommunity(course.communityId);
  const author = course.isMine ? me : course.author;
  const isEnrolled = courses.isEnrolled(course.id);
  const percent = courses.percentOf(course);

  // الدرس الحالي: من الرابط، أو أول درس ما خلص، أو أول درس
  const lessonIndex = Math.max(
    0,
    course.lessons.findIndex((lesson) =>
      searchParams.get("lesson") ? lesson.id === searchParams.get("lesson") : !courses.isLessonDone(course.id, lesson.id)
    )
  );
  const lesson = course.lessons[lessonIndex];
  const nextLesson = course.lessons[lessonIndex + 1];
  const isDone = courses.isLessonDone(course.id, lesson.id);

  // "خلّصت الدرس": نعلّمه وننتقل للدرس اللي بعده
  function finishLesson() {
    courses.toggleLesson(course.id, lesson.id);
    if (!isDone && nextLesson) navigate(coursePath(course.id, nextLesson.id), { replace: true });
  }

  // حذف دورتي: بنرجع لـ "دوراتي" مع رسالة "انحذفت"
  function remove() {
    courses.deleteCourse(course.id);
    navigate(STUDIO_PATH, { replace: true, state: { toast: t("studio.toasts.deleted") } });
  }

  const draft = course.isMine && isDraft(course);

  return (
    <>
      {/* دورتي: الرجوع لـ "دوراتي"  •  دورة غيري: الرجوع لقائمة الدورات */}
      <StudyHeader title={course.title} backTo={course.isMine ? STUDIO_PATH : "/community/courses"} />

      {/* مسودتي: بس أنا بشوفها، وبقدر أنشرها من هون إذا جاهزة */}
      {draft && (
        <div className="course-draft" role="status">
          <Icon name="lock" size={16} />
          <span>{t("studio.draftBanner")}</span>
          {isCourseReady(course) ? (
            <button type="button" className="course-draft__action" onClick={() => courses.setCourseStatus(course.id, "published")}>
              <Icon name="send" size={14} />
              {t("studio.draftBannerAction")}
            </button>
          ) : (
            <Link to={editCoursePath(course.id)} className="course-draft__action">
              <Icon name="feather" size={14} />
              {t("studio.actions.edit")}
            </Link>
          )}
        </div>
      )}

      {/* معلومات الدورة */}
      <section className="course-hero" style={{ "--track": community?.color }}>
        <span className="course-hero__icon" aria-hidden="true">
          <CommunityIcon name={course.communityId} size={30} />
        </span>
        <div className="course-hero__text">
          <PostOrigin post={{ communityId: course.communityId, branchId: course.branchId }} />
          <h2 className="course-hero__title" dir="auto">
            {course.title}
          </h2>
          {course.description && (
            <p className="course-hero__description" dir="auto">
              {course.description}
            </p>
          )}
          <ExamAuthor author={author} isMine={course.isMine} />
          <p className="course-card__meta">
            <span>{t(`community.courses.levels.${course.level}`)}</span>
            <span>
              <Icon name="play" size={14} />
              {t("community.courses.lessonsCount", { count: course.lessons.length })}
            </span>
            <span>
              <Icon name="clock" size={14} />
              {t("community.exams.minutes", { count: totalMinutes(course) })}
            </span>
            <span>
              <Icon name="users" size={14} />
              {t("community.courses.students", {
                value: formatCount(course.students + (isEnrolled ? 1 : 0), i18n.resolvedLanguage),
              })}
            </span>
          </p>

          {isEnrolled && (
            <div className="course-progress">
              <span className="course-progress__track" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </span>
              <span className="course-progress__label">{t("community.courses.percent", { value: percent })}</span>
            </div>
          )}

          <div className="course-hero__actions">
            {isEnrolled ? (
              <button type="button" className="exam-button exam-button--ghost" onClick={() => courses.leave(course.id)}>
                {t("community.courses.leave")}
              </button>
            ) : (
              <button type="button" className="exam-button" onClick={() => courses.enroll(course.id)}>
                <Icon name="graduation" size={16} />
                {t("community.courses.enroll")}
              </button>
            )}
            {/* دورتي: تعديل أو حذف  •  دورة غيري: إبلاغ */}
            {course.isMine ? (
              <>
                <Link to={editCoursePath(course.id)} className="exam-button exam-button--ghost">
                  <Icon name="feather" size={16} />
                  {t("community.courses.edit")}
                </Link>
                <button type="button" className="exam-button exam-button--danger" onClick={remove}>
                  <Icon name="trash" size={16} />
                  {t("community.courses.delete")}
                </button>
              </>
            ) : (
              <ReportButton targetType="course" targetId={course.id} title={course.title} />
            )}
          </div>
        </div>
      </section>

      {/* خلّصت الدورة */}
      {isEnrolled && percent === 100 && (
        <p className="course-done" role="status">
          🎉 {t("community.courses.finished")}
        </p>
      )}

      {/* الدرس الحالي (للمسجّلين بس) */}
      {isEnrolled ? (
        <div className="course-lesson">
          <LessonPlayer lesson={lesson} number={lessonIndex + 1} />
          <div className="course-lesson__actions">
            <button
              type="button"
              className={`exam-button ${isDone ? "exam-button--ghost" : ""}`}
              aria-pressed={isDone}
              onClick={finishLesson}
            >
              <Icon name="check" size={16} strokeWidth={2.5} />
              {t(isDone ? "community.courses.lessonDone" : "community.courses.finishLesson")}
            </button>
            {nextLesson && (
              <Link to={coursePath(course.id, nextLesson.id)} replace className="exam-button exam-button--ghost">
                {t("community.courses.nextLesson")}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="community-disclaimer">
          <Icon name="lock" size={16} />
          {t("community.courses.enrollToWatch")}
        </p>
      )}

      {/* قائمة الدروس */}
      <section className="course-lessons">
        <h2 className="exam-section-title">{t("community.courses.lessons")}</h2>
        <ol>
          {course.lessons.map((item, index) => {
            const isItemDone = courses.isLessonDone(course.id, item.id);
            const content = (
              <>
                <span className={`course-lessons__number ${isItemDone ? "is-done" : ""}`}>
                  {isItemDone ? <Icon name="check" size={14} strokeWidth={3} /> : index + 1}
                </span>
                <span className="course-lessons__title" dir="auto">
                  {item.title}
                </span>
                <span className="course-lessons__meta">
                  <Icon name={item.video ? "video" : "book"} size={14} />
                  {t("community.exams.minutes", { count: item.duration })}
                </span>
              </>
            );

            return (
              <li key={item.id}>
                {isEnrolled ? (
                  <Link
                    to={coursePath(course.id, item.id)}
                    replace
                    className={`course-lessons__item ${index === lessonIndex ? "is-current" : ""}`}
                    aria-current={index === lessonIndex ? "true" : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="course-lessons__item is-locked">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

export default CourseView;