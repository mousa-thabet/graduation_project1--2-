import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../components/Icon/Icon.jsx";
import CommunityIcon from "../../components/CommunityIcon/CommunityIcon.jsx";
import {
  COMMUNITIES,
  addBranch,
  addCommunity,
  communityPath,
  findCommunity,
  hasBranchNamed,
  hasCommunityNamed,
  localName,
  makeId,
} from "../../data/communities.js";
import { usePlacesSync } from "../../hooks/usePlacesSync.js";
import { AdminHeader } from "./AdminShared.jsx";
import "./Admin.css";

// ألوان جاهزة للمسار الجديد (لون الغلاف والنقطة جنب اسمه)
const COLORS = ["#F43F5E", "#EAB308", "#06B6D4", "#A855F7", "#10B981", "#6366F1", "#F97316", "#EC4899"];
const MAX_TAGS = 6;

// "React, Vue، Angular" ← ["React", "Vue", "Angular"] (فاصلة إنجليزية أو عربية، وبدون تكرار)
function parseTags(text) {
  return [...new Set(text.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean))].slice(0, MAX_TAGS);
}

// الفرع بالشكل اللي بتفهمه المجتمعات (الاسم الإنجليزي اختياري: إذا فاضي بناخد العربي)
function makeBranch(community, nameAr, nameEn, tags) {
  return {
    id: makeId(nameEn || nameAr, community ? community.branches.map((branch) => branch.id) : []),
    name: { ar: nameAr.trim(), en: nameEn.trim() || nameAr.trim() },
    tags: parseTags(tags),
    isNew: true,
  };
}

/**
 * حقل نص بعنوان (اختياري: مكتوب جنبه "اختياري").
 */
function Field({ label, isOptional, children }) {
  const { t } = useTranslation();

  return (
    <label className="admin-field">
      <span>
        {label}
        {isOptional && <small> · {t("admin.communities.optional")}</small>}
      </span>
      {children}
    </label>
  );
}

/**
 * مسار رئيسي جديد: الاسم والوصف (عربي وإنجليزي)، اللون، وأول فرع فيه.
 * لازم يكون فيه فرع واحد على الأقل حتى الطلاب يقدروا يختاروا منه بصفحة "شو بيهمك؟".
 * onAdded(community): بعد الإضافة
 */
function NewCommunityForm({ onAdded }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    nameAr: "",
    nameEn: "",
    descriptionAr: "",
    descriptionEn: "",
    color: COLORS[0],
    branchAr: "",
    branchEn: "",
    tags: "",
  });
  const [error, setError] = useState(null);

  function change(name) {
    return (event) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setError(null);
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!values.nameAr.trim() || !values.descriptionAr.trim() || !values.branchAr.trim()) {
      setError(t("admin.communities.errors.required"));
      return;
    }
    if (hasCommunityNamed(values.nameAr) || (values.nameEn.trim() && hasCommunityNamed(values.nameEn))) {
      setError(t("admin.communities.errors.communityExists"));
      return;
    }

    const community = {
      id: makeId(values.nameEn, COMMUNITIES.map((item) => item.id)),
      color: values.color,
      members: 0,
      name: { ar: values.nameAr.trim(), en: values.nameEn.trim() || values.nameAr.trim() },
      description: {
        ar: values.descriptionAr.trim(),
        en: values.descriptionEn.trim() || values.descriptionAr.trim(),
      },
      branches: [makeBranch(null, values.branchAr, values.branchEn, values.tags)],
      isNew: true,
    };

    addCommunity(community);
    onAdded(community);
    setValues((current) => ({
      ...current,
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      branchAr: "",
      branchEn: "",
      tags: "",
    }));
  }

  return (
    <form className="admin-form" noValidate onSubmit={handleSubmit}>
      <div className="admin-form__row">
        <Field label={t("admin.communities.nameAr")}>
          <input dir="rtl" maxLength={40} value={values.nameAr} onChange={change("nameAr")} />
        </Field>
        <Field label={t("admin.communities.nameEn")} isOptional>
          <input dir="ltr" maxLength={40} value={values.nameEn} onChange={change("nameEn")} />
        </Field>
      </div>

      <div className="admin-form__row">
        <Field label={t("admin.communities.descriptionAr")}>
          <textarea dir="rtl" rows={2} maxLength={160} value={values.descriptionAr} onChange={change("descriptionAr")} />
        </Field>
        <Field label={t("admin.communities.descriptionEn")} isOptional>
          <textarea dir="ltr" rows={2} maxLength={160} value={values.descriptionEn} onChange={change("descriptionEn")} />
        </Field>
      </div>

      {/* لون المسار */}
      <fieldset className="admin-colors">
        <legend>{t("admin.communities.color")}</legend>
        {COLORS.map((color) => (
          <label key={color} className="admin-colors__swatch" style={{ "--swatch": color }}>
            <input
              type="radio"
              name="community-color"
              value={color}
              checked={values.color === color}
              onChange={change("color")}
              aria-label={color}
            />
            {values.color === color && <Icon name="check" size={16} strokeWidth={3} />}
          </label>
        ))}
      </fieldset>

      {/* أول فرع بالمسار */}
      <h3 className="admin-form__subtitle">{t("admin.communities.firstBranch")}</h3>
      <div className="admin-form__row">
        <Field label={t("admin.communities.branchAr")}>
          <input dir="rtl" maxLength={40} value={values.branchAr} onChange={change("branchAr")} />
        </Field>
        <Field label={t("admin.communities.branchEn")} isOptional>
          <input dir="ltr" maxLength={40} value={values.branchEn} onChange={change("branchEn")} />
        </Field>
      </div>
      <Field label={t("admin.communities.tags")} isOptional>
        <input dir="ltr" placeholder="Kali, Wireshark, OWASP" value={values.tags} onChange={change("tags")} />
      </Field>

      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="admin-button">
        <Icon name="plus" size={16} strokeWidth={2.5} />
        {t("admin.communities.addCommunity")}
      </button>
    </form>
  );
}

