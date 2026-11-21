import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useSearchParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { communityPath, findCommunity, hasBranchNamed, localName } from "../../../data/communities.js";
import { MIN_REASON_LENGTH } from "../../../hooks/useBranchRequests.js";
import { formatTimeAgo } from "../../../utils/format.js";
// شكل الحقول من نموذج رفع الأصوات، وشكل الطلبات من صفحة الشارات
import "../../Study/Library/Library.css";
import "../Badges/Badges.css";
import "../../Study/Search/Search.css";

const MAX_NAME_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_REASON_LENGTH = 400;
const MAX_TAGS = 4;

// "React, Vue ,  Angular" ← ["React", "Vue", "Angular"]
const parseTags = (value) =>
  [...new Set(value.split(/[,،]/).map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean))].slice(0, MAX_TAGS);

/**
 * استبيان فتح فرع جديد: المجتمع (من مجتمعاتي)، اسم الفرع، وصفه، أدواته، وليش لازم ينفتح.
 * defaultCommunityId: المجتمع المختار من البداية  •  myCommunities: مجتمعاتي
 * isPending(communityId, name): في طلب بنفس الاسم قيد المراجعة؟  •  onApply(request): إرسال الطلب
 */
function BranchRequestForm({ myCommunities, defaultCommunityId, isPending, onApply }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  const [communityId, setCommunityId] = useState(
    myCommunities.some((item) => item.id === defaultCommunityId) ? defaultCommunityId : myCommunities[0].id
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [isSent, setIsSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setError(t("community.branchRequests.errors.name"));
      return;
    }
    if (hasBranchNamed(communityId, cleanName) || isPending(communityId, cleanName)) {
      setError(t("community.branchRequests.errors.exists"));
      return;
    }
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(t("community.branchRequests.errors.reason", { min: MIN_REASON_LENGTH }));
      return;
    }

    onApply({
      communityId,
      name: cleanName,
      description: description.trim(),
      tags: parseTags(tags),
      reason: reason.trim(),
    });
    setName("");
    setDescription("");
    setTags("");
    setReason("");
    setError(null);
    setIsSent(true);
  }

  // أي تعديل بعد الإرسال يخفي رسالة "انبعث"
  const edit = (setter) => (event) => {
    setter(event.target.value);
    setIsSent(false);
  };

  return (
    <form className="badge-form" noValidate onSubmit={handleSubmit}>
      <h2 className="badge-form__title">{t("community.branchRequests.form.title")}</h2>

      <label className="upload-form__field">
        <span>{t("community.branchRequests.form.community")}</span>
        <select className="badge-form__select" value={communityId} onChange={edit(setCommunityId)}>
          {myCommunities.map((community) => (
            <option key={community.id} value={community.id}>
              {localName(community, language)}
            </option>
          ))}
        </select>
      </label>

      <label className="upload-form__field">
        <span>
          {t("community.branchRequests.form.name")}
          <span className="upload-form__count">
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </span>
        <input
          dir="auto"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder={t("community.branchRequests.form.namePlaceholder")}
          onChange={edit(setName)}
        />
      </label>

      <label className="upload-form__field">
        <span>
          {t("community.branchRequests.form.description")}
          <span className="upload-form__count">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </span>
        <textarea
          className="badge-form__about"
          rows={2}
          dir="auto"
          value={description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder={t("community.branchRequests.form.descriptionPlaceholder")}
          onChange={edit(setDescription)}
        />
      </label>

      <label className="upload-form__field">
        <span>{t("community.branchRequests.form.tags")}</span>
        <input
          dir="ltr"
          value={tags}
          placeholder={t("community.branchRequests.form.tagsPlaceholder")}
          onChange={edit(setTags)}
        />
      </label>

      <label className="upload-form__field">
        <span>
          {t("community.branchRequests.form.reason")}
          <span className={`upload-form__count ${reason.trim().length >= MIN_REASON_LENGTH ? "is-enough" : ""}`}>
            {reason.length}/{MAX_REASON_LENGTH}
          </span>
        </span>
        <textarea
          className="badge-form__about"
          rows={4}
          dir="auto"
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          placeholder={t("community.branchRequests.form.reasonPlaceholder")}
          onChange={edit(setReason)}
        />
      </label>

      {error && (
        <p className="upload-form__error" role="alert">
          {error}
        </p>
      )}
      {isSent && !error && (
        <p className="badge-form__sent" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {t("community.branchRequests.form.sent")}
        </p>
      )}

      <button type="submit" className="badge-form__submit">
        {t("community.branchRequests.form.submit")}
      </button>
    </form>
  );
}

