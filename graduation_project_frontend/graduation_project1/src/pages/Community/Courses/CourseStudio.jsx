import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import { findCommunity } from "../../../data/communities.js";
import { formatCount, formatTimeAgo } from "../../../utils/format.js";
import { STUDIO_PATH, coursePath, editCoursePath, isDraft, newCoursePath, totalMinutes } from "./courseUtils.js";
import "../../Study/Search/Search.css";
import "./CourseStudio.css";
// "دوراتي" كتبويب بعرض صفحة الدورات
import "./CourseStudioPanel.css";

const FILTERS = ["all", "published", "draft"];
// "متأكد؟" بترجع لطبيعتها بعد هالمدة
const CONFIRM_TIME = 3000;
const TOAST_TIME = 2400;

/**
 * مدة المحتوى: "3 س 20 د" أو "45 د"
 */
export function useLengthLabel() {
  const { t } = useTranslation();

  return (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} ${t("units.minShort")}`;
    return rest === 0 ? `${hours} ${t("units.hourShort")}` : `${hours} ${t("units.hourShort")} ${rest} ${t("units.minShort")}`;
  };
}

/**
 * غلاف الدورة: لون المسار وأيقونته، ومستوى الدورة (بالاستوديو وبمعاينة المحرّر)
 */
export function CourseCover({ communityId, level, size = 34, className = "" }) {
  const { t } = useTranslation();
  const community = findCommunity(communityId);

  return (
    <span className={`studio-cover ${className}`} style={{ "--track": community?.color }} aria-hidden="true">
      <CommunityIcon name={communityId} size={size} strokeWidth={1.6} />
      {level && <span className="studio-cover__level">{t(`community.courses.levels.${level}`)}</span>}
    </span>
  );
}

/**
 * شارة حالة الدورة: منشورة (أخضر) أو مسودة (برتقالي)
 */
export function StatusChip({ course }) {
  const { t } = useTranslation();
  const status = isDraft(course) ? "draft" : "published";

  return (
    <span className={`studio-status studio-status--${status}`}>
      <span className="studio-status__dot" aria-hidden="true" />
      {t(`studio.status.${status}`)}
    </span>
  );
}

/**
 * سطر دورة بالاستوديو: الغلاف، العنوان والحالة، الأرقام، والأدوات
 * (تعديل، عرض، نشر أو إرجاع لمسودة، وحذف بضغطتين)
 */
function StudioCourseRow({ course, isConfirming, onAskDelete, onDelete, onStatus }) {
  const { t, i18n } = useTranslation();
  const lengthLabel = useLengthLabel();
  const language = i18n.resolvedLanguage;
  const draft = isDraft(course);

  return (
    <li className={`studio-row ${draft ? "is-draft" : ""}`}>
      <Link to={editCoursePath(course.id)} className="studio-row__cover" tabIndex={-1} aria-hidden="true">
        <CourseCover communityId={course.communityId} level={course.level} />
      </Link>

      <div className="studio-row__body">
        <div className="studio-row__head">
          <StatusChip course={course} />
          <PostOrigin post={{ communityId: course.communityId, branchId: course.branchId }} />
        </div>

        <Link to={editCoursePath(course.id)} className="studio-row__title" dir="auto">
          {course.title || t("studio.editor.untitled")}
        </Link>

        <p className="studio-row__meta">
          <span>
            <Icon name="play" size={14} />
            {t("community.courses.lessonsCount", { count: course.lessons.length })}
          </span>
          <span>
            <Icon name="clock" size={14} />
            {lengthLabel(totalMinutes(course))}
          </span>
          <span>
            <Icon name="users" size={14} />
            {t("community.courses.students", { value: formatCount(course.students, language) })}
          </span>
          <span>
            <Icon name="history" size={14} />
            {t("studio.updated", { time: formatTimeAgo(course.updatedAt ?? course.editedAt ?? course.createdAt, language) })}
          </span>
        </p>
      </div>

      <div className="studio-row__actions">
        <Link to={editCoursePath(course.id)} className="studio-button studio-button--primary">
          <Icon name="feather" size={16} />
          {t("studio.actions.edit")}
        </Link>
        <Link to={coursePath(course.id)} className="studio-button">
          <Icon name="eye" size={16} />
          {t("studio.actions.view")}
        </Link>
        <button type="button" className="studio-button" onClick={() => onStatus(draft ? "published" : "draft")}>
          <Icon name={draft ? "send" : "draft"} size={16} />
          {t(draft ? "studio.actions.publish" : "studio.actions.unpublish")}
        </button>
        <button
          type="button"
          className={`studio-button studio-button--danger ${isConfirming ? "is-confirming" : ""}`}
          aria-label={isConfirming ? t("studio.actions.confirmDelete") : t("studio.actions.delete")}
          title={t("studio.actions.delete")}
          onClick={isConfirming ? onDelete : onAskDelete}
        >
          <Icon name="trash" size={16} />
          {isConfirming && <span>{t("studio.actions.confirmDelete")}</span>}
        </button>
      </div>
    </li>
  );
}

/**
 * "دوراتي" (استوديو الدورات): التبويب الثالث بصفحة الدورات (/community/courses?tab=mine)
 * الدورات اللي أنا بعملها وبنشرها (مش اللي سجّلت فيها):
 * أرقام دوراتي، فلتر (الكل / منشورة / مسودات)، وكل دورة بسطر فيه التعديل والعرض والنشر والحذف.
 * query: البحث من رأس صفحة الدورات (بعنوان الدورة ووصفها ودروسها)
 * لأصحاب شارة القيمة العلمية بس.
 */
export function StudioPanel({ query = "" }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, badges } = useOutletContext();
  const lengthLabel = useLengthLabel();
  const [filter, setFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState(null);
  // رسالة من صفحة ثانية (مثلًا بعد الحذف من صفحة الدورة)
  const [toast, setToast] = useState(location.state?.toast ?? null);

  // نمسح الرسالة من الرابط حتى ما ترجع مع التحديث (والتبويب بيضل بالرابط)
  useEffect(() => {
    if (location.state?.toast) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_TIME);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmingId) return;
    const timer = setTimeout(() => setConfirmingId(null), CONFIRM_TIME);
    return () => clearTimeout(timer);
  }, [confirmingId]);

  // بدون شارة القيمة العلمية: ما في دورات تنشرها
  if (!badges.isScholar) {
    return (
      <div className="studio-panel">
        <EmptyState icon="lock" title={t("community.courses.lockedTitle")} text={t("community.courses.onlyScholars")}>
          <Link to="/community/badges" className="search-clear">
            {t("community.nav.badges")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  // دوراتي: آخر وحدة تعدّلت أول
  const mine = courses.courses
    .filter((course) => course.isMine)
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
  const drafts = mine.filter(isDraft);
  const published = mine.filter((course) => !isDraft(course));

  // البحث: بالعنوان والوصف وعناوين الدروس
  const search = query.trim().toLowerCase();
  const matches = (course) =>
    !search ||
    [course.title, course.description, ...course.lessons.map((lesson) => lesson.title)].some((text) =>
      text?.toLowerCase().includes(search)
    );
  const found = mine.filter(matches);
  const counts = {
    all: found.length,
    published: found.filter((course) => !isDraft(course)).length,
    draft: found.filter(isDraft).length,
  };
  const visible = found.filter((course) => filter === "all" || (filter === "draft") === isDraft(course));

  const totals = {
    students: published.reduce((sum, course) => sum + course.students, 0),
    lessons: mine.reduce((sum, course) => sum + course.lessons.length, 0),
    minutes: mine.reduce((sum, course) => sum + totalMinutes(course), 0),
  };

  function changeStatus(course, status) {
    courses.setCourseStatus(course.id, status);
    setToast(t(status === "published" ? "studio.toasts.published" : "studio.toasts.unpublished"));
  }

  function remove(course) {
    courses.deleteCourse(course.id);
    setConfirmingId(null);
    setToast(t("studio.toasts.deleted"));
  }

  return (
    <>
      <div className="studio-panel">
        {/* رأس التبويب: شو هاد المكان، وزر "دورة جديدة" */}
        <header className="studio-hero">
          <div className="studio-hero__text">
            <span className="studio-hero__icon" aria-hidden="true">
              <Icon name="graduation" size={24} />
            </span>
            <div>
              <h2 className="studio-hero__title">{t("studio.panelTitle")}</h2>
              <p className="studio-hero__subtitle">{t("studio.subtitle")}</p>
            </div>
          </div>
          <Link to={newCoursePath()} className="studio-button studio-button--primary studio-button--big">
            <Icon name="plus" size={18} strokeWidth={2.5} />
            {t("studio.newCourse")}
          </Link>
        </header>

        {/* الأرقام */}
        <ul className="studio-stats">
          <li className="studio-stat">
            <span className="studio-stat__icon">
              <Icon name="graduation" size={20} />
            </span>
            <strong>{mine.length}</strong>
            <span className="studio-stat__label">{t("studio.stats.courses")}</span>
            <span className="studio-stat__hint">
              {t("studio.stats.published", { count: published.length })} · {t("studio.stats.drafts", { count: drafts.length })}
            </span>
          </li>
          <li className="studio-stat studio-stat--blue">
            <span className="studio-stat__icon">
              <Icon name="users" size={20} />
            </span>
            <strong>{formatCount(totals.students, i18n.resolvedLanguage)}</strong>
            <span className="studio-stat__label">{t("studio.stats.students")}</span>
          </li>
          <li className="studio-stat studio-stat--orange">
            <span className="studio-stat__icon">
              <Icon name="play" size={20} />
            </span>
            <strong>{totals.lessons}</strong>
            <span className="studio-stat__label">{t("studio.stats.lessons")}</span>
          </li>
          <li className="studio-stat studio-stat--purple">
            <span className="studio-stat__icon">
              <Icon name="clock" size={20} />
            </span>
            <strong dir="auto">{lengthLabel(totals.minutes)}</strong>
            <span className="studio-stat__label">{t("studio.stats.content")}</span>
          </li>
        </ul>

        {mine.length === 0 ? (
          <div className="studio-empty">
            <span className="studio-empty__icon" aria-hidden="true">
              <Icon name="graduation" size={34} />
            </span>
            <h2>{t("studio.empty.title")}</h2>
            <p>{t("studio.empty.text")}</p>
            <Link to={newCoursePath()} className="studio-button studio-button--primary studio-button--big">
              <Icon name="plus" size={18} strokeWidth={2.5} />
              {t("studio.newCourse")}
            </Link>
          </div>
        ) : (
          <>
            {/* فلتر الحالة */}
            <div className="studio-filters" role="group" aria-label={t("studio.filters.label")}>
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="studio-filter"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {t(`studio.filters.${item}`)}
                  <span className="studio-filter__count">{counts[item]}</span>
                </button>
              ))}
            </div>

            {visible.length > 0 ? (
              <ul className="studio-list">
                {visible.map((course) => (
                  <StudioCourseRow
                    key={course.id}
                    course={course}
                    isConfirming={confirmingId === course.id}
                    onAskDelete={() => setConfirmingId(course.id)}
                    onDelete={() => remove(course)}
                    onStatus={(status) => changeStatus(course, status)}
                  />
                ))}
              </ul>
            ) : (
              <p className="studio-list__empty">
                {search ? t("studio.empty.noMatch", { query: query.trim() }) : t("studio.empty.filtered")}
              </p>
            )}
          </>
        )}
      </div>

      {/* برّا الـ panel: حتى يضل ثابت تحت الشاشة */}
      {toast && (
        <div className="studio-toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </>
  );
}

/**
 * الرابط القديم /community/studio: بيحوّل لتبويب "دوراتي" بصفحة الدورات (ومعه أي رسالة)
 */
function CourseStudio() {
  const location = useLocation();

  return <Navigate to={STUDIO_PATH} replace state={location.state} />;
}

export default CourseStudio;