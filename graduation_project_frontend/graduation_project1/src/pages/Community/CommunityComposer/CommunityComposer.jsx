import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import CommunityIcon from "../../../components/CommunityIcon/CommunityIcon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import Composer from "../../Study/Posts/Composer/Composer.jsx";
import { GENERAL_ID, findCommunity, localName } from "../../../data/communities.js";
import { getCommunityPeople } from "../../../utils/communitySearch.js";
import GoLiveDialog from "../../Study/Streams/GoLiveDialog/GoLiveDialog.jsx";
import { livePath, setHostStream } from "../CommunityLive/liveUtils.js";
import "./CommunityComposer.css";

// أنواع المنشور وأيقوناتها (CommunityIcon للمنشور والسؤال، Icon للبث)
const TYPES = [
  { id: "post", icon: "hash", IconComponent: CommunityIcon },
  { id: "question", icon: "question", IconComponent: CommunityIcon },
  { id: "live", icon: "radio", IconComponent: Icon },
];

/**
 * بدء بث مباشر (متاح لأي مستخدم): سطر "عنوان البث" وزر "ابدأ البث"،
 * والضغط على أي واحد منهم بيفتح نافذة البث (نفس ادرس معي): معاينة الكاميرا والمايك
 * (بتطلب إذن المتصفح)، العنوان، صورة الواجهة، والتسجيل.
 * onOpen: يفتح النافذة
 */
function LiveStarter({ me, onOpen }) {
  const { t } = useTranslation();

  return (
    <div className="live-starter">
      <span className="composer__avatar" aria-hidden="true">
        <Avatar person={me} />
      </span>
      {/* شكله مربع كتابة، بس الضغط عليه بيفتح النافذة */}
      <input
        readOnly
        aria-haspopup="dialog"
        placeholder={t("community.live.titlePlaceholder")}
        aria-label={t("community.live.titlePlaceholder")}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      />
      <button type="button" className="live-starter__start" aria-haspopup="dialog" onClick={onOpen}>
        <span className="live-badge__dot" aria-hidden="true" />
        {t("community.live.start")}
      </button>
    </div>
  );
}

/**
 * صندوق الكتابة في التواصل: نفس Composer ادرس معي، ومعه فوقه:
 * نوع المنشور (منشور، سؤال، أو بث مباشر)، والمجتمع والفرع.
 * البث: زر "فيديو بث مباشر" بالصندوق (أو نوع "بث") بيفتح نافذة البث (الكاميرا والمايك والعنوان)،
 * وبعدها بيفتح غرفة البث لأي مستخدم.
 *
 * feed: المنشورات (فيها addPost)  •  me: أنا  •  composerRef: مربع النص (لزر "انشر")
 * defaultType / defaultCommunityId / defaultBranchId: القيم المبدئية (مثلًا داخل صفحة مجتمع)
 * myCommunities: مجتمعاتي، وهي وحدها اللي بتظهر في القائمة (وفروعها اللي انضممت لها فقط)
 * draft: مسودة نكملها (من حسابي ← المسودات) • onDraftDone: بعد نشرها أو حفظها من جديد
 * المسودات نفسها تأتي من القالب (مسودات التواصل منفصلة عن ادرس معي).
 * وضع الإدارة: ما في صندوق كتابة (الأدمن بيتصفح وبيحجب، ما بينشر باسم طالب).
 */