/**
 * طلبات فتح فرع جديد: /community/branch-requests
 * بس لأصحاب الشارات. الطلب بروح للأدمن، وإذا وافق بنزل الفرع الجديد بمجتمعه وبيوصلك إشعار.
 * ?community=frontend يختار المجتمع من البداية (من زر "اقترح فرع" بصفحة المجتمع)
 */
function BranchRequests() {
  const { t, i18n } = useTranslation();
  const { badges, branchRequests, memberships } = useOutletContext();
  const [searchParams] = useSearchParams();
  const language = i18n.resolvedLanguage;

  // اسم المكان: "فرونت إند › Next.js"
  function placeName(request) {
    const community = findCommunity(request.communityId);
    return `${community ? localName(community, language) : ""} › ${request.name}`;
  }

  return (
    <>
      <StudyHeader title={t("community.branchRequests.title")} backTo="/community/explore" />

      {/* بدون شارة: ما بيقدر يقدّم */}
      {!badges.hasBadge ? (
        <EmptyState icon="lock" title={t("community.branchRequests.lockedTitle")} text={t("community.branchRequests.lockedText")}>
          <Link to="/community/badges" className="search-clear">
            {t("community.nav.badges")}
          </Link>
        </EmptyState>
      ) : (
        <div className="badges-page">
          <p className="badges-page__intro">{t("community.branchRequests.intro")}</p>

          {memberships.myCommunities.length > 0 ? (
            <BranchRequestForm
              myCommunities={memberships.myCommunities}
              defaultCommunityId={searchParams.get("community")}
              isPending={branchRequests.isPending}
              onApply={branchRequests.apply}
            />
          ) : (
            <p className="community-disclaimer">
              <Icon name="lock" size={16} />
              {t("community.branchRequests.noCommunities")}
            </p>
          )}

          {/* طلباتي */}
          {branchRequests.requests.length > 0 && (
            <section className="badges-requests">
              <h2>{t("community.badges.requests")}</h2>
              <ul>
                {branchRequests.requests.map((request) => {
                  const community = findCommunity(request.communityId);

                  return (
                    <li
                      key={request.id}
                      className={`badge-request is-${request.status}`}
                      style={{ "--track": community?.color }}
                    >
                      <CommunityIcon name="branch" size={22} />
                      <span className="badge-request__text">
                        {request.status === "approved" ? (
                          <Link to={communityPath(request.communityId, request.branchId)}>
                            <strong dir="auto">{placeName(request)}</strong>
                          </Link>
                        ) : (
                          <strong dir="auto">{placeName(request)}</strong>
                        )}
                        <span>
                          {formatTimeAgo(request.createdAt, language)}
                          {request.status === "rejected" &&
                            ` · ${t(`community.branchRequests.reasons.${request.rejectReason}`)}`}
                        </span>
                      </span>
                      <span className="badge-request__status">{t(`community.badges.status.${request.status}`)}</span>
                      {request.status !== "approved" && (
                        <button
                          type="button"
                          className="badge-request__remove"
                          aria-label={t("community.badges.remove")}
                          title={t("community.badges.remove")}
                          onClick={() => branchRequests.remove(request.id)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

export default BranchRequests;