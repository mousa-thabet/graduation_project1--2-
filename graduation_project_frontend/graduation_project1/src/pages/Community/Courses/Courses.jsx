import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import CatalogSearch from "../CatalogSearch/CatalogSearch.jsx";
import CatalogFilters, { ShowMoreButton } from "../CatalogSearch/CatalogFilters.jsx";
import { ExamAuthor } from "../Exams/Exams.jsx";
import { findCommunity } from "../../../data/communities.js";
import { formatCount } from "../../../utils/format.js";
import { searchCatalog, sortCatalog } from "../../../utils/catalogSearch.js";
import { usePaged } from "../../../hooks/usePaged.js";
import { useCatalogPlace } from "../../../hooks/useCatalogPlace.js";
import { COURSE_TABS, coursePath, isDraft, totalMinutes } from "./courseUtils.js";
import { StudioPanel } from "./CourseStudio.jsx";
import "../Exams/Exams.css";
import "./Courses.css";

// عناوين الدروس وشرحها (حتى البحث يلاقي الدورة من درس فيها)
const lessonTexts = (course) => course.lessons.flatMap((lesson) => [lesson.title, lesson.notes]);

/**
 * بطاقة دورة: غلاف بلون المسار، المكان، العنوان، الكاتب، الدروس والمدة والمستوى، وتقدّمي إن سجّلت.
 * (تُستخدم كمان بتبويب "الدورات" بحساب التواصل)
 */
export function CourseCard({ course, me }) {
  const { t, i18n } = useTranslation();
  const { courses } = useOutletContext();
  const community = findCommunity(course.communityId);
  const author = course.isMine ? me : course.author;
  const isEnrolled = courses.isEnrolled(course.id);
  const percent = courses.percentOf(course);

  return (
    <li className="course-card" style={{ "--track": community?.color }}>
      <Link to={coursePath(course.id)} className="course-card__cover" tabIndex={-1} aria-hidden="true">
        <CommunityIcon name={course.communityId} size={44} strokeWidth={1.6} />
        <span className="course-card__level">{t(`community.courses.levels.${course.level}`)}</span>
      </Link>

      <div className="course-card__body">
        <PostOrigin post={{ communityId: course.communityId, branchId: course.branchId }} />

        <Link to={coursePath(course.id)} className="course-card__title" dir="auto">
          {course.title}
        </Link>
        {course.description && (
          <p className="course-card__description" dir="auto">
            {course.description}
          </p>
        )}

        <ExamAuthor author={author} isMine={course.isMine} />

        <p className="course-card__meta">
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

        {/* تقدّمي بالدورة */}
        {isEnrolled && (
          <div className="course-progress">
            <span className="course-progress__track" aria-hidden="true">
              <span style={{ width: `${percent}%` }} />
            </span>
            <span className="course-progress__label">{t("community.courses.percent", { value: percent })}</span>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * قسم الدورات: /community/courses (والتبويب بالرابط: ?tab=enrolled أو ?tab=mine)
 * 3 تبويبات:
 *   الدورات: الدورات المنشورة بالمجتمعات اللي أنا داخل فيها
 *   المسجّلة: الدورات اللي سجّلت فيها وعم بتعلّمها
 *   دوراتي: الدورات اللي أنا بعملها وبنشرها (استوديو الدورات، لأصحاب شارة القيمة العلمية)
 * بحث ثابت برأس الصفحة (بالعنوان، الكاتب، المجتمع، أو درس جواها)، فلتر المجتمع، ترتيب، و"عرض المزيد".
 */
function Courses() {
  const { t } = useTranslation();
  const { courses, memberships, badges, me } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const tab = COURSE_TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "all";
  const isSearching = query.trim() !== "";

  // التبويب بالرابط: الرجوع من المحرّر أو من صفحة دورة بيرجعك لنفس التبويب
  function changeTab(next) {
    setSearchParams(next === "all" ? {} : { tab: next }, { replace: true });
  }

  // 1. بس الدورات المنشورة بمجتمعاتي  2. التبويب  3. المجتمع والفرع المختارين  4. البحث أو الترتيب
  const tabCourses = courses.courses
    .filter((course) => !isDraft(course))
    .filter(memberships.isInMyCommunities)
    .filter((course) => tab !== "enrolled" || courses.isEnrolled(course.id));
  const place = useCatalogPlace(tabCourses, memberships);
  const placeCourses = place.filtered;
  const results = isSearching
    ? searchCatalog(placeCourses, query, lessonTexts)
    : sortCatalog(placeCourses, sort, totalMinutes);

  // أي تغيير بالبحث أو الفلاتر يرجّع القائمة لأول 10
  const paged = usePaged(results, [tab, query, place.key, sort].join("|"));
  const empty = tab === "enrolled" ? "studio.emptyEnrolled" : "community.courses.empty.all";

  return (
    <>
      {/* البحث جوا الرأس الثابت: بيضل ظاهر وإنت نازل بالقائمة */}
      <StudyHeader title={t("community.nav.courses")}>
        <CatalogSearch
          className="catalog-search--header"
          value={query}
          onChange={setQuery}
          placeholder={t(tab === "mine" ? "studio.searchPlaceholder" : "community.courses.searchPlaceholder")}
        />
        <div className="study-tabs" role="tablist" aria-label={t("studio.tabs.label")}>
          {COURSE_TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => changeTab(item)}
            >
              {t(`studio.tabs.${item}`)}
            </button>
          ))}
        </div>
      </StudyHeader>

      {/* دوراتي: الدورات اللي بعملها (بنفس البحث) */}
      {tab === "mine" ? (
        <StudioPanel query={query} />
      ) : (
        <>
          {/* بدون شارة القيمة العلمية: بتقدر تتعلّم بس، والنشر بدّه شارة */}
          {!badges.isScholar && (
            <p className="community-disclaimer">
              <Icon name="shield" size={16} />
              <span>
                {t("community.courses.onlyScholars")}{" "}
                <Link to="/community/badges" className="exams-link">
                  {t("community.nav.badges")}
                </Link>
              </span>
            </p>
          )}

          {tabCourses.length > 0 && (
            <CatalogFilters
              {...place.filterProps}
              sort={sort}
              onSort={setSort}
              total={results.length}
              isSearching={isSearching}
            />
          )}

          {results.length > 0 ? (
            <>
              <ul className="courses-list">
                {paged.visible.map((course) => (
                  <CourseCard key={course.id} course={course} me={me} />
                ))}
              </ul>
              {paged.hasMore && <ShowMoreButton remaining={paged.remaining} onClick={paged.showMore} />}
            </>
          ) : tabCourses.length > 0 ? (
            <EmptyState
              icon="search"
              title={isSearching ? t("community.search.noResults", { query: query.trim() }) : t("community.catalog.noneHere")}
              text={t("community.search.noResultsText")}
            />
          ) : (
            <EmptyState icon="graduation" title={t(`${empty}.title`)} text={t(`${empty}.text`)} />
          )}
        </>
      )}
    </>
  );
}

export default Courses;