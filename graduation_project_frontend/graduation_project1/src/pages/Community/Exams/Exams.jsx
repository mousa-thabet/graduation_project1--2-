import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { TypeTabs } from "../PostList/PostList.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import CatalogSearch from "../CatalogSearch/CatalogSearch.jsx";
import CatalogFilters, { ShowMoreButton } from "../CatalogSearch/CatalogFilters.jsx";
import { findCommunity } from "../../../data/communities.js";
import { communityProfilePath } from "../../../data/communityPeople.js";
import { formatTimeAgo } from "../../../utils/format.js";
import { searchCatalog, sortCatalog } from "../../../utils/catalogSearch.js";
import { usePaged } from "../../../hooks/usePaged.js";
import { useCatalogPlace } from "../../../hooks/useCatalogPlace.js";
import { CREATE_EXAM_PATH, examPath } from "./examUtils.js";
import "../../Study/Search/Search.css";
import "./Exams.css";

// التبويبات: امتحانات مجتمعاتي، اللي قدمتها، واللي نشرتها (لصاحب الشارة)
const TABS = ["all", "done"];
const SCHOLAR_TABS = [...TABS, "mine"];

/**
 * كاتب الامتحان: الصورة والاسم والشارات (رابط لحسابه في التواصل)
 */
export function ExamAuthor({ author, isMine }) {
  const to = isMine ? "/community/profile" : communityProfilePath(author.handle);

  return (
    <Link to={to} className="exam-author">
      <span className="exam-author__avatar" aria-hidden="true">
        <Avatar person={author} />
      </span>
      <strong dir="auto">{author.name}</strong>
      <UserBadges badges={author.badges} size={15} />
    </Link>
  );
}

/**
 * بطاقة امتحان: المكان، العنوان، الكاتب، عدد الأسئلة والمدة، وعلامتي إن قدمته.
 * (تُستخدم كمان بتبويب "الامتحانات" بحساب التواصل)
 */
export function ExamCard({ exam, result, me }) {
  const { t, i18n } = useTranslation();
  const community = findCommunity(exam.communityId);
  const author = exam.isMine ? me : exam.author;

  return (
    <li className="exam-card" style={{ "--track": community?.color }}>
      <PostOrigin post={{ communityId: exam.communityId, branchId: exam.branchId }} />

      <Link to={examPath(exam.id)} className="exam-card__title" dir="auto">
        {exam.title}
      </Link>
      {exam.description && (
        <p className="exam-card__description" dir="auto">
          {exam.description}
        </p>
      )}

      <div className="exam-card__footer">
        <ExamAuthor author={author} isMine={exam.isMine} />

        <span className="exam-card__meta">
          <Icon name="checkSquare" size={14} />
          {t("community.exams.questionsCount", { count: exam.questions.length })}
          <span aria-hidden="true">·</span>
          <Icon name="clock" size={14} />
          {t("community.exams.minutes", { count: exam.duration })}
          <span aria-hidden="true">·</span>
          {formatTimeAgo(exam.createdAt, i18n.resolvedLanguage)}
        </span>

        {/* علامتي، أو زر البدء */}
        {result ? (
          <Link to={examPath(exam.id)} className="exam-card__score">
            {t("community.exams.score", { score: result.score, total: result.total })}
          </Link>
        ) : (
          <Link to={examPath(exam.id)} className="exam-card__start">
            {t("community.exams.start")}
          </Link>
        )}
      </div>
    </li>
  );
}

/**
 * زر إضافة امتحان: بأول تبويب "نشرتها" (لأصحاب شارة القيمة العلمية بس)
 */
function CreateExamButton() {
  const { t } = useTranslation();

  return (
    <Link to={CREATE_EXAM_PATH} className="exams-create">
      <span className="exams-create__icon" aria-hidden="true">
        <Icon name="filePen" size={22} />
      </span>
      <span>
        <strong>{t("community.exams.create")}</strong>
        {t("community.exams.createText")}
      </span>
    </Link>
  );
}

// نصوص الأسئلة والخيارات (حتى البحث يلاقي الامتحان من سؤال فيه)
const examTexts = (exam) => exam.questions.flatMap((question) => [question.text, ...question.options]);

