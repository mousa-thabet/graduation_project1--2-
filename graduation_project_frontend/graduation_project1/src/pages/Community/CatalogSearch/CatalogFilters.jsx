import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import FilterSelect from "./FilterSelect.jsx";
import { localName } from "../../../data/communities.js";
import { CATALOG_SORTS } from "../../../utils/catalogSearch.js";
import "./CatalogSearch.css";

/**
 * فلاتر الامتحانات والدورات تحت البحث (قوائم منسدلة بدل الأزرار الأفقية):
 * - المجتمع: كل مجتمعاتي أو مجتمع واحد (مع عدد العناصر بكل وحد)
 * - الفرع: بيظهر جنبه بس لما تختار مجتمع إله فروع
 * - الترتيب، وعدد النتائج، وزر مسح الفلاتر
 * القيم والدوال من useCatalogPlace (filterProps)، وفوقها:
 * sort / onSort: الترتيب (بيتعطّل وقت البحث لأن النتائج مرتبة حسب الأقرب)
 * total: عدد النتائج  •  isSearching: في بحث شغال
 */
function CatalogFilters({
  communities,
  allCount,
  countOf,
  communityId,
  onCommunity,
  branches,
  branchId,
  onBranch,
  branchCountOf,
  onClear,
  sort,
  onSort,
  total,
  isSearching,
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  const communityOptions = [
    { value: "all", label: t("community.catalog.allCommunities"), count: allCount },
    ...communities.map((community) => ({
      value: community.id,
      label: localName(community, language),
      color: community.color,
      count: countOf(community.id),
    })),
  ];

  const branchOptions = [
    { value: "all", label: t("community.catalog.allBranches") },
    ...branches.map((branch) => ({ value: branch.id, label: localName(branch, language), count: branchCountOf(branch.id) })),
  ];

  const sortOptions = isSearching
    ? [{ value: "relevance", label: t("community.catalog.sorts.relevance") }]
    : CATALOG_SORTS.map((item) => ({ value: item, label: t(`community.catalog.sorts.${item}`) }));

  const showBranches = communityId !== "all" && branches.length > 0;

  return (
    <div className="catalog-filters">
      <div className="catalog-filters__bar" role="group" aria-label={t("community.catalog.filters")}>
        <FilterSelect
          icon="filter"
          label={t("community.composer.community")}
          options={communityOptions}
          value={communityId}
          onChange={onCommunity}
        />

        {/* الفرع: بعد اختيار مجتمع */}
        {showBranches && (
          <FilterSelect
            icon="layers"
            label={t("community.composer.branch")}
            options={branchOptions}
            value={branchId}
            onChange={onBranch}
          />
        )}

        <FilterSelect
          label={t("community.catalog.sortBy")}
          options={sortOptions}
          value={isSearching ? "relevance" : sort}
          onChange={onSort}
          disabled={isSearching}
        />
      </div>

      <div className="catalog-filters__row">
        <span className="catalog-filters__count" role="status">
          {t("community.catalog.results", { count: total })}
        </span>

        {communityId !== "all" && (
          <button type="button" className="catalog-filters__clear" onClick={onClear}>
            <Icon name="x" size={14} strokeWidth={2.5} />
            {t("community.catalog.clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * زر "عرض المزيد" أسفل القائمة.
 * remaining: كم عنصر ضايل  •  onClick: الدفعة الجاية
 */
export function ShowMoreButton({ remaining, onClick }) {
  const { t } = useTranslation();

  return (
    <button type="button" className="catalog-more" onClick={onClick}>
      {t("community.catalog.showMore", { count: remaining })}
    </button>
  );
}

export default CatalogFilters;