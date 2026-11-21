import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import JoinButton from "../JoinButton/JoinButton.jsx";
import { communityPath, localName } from "../../../data/communities.js";
import "./BranchPicker.css";

// البحث بيظهر لما الفروع تكثر
const SEARCH_FROM = 7;
// "متأكد؟" بترجع لطبيعتها بعد هالمدة
const CONFIRM_TIME = 3000;

// البحث بالاسم (عربي وإنجليزي) وبالأدوات: "react" بتلاقي فرع React وفرع Frameworks
function matchesBranch(branch, query) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  return [branch.name.ar, branch.name.en, ...(branch.tags ?? [])].some((text) => text?.toLowerCase().includes(search));
}

/**
 * قائمة فروع مجتمع للاختيار: بحث (لما تكثر)، "اختار الكل / شيل الكل"، وكل فرع مربع اختيار.
 * بتنفع لو الفروع 3 أو 50: الشبكة بتترتب لحالها، والقائمة بتنزل داخل مكانها.
 * selected: أرقام الفروع المختارة  •  onChange(ids)
 * canOpen: كل فرع فيه سهم بيفتح صفحته  •  onOpen: لما يفتح صفحة فرع (مثلًا سكّر النافذة)
 * activeId: الفرع المفتوح هلأ (بيتلوّن)
 * className: "branch-list--scroll" حتى القائمة تنزل جوّا مكانها (مثلًا بصفحة "شو بيهمك؟")
 */