/**
 * قسم الامتحانات: /community/exams
 * بس امتحانات المجتمعات اللي أنا داخل فيها (وفروعها). حتى لو صاروا ألف امتحان بتلاقي اللي بدك ياه:
 * - البحث فوق برأس الصفحة الثابت (بيضل ظاهر، وزر "/" بيفتحه): بالعنوان، الكاتب، المجتمع، أو سؤال جواته
 * - فلتر المجتمع (قائمة منسدلة)، وبعد ما تختار مجتمع بيظهر جنبه فلتر الفروع، والترتيب
 * - القائمة بتنعرض 10 ورا 10 ("عرض المزيد") بدل ما ترسم ألف بطاقة مرة وحدة
 * إضافة امتحان: زر "أنشئ امتحان" بأول تبويب "نشرتها" (بيظهر لأصحاب شارة القيمة العلمية بس).
 * التبويب محفوظ بالرابط (?tab=mine) فبترجعله لو حدّثت الصفحة.
 */
function Exams() {
  const { t } = useTranslation();
  const { exams, memberships, badges, me } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = badges.isScholar ? SCHOLAR_TABS : TABS;
  // التبويب من الرابط، ولو مش مسموح (مثلًا "نشرتها" بدون شارة) بنرجع لـ "الكل"
  const requestedTab = searchParams.get("tab");
  const tab = tabs.includes(requestedTab) ? requestedTab : "all";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const isSearching = query.trim() !== "";

  // 1. بس امتحانات مجتمعاتي  2. التبويب  3. المجتمع والفرع المختارين  4. البحث أو الترتيب
  const tabExams = exams.exams.filter(memberships.isInMyCommunities).filter((exam) => {
    if (tab === "mine") return exam.isMine;
    if (tab === "done") return Boolean(exams.results[exam.id]);
    return true;
  });
  const place = useCatalogPlace(tabExams, memberships);
  const results = isSearching
    ? searchCatalog(place.filtered, query, examTexts)
    : sortCatalog(place.filtered, sort, (exam) => exam.duration);

  // أي تغيير بالبحث أو الفلاتر يرجّع القائمة لأول 10
  const paged = usePaged(results, [tab, query, place.key, sort].join("|"));

  function changeTab(next) {
    setSearchParams(next === "all" ? {} : { tab: next }, { replace: true });
  }

  const emptyKey = tab === "all" ? "empty" : `empty${tab === "done" ? "Done" : "Mine"}`;

  return (
    <>
      {/* البحث جوا الرأس الثابت: بيضل ظاهر وإنت نازل بالقائمة */}
      <StudyHeader title={t("community.nav.exams")}>
        <CatalogSearch
          className="catalog-search--header"
          value={query}
          onChange={setQuery}
          placeholder={t("community.exams.searchPlaceholder")}
        />
        <TypeTabs value={tab} onChange={changeTab} tabs={tabs} />
      </StudyHeader>

      {/* نشرتها: زر إضافة امتحان جديد فوق امتحاناتي */}
      {tab === "mine" && <CreateExamButton />}

      {tabExams.length > 0 && (
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
          <ul className="exams-list">
            {paged.visible.map((exam) => (
              <ExamCard key={exam.id} exam={exam} result={exams.results[exam.id]} me={me} />
            ))}
          </ul>
          {paged.hasMore && <ShowMoreButton remaining={paged.remaining} onClick={paged.showMore} />}
        </>
      ) : tabExams.length > 0 ? (
        // في امتحانات بس ما في ولا وحد مطابق للبحث أو للمجتمع والفرع المختارين
        <EmptyState
          icon="search"
          title={isSearching ? t("community.search.noResults", { query: query.trim() }) : t("community.catalog.noneHere")}
          text={t("community.search.noResultsText")}
        >
          {place.isFiltered && (
            <button type="button" className="search-clear" onClick={place.filterProps.onClear}>
              {t("community.catalog.clearFilters")}
            </button>
          )}
        </EmptyState>
      ) : (
        <EmptyState
          icon="checkSquare"
          title={t(`community.exams.${emptyKey}.title`)}
          // نشرتها: زر الإضافة فوق بيكفي، فبس العنوان
          text={tab === "mine" ? null : t(`community.exams.${emptyKey}.text`)}
        />
      )}
    </>
  );
}

export default Exams;