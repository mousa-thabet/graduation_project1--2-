import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon/Icon.jsx";
import "./EditProfileDialog.css";

// أقصى عدد أحرف لكل حقل
const LIMITS = { name: 50, bio: 160, headline: 60, university: 60, location: 30, website: 100 };
// حقول ادرس معي تحت النبذة (التواصل يرسل حقوله الخاصة)
const TEXT_FIELDS = ["university", "location", "website"];

// أقصى حجم للصورة: 5 ميغا
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// "github.com/omar" ← "https://github.com/omar"، والرابط الغلط ← null
function normalizeUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * نافذة تعديل الحساب: الغلاف، الصورة الشخصية، الاسم، النبذة، وحقول إضافية.
 * التغييرات لا تُحفظ إلا عند الضغط على "حفظ".
 * onSave({ fields, avatar, cover }): avatar/cover ملف جديد، أو null للحذف، أو undefined بدون تغيير
 *
 * نفس النافذة تخدم القسمين:
 * textFields: الحقول تحت النبذة (ادرس معي: الجامعة والمكان والموقع، التواصل: التخصص والجامعة والموقع)
 * labels: أسماء حقول خاصة { headline: "التخصص" } (الباقي من ترجمة ادرس معي)
 * bioPlaceholder: النص الباهت في النبذة (اختياري)
 */
