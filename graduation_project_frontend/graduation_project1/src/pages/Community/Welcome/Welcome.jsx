import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router";
import Logo from "../../../components/Logo/Logo.jsx";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import { BranchList } from "../BranchPicker/BranchPicker.jsx";
import { COMMUNITIES, GENERAL_ID, branchKey, localName } from "../../../data/communities.js";
import { formatCount } from "../../../utils/format.js";
import "./Welcome.css";

/**
 * أول دخول للتواصل: "شو بيهمك؟" (إجباري ومرة واحدة فقط)
 * الخطوة 1: اختيار مسار واحد على الأقل (زر "التالي" معطّل قبلها)
 * الخطوة 2: اختيار فروع كل مسار (اختياري: بدون فروع بتوصلك منشورات المسار العامة)،
 *           مع بحث لما الفروع تكثر
 * الاختيارات تتغير لاحقًا من صفحة المجتمعات.
 */
function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { memberships } = useOutletContext();
  const language = i18n.resolvedLanguage;

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);
  // الفروع المختارة: { communityId: [branchId, ...] }
  const [branches, setBranches] = useState({});

  const chosen = COMMUNITIES.filter((community) => selected.includes(community.id));

  function toggleCommunity(community) {
    setSelected((current) =>
      current.includes(community.id) ? current.filter((id) => id !== community.id) : [...current, community.id]
    );
  }

  // فروع مسار: إنت بتختارها (ما في شي مختار لحاله)
  function changeBranches(communityId, branchIds) {
    setBranches((current) => ({ ...current, [communityId]: branchIds }));
  }

  function finish() {
    const branchKeys = chosen.flatMap((community) =>
      (branches[community.id] ?? []).map((branchId) => branchKey(community.id, branchId))
    );

    memberships.completeOnboarding(selected, branchKeys);
    navigate("/community", { replace: true });
  }

  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <header className="welcome__head">
        <Logo />
        {/* الخطوات */}
        <ol className="welcome__steps" aria-label={t("community.welcome.steps")}>
          {[1, 2].map((item) => (
            <li key={item} className={item <= step ? "is-done" : ""} aria-current={item === step ? "step" : undefined}>
              {item}
            </li>
          ))}
        </ol>
      </header>

      {step === 1 ? (
        <>
          <h1 id="welcome-title" className="welcome__title">
            {t("community.welcome.title")}
          </h1>
          <p className="welcome__text">{t("community.welcome.text")}</p>

          <ul className="welcome__grid">
            {COMMUNITIES.map((community) => {
              const isSelected = selected.includes(community.id);

              return (
                <li key={community.id}>
                  <button
                    type="button"
                    className={`welcome-card ${isSelected ? "is-selected" : ""} ${
                      community.id === GENERAL_ID ? "welcome-card--general" : ""
                    }`}
                    style={{ "--track": community.color }}
                    aria-pressed={isSelected}
                    onClick={() => toggleCommunity(community)}
                  >
                    <span className="welcome-card__icon">
                      <CommunityIcon name={community.id} size={26} />
                    </span>
                    <span className="welcome-card__check" aria-hidden="true">
                      <Icon name="check" size={14} strokeWidth={3} />
                    </span>
                    <strong className="welcome-card__name">{localName(community, language)}</strong>
                    <span className="welcome-card__description">
                      {community.description[language] ?? community.description.en}
                    </span>
                    <span className="welcome-card__meta">
                      {community.id === GENERAL_ID
                        ? t("community.welcome.generalNote")
                        : t("community.membersCount", { value: formatCount(community.members, language) })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className="welcome__footer">
            <span className="welcome__count">
              {selected.length > 0
                ? t("community.welcome.selected", { count: selected.length })
                : t("community.welcome.pickOne")}
            </span>
            <button type="button" className="welcome__next" disabled={selected.length === 0} onClick={() => setStep(2)}>
              {t("community.welcome.next")}
              <Icon name="arrowRight" size={18} className="welcome__arrow" />
            </button>
          </footer>
        </>
      ) : (
        <>
          <h1 id="welcome-title" className="welcome__title">
            {t("community.welcome.branchesTitle")}
          </h1>
          <p className="welcome__text">{t("branches.welcomeText")}</p>

          <div className="welcome__branches">
            {chosen.map((community) => (
              <fieldset key={community.id} className="welcome-branches" style={{ "--track": community.color }}>
                <legend className="welcome-branches__title">
                  <span className="welcome-branches__icon">
                    <CommunityIcon name={community.id} size={18} />
                  </span>
                  {localName(community, language)}
                </legend>

                {community.branches.length > 0 ? (
                  <BranchList
                    community={community}
                    selected={branches[community.id] ?? []}
                    onChange={(branchIds) => changeBranches(community.id, branchIds)}
                    className="branch-list--scroll"
                  />
                ) : (
                  <p className="welcome__text">{t("branches.count", { count: 0 })}</p>
                )}
              </fieldset>
            ))}
          </div>

          <footer className="welcome__footer">
            <button type="button" className="welcome__back" onClick={() => setStep(1)}>
              {t("community.welcome.back")}
            </button>
            <button type="button" className="welcome__next" onClick={finish}>
              {t("community.welcome.finish")}
              <Icon name="check" size={18} strokeWidth={2.5} />
            </button>
          </footer>

          <p className="welcome__later">{t("community.welcome.later")}</p>
        </>
      )}
    </section>
  );
}

export default Welcome;