export function BranchList({ community, selected, onChange, canOpen = false, onOpen, activeId, className = "" }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const language = i18n.resolvedLanguage;
  const branches = community.branches;
  const visible = branches.filter((branch) => matchesBranch(branch, query));
  const isAllVisibleSelected = visible.length > 0 && visible.every((branch) => selected.includes(branch.id));

  function toggle(branchId) {
    onChange(selected.includes(branchId) ? selected.filter((id) => id !== branchId) : [...selected, branchId]);
  }

  // "اختار الكل / شيل الكل" بيشتغل على نتيجة البحث بس
  function toggleVisible() {
    const visibleIds = visible.map((branch) => branch.id);
    onChange(
      isAllVisibleSelected
        ? selected.filter((id) => !visibleIds.includes(id))
        : [...new Set([...selected, ...visibleIds])]
    );
  }

  return (
    <div className={`branch-list ${className}`} style={{ "--track": community.color }}>
      {branches.length >= SEARCH_FROM && (
        <label className="branch-list__search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            placeholder={t("branches.search")}
            aria-label={t("branches.search")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}

      <div className="branch-list__bar">
        <span>{t("branches.selected", { selected: selected.length, total: branches.length })}</span>
        {visible.length > 0 && (
          <button type="button" className="branch-list__all" onClick={toggleVisible}>
            {t(isAllVisibleSelected ? "branches.clearAll" : "branches.selectAll")}
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <ul className="branch-list__items">
          {visible.map((branch) => {
            const name = localName(branch, language);
            const isSelected = selected.includes(branch.id);

            return (
              <li
                key={branch.id}
                className={`branch-option ${isSelected ? "is-selected" : ""} ${branch.id === activeId ? "is-active" : ""}`}
              >
                <label className="branch-option__label">
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(branch.id)} />
                  <span className="branch-option__check" aria-hidden="true">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                  <span className="branch-option__text">
                    <strong dir="auto">
                      {name}
                      {/* فرع فتحته الإدارة بعد طلب */}
                      {branch.isNew && <span className="branch-option__new">{t("community.branchRequests.new")}</span>}
                    </strong>
                    {branch.tags?.length > 0 && (
                      <small dir="ltr">{branch.tags.slice(0, 3).join(" · ")}</small>
                    )}
                  </span>
                </label>
                {canOpen && (
                  <Link
                    to={communityPath(community.id, branch.id)}
                    className="branch-option__open"
                    aria-label={t("branches.open", { name })}
                    title={t("branches.open", { name })}
                    aria-current={branch.id === activeId ? "page" : undefined}
                    onClick={onOpen}
                  >
                    <Icon name="arrowRight" size={15} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="branch-list__empty">{t("branches.noMatch", { query: query.trim() })}</p>
      )}
    </div>
  );
}

/**
 * نافذة فروع مجتمع: للانضمام (بتختار الفروع اللي بدك ياها) أو لتعديل فروعك (مع "غادر المجتمع").
 * بدون فروع مختارة = انضمام للمجتمع لحاله (منشوراته اللي مش بفرع معيّن).
 * community: المجتمع  •  onClose: سكّر النافذة
 */
function BranchPicker({ community, onClose }) {
  const { t, i18n } = useTranslation();
  const { memberships } = useOutletContext();
  const name = localName(community, i18n.resolvedLanguage);
  const isJoined = memberships.isJoined(community.id);
  const [selected, setSelected] = useState(() => memberships.joinedBranchesOf(community.id));
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const branchesLabel = t("branches.count", { count: selected.length });

  // الإغلاق بـ Escape، والصفحة ورا ما بتنزل والنافذة مفتوحة
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isConfirmingLeave) return;
    const timer = setTimeout(() => setIsConfirmingLeave(false), CONFIRM_TIME);
    return () => clearTimeout(timer);
  }, [isConfirmingLeave]);

  function save() {
    memberships.setCommunityBranches(community.id, selected);
    onClose();
  }

  function leave() {
    memberships.toggleCommunity(community.id);
    onClose();
  }

  return createPortal(
    <div className="branch-picker" onClick={onClose}>
      <div
        className="branch-picker__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-picker-title"
        style={{ "--track": community.color }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="branch-picker__head">
          <span className="branch-picker__icon" aria-hidden="true">
            <CommunityIcon name={community.id} size={22} />
          </span>
          <div>
            <h2 id="branch-picker-title">
              {t(isJoined ? "branches.manageTitle" : "branches.joinTitle", { name })}
            </h2>
            <p>{t(isJoined ? "branches.manageText" : "branches.joinText")}</p>
          </div>
          <button type="button" className="branch-picker__close" aria-label={t("branches.close")} onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="branch-picker__body">
          <BranchList community={community} selected={selected} onChange={setSelected} canOpen onOpen={onClose} />
        </div>

        {selected.length === 0 && (
          <p className="branch-picker__hint">
            <Icon name="flag" size={14} />
            {t("branches.noneHint", { name })}
          </p>
        )}

        <footer className="branch-picker__footer">
          {isJoined && (
            <button
              type="button"
              className={`branch-picker__leave ${isConfirmingLeave ? "is-confirming" : ""}`}
              onClick={isConfirmingLeave ? leave : () => setIsConfirmingLeave(true)}
            >
              {t(isConfirmingLeave ? "branches.confirmLeave" : "branches.leave")}
            </button>
          )}
          <button type="button" className="branch-picker__button" onClick={onClose}>
            {t("branches.cancel")}
          </button>
          <button type="button" className="branch-picker__button branch-picker__button--primary" onClick={save}>
            {isJoined
              ? t("branches.save")
              : selected.length > 0
                ? t("branches.joinWith", { branches: branchesLabel })
                : t("branches.joinOnly")}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/**
 * زر الانضمام لمجتمع:
 * - مش منضم: "انضم" بيفتح نافذة الفروع (onPick) حتى تختار.
 * - منضم: "منضم · 3 فروع" بيفتح نافذة الفروع للتعديل أو المغادرة.
 * - مجتمع بدون فروع أصلًا: زر الانضمام والمغادرة العادي.
 * onPick: افتح نافذة الفروع لهاد المجتمع
 */
export function CommunityJoinButton({ community, size, onPick }) {
  const { t, i18n } = useTranslation();
  const { memberships } = useOutletContext();
  const name = localName(community, i18n.resolvedLanguage);
  const isJoined = memberships.isJoined(community.id);

  if (community.branches.length === 0) {
    return (
      <JoinButton
        size={size}
        isJoined={isJoined}
        label={t(isJoined ? "community.join.leaveNamed" : "community.join.joinNamed", { name })}
        onToggle={() => memberships.toggleCommunity(community.id)}
      />
    );
  }

  if (!isJoined) {
    return (
      <JoinButton
        size={size}
        isJoined={false}
        label={t("community.join.joinNamed", { name })}
        onToggle={onPick}
      />
    );
  }

  const count = memberships.joinedBranchesOf(community.id).length;

  return (
    <button
      type="button"
      className={`join-manage ${size === "small" ? "join-manage--small" : ""}`}
      aria-label={t("branches.manageLabel", { name })}
      onClick={(event) => {
        // داخل بطاقة قابلة للضغط: الزر لا يفتح البطاقة
        event.preventDefault();
        event.stopPropagation();
        onPick();
      }}
    >
      <Icon name="check" size={15} strokeWidth={2.5} />
      {t("branches.joinedWith", { branches: t("branches.count", { count }) })}
      <Icon name="chevronDown" size={15} />
    </button>
  );
}

export default BranchPicker;