function EditProfileDialog({
  profile,
  avatar,
  cover,
  onSave,
  onClose,
  textFields = TEXT_FIELDS,
  labels = {},
  bioPlaceholder,
}) {
  const { t } = useTranslation();
  const [fields, setFields] = useState(() => ({
    name: profile.name,
    bio: profile.bio ?? "",
    ...Object.fromEntries(textFields.map((name) => [name, profile[name] ?? ""])),
  }));
  // الصور الجديدة: { file, preview } أو null (حذف) أو undefined (بدون تغيير)
  const [images, setImages] = useState({ avatar: undefined, cover: undefined });
  const [errors, setErrors] = useState({});
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const previewsRef = useRef([]);

  // الإغلاق بزر Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // حذف روابط المعاينة المؤقتة عند إغلاق النافذة
  useEffect(() => {
    const previews = previewsRef.current;
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // الصورة المعروضة الآن: الجديدة، أو المحذوفة، أو الحالية
  const avatarSrc = images.avatar === undefined ? avatar : images.avatar?.preview;
  const coverSrc = images.cover === undefined ? cover : images.cover?.preview;

  function updateField(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  }

  function pickImage(key, event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) {
      setErrors((current) => ({ ...current, [key]: t("studyApp.profile.form.errors.image") }));
      return;
    }

    const preview = URL.createObjectURL(file);
    previewsRef.current.push(preview);
    setImages((current) => ({ ...current, [key]: { file, preview } }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name = fields.name.trim();
    const website = textFields.includes("website") ? normalizeUrl(fields.website.trim()) : "";
    const nextErrors = {
      name: name ? null : t("studyApp.profile.form.errors.name"),
      website: website === null ? t("studyApp.profile.form.errors.website") : null,
    };

    if (nextErrors.name || nextErrors.website) {
      setErrors(nextErrors);
      return;
    }

    // undefined: بدون تغيير، null: حذف، ملف: صورة جديدة
    const toChange = (image) => (image === undefined ? undefined : (image?.file ?? null));

    // الحقول الإضافية بعد حذف المسافات، والموقع بعد تصحيحه
    const extraFields = Object.fromEntries(
      textFields.map((field) => [field, field === "website" ? website : fields[field].trim()])
    );

    onSave({
      fields: { name, bio: fields.bio.trim(), ...extraFields },
      avatar: toChange(images.avatar),
      cover: toChange(images.cover),
    });
  }

  return (
    <div className="edit-profile" onClick={onClose}>
      <form
        className="edit-profile__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        noValidate
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="edit-profile__head">
          <button
            type="button"
            className="edit-profile__close"
            aria-label={t("studyApp.profile.form.close")}
            onClick={onClose}
          >
            <Icon name="x" size={20} />
          </button>
          <h2 id="edit-profile-title">{t("studyApp.profile.form.title")}</h2>
          <button type="submit" className="edit-profile__save">
            {t("studyApp.profile.form.save")}
          </button>
        </header>

        <div className="edit-profile__body">
          {/* الغلاف */}
          <div className={`edit-profile__cover profile__cover ${coverSrc ? "" : "profile__cover--default"}`}>
            {coverSrc && <img src={coverSrc} alt="" />}
            <div className="edit-profile__image-tools">
              <button
                type="button"
                className="edit-profile__image-button"
                aria-label={`${t("studyApp.profile.form.change")} ${t("studyApp.profile.form.cover")}`}
                title={`${t("studyApp.profile.form.change")} ${t("studyApp.profile.form.cover")}`}
                onClick={() => coverInputRef.current.click()}
              >
                <Icon name="camera" size={20} />
              </button>
              {coverSrc && (
                <button
                  type="button"
                  className="edit-profile__image-button"
                  aria-label={`${t("studyApp.profile.form.remove")} ${t("studyApp.profile.form.cover")}`}
                  title={`${t("studyApp.profile.form.remove")} ${t("studyApp.profile.form.cover")}`}
                  onClick={() => setImages((current) => ({ ...current, cover: null }))}
                >
                  <Icon name="x" size={20} />
                </button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(event) => pickImage("cover", event)} />
          </div>

          {/* الصورة الشخصية */}
          <div className="edit-profile__avatar-row">
            <div className="edit-profile__avatar">
              {avatarSrc ? <img src={avatarSrc} alt="" /> : <span>{fields.name.trim().charAt(0).toUpperCase()}</span>}
              <button
                type="button"
                className="edit-profile__image-button"
                aria-label={`${t("studyApp.profile.form.change")} ${t("studyApp.profile.form.avatar")}`}
                title={`${t("studyApp.profile.form.change")} ${t("studyApp.profile.form.avatar")}`}
                onClick={() => avatarInputRef.current.click()}
              >
                <Icon name="camera" size={18} />
              </button>
            </div>
            {avatarSrc && (
              <button
                type="button"
                className="edit-profile__remove"
                onClick={() => setImages((current) => ({ ...current, avatar: null }))}
              >
                {t("studyApp.profile.form.remove")} {t("studyApp.profile.form.avatar")}
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => pickImage("avatar", event)}
            />
          </div>

          {(errors.avatar || errors.cover) && (
            <p className="edit-profile__error" role="alert">
              {errors.avatar || errors.cover}
            </p>
          )}

          {/* الاسم */}
          <label className="edit-profile__field">
            <span className="edit-profile__label">
              {t("studyApp.profile.form.name")}
              <span className="edit-profile__count">
                {fields.name.length}/{LIMITS.name}
              </span>
            </span>
            <input
              type="text"
              value={fields.name}
              maxLength={LIMITS.name}
              dir="auto"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => updateField("name", event.target.value)}
            />
            {errors.name && (
              <span className="edit-profile__error" role="alert">
                {errors.name}
              </span>
            )}
          </label>

          {/* النبذة */}
          <label className="edit-profile__field">
            <span className="edit-profile__label">
              {t("studyApp.profile.form.bio")}
              <span className="edit-profile__count">
                {fields.bio.length}/{LIMITS.bio}
              </span>
            </span>
            <textarea
              rows={3}
              value={fields.bio}
              maxLength={LIMITS.bio}
              dir="auto"
              placeholder={bioPlaceholder ?? t("studyApp.profile.form.bioPlaceholder")}
              onChange={(event) => updateField("bio", event.target.value)}
            />
          </label>

          {/* الحقول الإضافية: الجامعة، المكان، الموقع (أو حقول التواصل) */}
          {textFields.map((name) => (
            <label key={name} className="edit-profile__field">
              <span className="edit-profile__label">{labels[name] ?? t(`studyApp.profile.form.${name}`)}</span>
              <input
                type={name === "website" ? "url" : "text"}
                value={fields[name]}
                maxLength={LIMITS[name]}
                dir={name === "website" ? "ltr" : "auto"}
                placeholder={name === "website" ? "github.com/..." : undefined}
                aria-invalid={Boolean(errors[name])}
                onChange={(event) => updateField(name, event.target.value)}
              />
              {errors[name] && (
                <span className="edit-profile__error" role="alert">
                  {errors[name]}
                </span>
              )}
            </label>
          ))}
        </div>
      </form>
    </div>
  );
}

export default EditProfileDialog;