/**
 * فرع جديد بأي مجتمع (بدون طلب): المجتمع، الاسم (عربي وإنجليزي)، والأدوات.
 * onAdded(community, branch): بعد الإضافة
 */
function NewBranchForm({ onAdded }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const [values, setValues] = useState({ communityId: COMMUNITIES[0].id, nameAr: "", nameEn: "", tags: "" });
  const [error, setError] = useState(null);

  function change(name) {
    return (event) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setError(null);
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!values.nameAr.trim()) {
      setError(t("admin.communities.errors.branchRequired"));
      return;
    }
    const isTaken =
      hasBranchNamed(values.communityId, values.nameAr) ||
      (values.nameEn.trim() && hasBranchNamed(values.communityId, values.nameEn));
    if (isTaken) {
      setError(t("admin.communities.errors.branchExists"));
      return;
    }

    const community = findCommunity(values.communityId);
    const branch = makeBranch(community, values.nameAr, values.nameEn, values.tags);

    addBranch(community.id, branch);
    onAdded(community, branch);
    setValues((current) => ({ ...current, nameAr: "", nameEn: "", tags: "" }));
  }

  return (
    <form className="admin-form" noValidate onSubmit={handleSubmit}>
      <Field label={t("admin.communities.community")}>
        <select value={values.communityId} onChange={change("communityId")}>
          {COMMUNITIES.map((community) => (
            <option key={community.id} value={community.id}>
              {localName(community, language)}
            </option>
          ))}
        </select>
      </Field>

      <div className="admin-form__row">
        <Field label={t("admin.communities.branchAr")}>
          <input dir="rtl" maxLength={40} value={values.nameAr} onChange={change("nameAr")} />
        </Field>
        <Field label={t("admin.communities.branchEn")} isOptional>
          <input dir="ltr" maxLength={40} value={values.nameEn} onChange={change("nameEn")} />
        </Field>
      </div>
      <Field label={t("admin.communities.tags")} isOptional>
        <input dir="ltr" placeholder="Next.js, SSR, Vercel" value={values.tags} onChange={change("tags")} />
      </Field>

      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="admin-button">
        <Icon name="plus" size={16} strokeWidth={2.5} />
        {t("admin.communities.addBranch")}
      </button>
    </form>
  );
}

/**
 * المجتمعات والفروع: /admin/communities
 * الأدمن بيضيف مسار رئيسي أو فرع مباشرة (بدون طلب)، وبيشوف كل المجتمعات وفروعها.
 * الجديد بيظهر للطلاب فورًا (حتى لو المنصة مفتوحة بتبويب ثاني).
 */
function AdminCommunities() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const refresh = usePlacesSync();
  const [mode, setMode] = useState("community");
  // آخر شي انضاف (لرسالة النجاح ورابط يفتحه)
  const [added, setAdded] = useState(null);

  function handleCommunity(community) {
    setAdded({ name: localName(community, language), path: communityPath(community.id) });
    refresh();
  }

  function handleBranch(community, branch) {
    setAdded({
      name: `${localName(community, language)} › ${localName(branch, language)}`,
      path: communityPath(community.id, branch.id),
    });
    refresh();
  }

  return (
    <>
      <AdminHeader title={t("admin.nav.communities")} text={t("admin.communities.text")}>
        <div className="admin-filter" role="tablist" aria-label={t("admin.communities.modeLabel")}>
          {["community", "branch"].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              className={`admin-filter__chip ${mode === item ? "is-active" : ""}`}
              onClick={() => {
                setMode(item);
                setAdded(null);
              }}
            >
              <Icon name="plus" size={14} strokeWidth={2.5} />
              {t(`admin.communities.modes.${item}`)}
            </button>
          ))}
        </div>
      </AdminHeader>

      <section className="admin-panel">
        {mode === "community" ? (
          <NewCommunityForm onAdded={handleCommunity} />
        ) : (
          <NewBranchForm onAdded={handleBranch} />
        )}

        {added && (
          <p className="admin-form__success" role="status">
            <Icon name="check" size={16} strokeWidth={2.5} />
            {t("admin.communities.added", { name: added.name })}
            <Link to={added.path} target="_blank" rel="noopener" className="admin-link">
              {t("admin.communities.open")}
            </Link>
          </p>
        )}
      </section>

      {/* كل المجتمعات وفروعها */}
      <h2 className="admin-section-title">{t("admin.communities.all", { count: COMMUNITIES.length })}</h2>
      <ul className="admin-places">
        {COMMUNITIES.map((community) => (
          <li key={community.id} className="admin-place" style={{ "--track": community.color }}>
            <div className="admin-place__head">
              <span className="admin-place__icon" aria-hidden="true">
                <CommunityIcon name={community.id} size={20} />
              </span>
              <strong>{localName(community, language)}</strong>
              {community.isNew && <span className="admin-place__new">{t("community.branchRequests.new")}</span>}
              <span className="admin-place__count">
                {t("admin.communities.branchesCount", { count: community.branches.length })}
              </span>
            </div>
            <ul className="admin-place__branches">
              {community.branches.map((branch) => (
                <li key={branch.id} className={branch.isNew ? "is-new" : ""}>
                  {localName(branch, language)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

export default AdminCommunities;