function CommunityComposer({
  feed,
  me,
  composerRef,
  myCommunities = [],
  defaultType = "post",
  defaultCommunityId,
  defaultBranchId = "",
  draft,
  onDraftDone,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { drafts, memberships, moderation } = useOutletContext();
  const language = i18n.resolvedLanguage;

  // النشر فقط في المجتمعات اللي انضممت لها (وإن ما في ولا وحد: العام)
  const places = myCommunities.length > 0 ? myCommunities : [findCommunity(GENERAL_ID)];
  // فروع المجتمع اللي انضممت لها فقط
  const joinedBranchesOf = (id) =>
    findCommunity(id).branches.filter((item) => memberships.isBranchJoined(id, item.id));

  // المسودة (إن وُجدت) تحدد القيم المبدئية، بشرط تكون من مجتمعاتي وفروعي
  const wantedCommunity = draft?.communityId ?? defaultCommunityId;
  const startCommunity = places.some((item) => item.id === wantedCommunity) ? wantedCommunity : places[0].id;
  const wantedBranch = draft?.branchId ?? defaultBranchId;
  const startBranch = joinedBranchesOf(startCommunity).some((item) => item.id === wantedBranch) ? wantedBranch : "";

  const [type, setType] = useState(draft?.type ?? defaultType);
  const [communityId, setCommunityId] = useState(startCommunity);
  const [branchId, setBranchId] = useState(startBranch);
  // وسوم الأدوات: انشالت خانتها، بس منحافظ على وسوم المسودة القديمة إن وُجدت
  const tags = draft?.tags ?? [];
  const [toast, setToast] = useState(null);
  // نافذة "ابدأ البث"
  const [isGoingLive, setIsGoingLive] = useState(false);
  // Composer يحتاج ref دائمًا: إن لم تُرسل الصفحة ref نستخدم واحدًا خاصًا
  const ownRef = useRef(null);

  const community = findCommunity(communityId);
  const branchOptions = joinedBranchesOf(communityId);

  function handleCommunityChange(event) {
    setCommunityId(event.target.value);
    setBranchId("");
  }

  // إخفاء رسالة "انحفظت" بعد ثانيتين
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  function handlePost(data) {
    feed.addPost({ ...data, type, communityId, branchId: branchId || null, tags });
    // النشر من مسودة يحذفها
    if (draft) drafts.deleteDraft(draft.id);
    onDraftDone?.();
  }

  // نوع "بث": بيفتح نافذة البث مباشرة
  function openLive() {
    setType("live");
    setIsGoingLive(true);
  }

  // بدء بث: منشور من نوع "live"، والكاميرا والمايك بينتقلوا للغرفة، ثم فتح غرفته
  function handleStartLive({ title, thumbnail, isRecorded, stream }) {
    const postId = feed.addPost({
      text: title,
      type: "live",
      communityId,
      branchId: branchId || null,
      tags,
      live: { status: "live", startedAt: Date.now(), thumbnail, isRecorded },
    });
    setHostStream(postId, stream ?? new MediaStream());
    setIsGoingLive(false);
    navigate(livePath(postId));
  }

  // حفظ مسودة جديدة، أو تحديث المسودة المفتوحة (مع النوع والمكان والوسوم)
  function handleSaveDraft(data) {
    drafts.saveDraft({ id: draft?.id, ...data, type, communityId, branchId, tags });
    setToast(t("studyApp.profile.drafts.saved"));
    onDraftDone?.();
  }

  // وضع الإدارة: بدون صندوق كتابة
  if (moderation?.isAdmin) return null;

  return (
    <section className={`community-composer community-composer--${type}`} style={{ "--track": community.color }}>
      <div className="community-composer__bar">
        {/* نوع المنشور: منشور، سؤال، أو بث */}
        <div className="composer-type" role="group" aria-label={t("community.composer.type")}>
          {TYPES.map(({ id, icon, IconComponent }) => (
            <button
              key={id}
              type="button"
              className="composer-type__option"
              aria-pressed={type === id}
              onClick={() => (id === "live" ? openLive() : setType(id))}
            >
              <IconComponent name={icon} size={15} strokeWidth={2.4} />
              {t(`community.types.${id}`)}
            </button>
          ))}
        </div>

        {/* المكان: المجتمع والفرع */}
        <label className="composer-place">
          <span className="composer-place__dot" aria-hidden="true" />
          <select value={communityId} aria-label={t("community.composer.community")} onChange={handleCommunityChange}>
            {places.map((item) => (
              <option key={item.id} value={item.id}>
                {localName(item, language)}
              </option>
            ))}
          </select>
        </label>

        <label className="composer-place">
          <CommunityIcon name="branch" size={14} />
          <select
            value={branchId}
            aria-label={t("community.composer.branch")}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">{t("community.composer.noBranch")}</option>
            {branchOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {localName(item, language)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {type === "question" && (
        <p className="community-composer__hint">
          <CommunityIcon name="question" size={15} />
          {t("community.composer.questionHint")}
        </p>
      )}

      {/* البث: عنوان وزر بدء بدل صندوق الكتابة */}
      {type === "live" ? (
        <LiveStarter me={me} onOpen={() => setIsGoingLive(true)} />
      ) : (
        // بدون وسوم ادرس معي المقترحة
        // الفيديو (من مسودة قديمة): ملف فيديو إجباري وبدون استطلاع
        <Composer
          ref={composerRef ?? ownRef}
          me={me}
          people={getCommunityPeople(feed.posts)}
          placeholder={t(`community.composer.placeholder.${type}`)}
          suggestedTags={[]}
          initialDraft={draft}
          accept={type === "video" ? "video/*" : undefined}
          requireMedia={type === "video"}
          mediaPrompt={type === "video" ? t("community.composer.videoPrompt") : undefined}
          allowPoll={type !== "video"}
          onPost={handlePost}
          onSaveDraft={handleSaveDraft}
          onLive={openLive}
        />
      )}

      {/* نافذة البث: نفس ادرس معي بدون المؤقت المشترك */}
      {isGoingLive && (
        <GoLiveDialog withPlan={false} onStart={handleStartLive} onClose={() => setIsGoingLive(false)} />
      )}

      {toast && (
        <div className="post-toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </section>
  );
}

export default CommunityComposer;