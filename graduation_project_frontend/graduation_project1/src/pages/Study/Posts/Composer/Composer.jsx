import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import AudioPlayer from "../../../../components/AudioPlayer/AudioPlayer.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";

import PollEditor, {
  MIN_POLL_OPTIONS,
} from "./PollEditor.jsx";

import MentionMenu from "./MentionMenu.jsx";

import {
  MAX_POST_LENGTH,
  SUGGESTED_TAGS,
} from "../../../../data/studyPosts.js";

import "./Composer.css";

const MAX_MENTIONS = 5;

// أيقونة "فيديو بث مباشر" معبّاة باللون الأحمر (مثل التصميم)
function LiveVideoIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="6"
        width="15"
        height="12"
        rx="3"
        fill="currentColor"
      />
      <path
        d="M16 12 22.5 7.5v9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="12"
        r="2.3"
        style={{ fill: "var(--color-surface)" }}
      />
    </svg>
  );
}

function findMention(text, caret) {
  const match = text
    .slice(0, caret)
    .match(/(?:^|\s)@([\p{L}\p{N}_.]*)$/u);

  if (!match) return null;

  return {
    query: match[1].toLowerCase(),
    start: caret - match[1].length - 1,
  };
}

function Composer({
  onPost,
  onSaveDraft,
  me,
  initialDraft,
  people = [],
  placeholder,
  suggestedTags = SUGGESTED_TAGS,
  accept = "image/*,video/*",
  requireMedia = false,
  mediaPrompt,
  allowPoll = true,
  // زر "فيديو بث مباشر": بيبدأ بث (لو الصفحة ما بعتت onLive بيضل مقفول)
  onLive,
  ref,
}) {
  const { t, i18n } = useTranslation();

  const ar =
    i18n.resolvedLanguage?.startsWith("ar");

  const mediaLabel =
    accept === "video/*"
      ? ar
        ? "فيديو"
        : "Video"
      : ar
        ? "صورة/فيديو"
        : "Photo/video";

  const liveLabel = ar
    ? "فيديو بث مباشر"
    : "Live video";

  const liveHint = ar
    ? "البث المباشر لاحقًا"
    : "Live streaming is coming later";

  const inputPlaceholder = ar
    ? "بم تفكر؟"
    : "What's on your mind?";

  const [text, setText] = useState(
    initialDraft?.text ?? ""
  );

  const [media, setMedia] = useState(null);
  const [poll, setPoll] = useState(
    initialDraft?.poll ?? null
  );

  // زرّا "فيديو بث مباشر" و"صورة/فيديو": الضغط ما بينقل التركيز لجوا الصندوق،
  // لأن شريط التواصل (منشور/سؤال/المجتمع) بيظهر مع التركيز وبيزيح الزر قبل ما تكمل الضغطة
  const keepFocus = (event) => event.preventDefault();

  const [mention, setMention] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const fileRef = useRef(null);
  const pendingCaretRef = useRef(null);

  const remaining = MAX_POST_LENGTH - text.length;

  const pollOptions =
    poll
      ?.map((option) => option.trim())
      .filter(Boolean) ?? [];

  const isPollReady =
    !poll ||
    (text.trim() !== "" &&
      pollOptions.length >= MIN_POLL_OPTIONS);

  const hasContent = requireMedia
    ? Boolean(media)
    : text.trim() !== "" || media;

  const canPost =
    hasContent &&
    isPollReady &&
    remaining >= 0;

  const canSaveDraft =
    Boolean(onSaveDraft) &&
    text.trim() !== "";

  const mentionResults = mention
    ? people
        .filter(
          (person) =>
            person.handle
              .toLowerCase()
              .startsWith(mention.query) ||
            person.name
              .toLowerCase()
              .includes(mention.query)
        )
        .slice(0, MAX_MENTIONS)
    : [];

  const isMentionOpen =
    mentionResults.length > 0;

  useEffect(() => {
    const textarea = ref.current;

    textarea.style.height = "auto";
    textarea.style.height =
      `${textarea.scrollHeight}px`;
  }, [text, ref]);

  useLayoutEffect(() => {
    if (pendingCaretRef.current === null) {
      return;
    }

    ref.current.setSelectionRange(
      pendingCaretRef.current,
      pendingCaretRef.current
    );

    pendingCaretRef.current = null;
  }, [text, ref]);

  function updateMention(textarea) {
    setMention(
      findMention(
        textarea.value,
        textarea.selectionStart
      )
    );

    setActiveIndex(0);
  }

  function handleChange(event) {
    setText(event.target.value);
    updateMention(event.target);
  }

  function selectMention(person) {
    const end =
      mention.start + 1 + mention.query.length;

    const inserted = `@${person.handle} `;

    pendingCaretRef.current =
      mention.start + inserted.length;

    setText(
      text.slice(0, mention.start) +
        inserted +
        text.slice(end)
    );

    setMention(null);
  }

  function handleKeyDown(event) {
    if (!isMentionOpen) return;

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      const step =
        event.key === "ArrowDown" ? 1 : -1;

      setActiveIndex(
        (index) =>
          (index +
            step +
            mentionResults.length) %
          mentionResults.length
      );
    } else if (
      event.key === "Enter" ||
      event.key === "Tab"
    ) {
      event.preventDefault();
      selectMention(mentionResults[activeIndex]);
    } else if (event.key === "Escape") {
      setMention(null);
    }
  }

  function toggleTag(tag) {
    const hashtag = `#${tag}`;

    setText((current) =>
      current.includes(hashtag)
        ? current
            .replace(hashtag, "")
            .replace(/\s{2,}/g, " ")
            .trim()
        : `${current.trim()} ${hashtag}`.trim()
    );

    ref.current.focus();
  }

  // اختيار الملف من الجهاز ومعاينته محليًا.
  function handleFileChange(event) {
    const file = event.target.files[0];
    event.target.value = "";

    if (
      !file ||
      !accept.split(",").some((type) =>
        file.type.startsWith(
          type.replace("*", "")
        )
      )
    ) {
      return;
    }

    if (media) {
      URL.revokeObjectURL(media.src);
    }

    setMedia({
      type: file.type.split("/")[0],
      src: URL.createObjectURL(file),
      name: file.name,
      file,
    });
  }

  function removeMedia() {
    URL.revokeObjectURL(media.src);
    setMedia(null);
  }

  function clear() {
    if (media) {
      URL.revokeObjectURL(media.src);
    }

    setText("");
    setMedia(null);
    setPoll(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!canPost) return;

    onPost({
      text: text.trim(),
      file: media?.file,
      poll: poll && pollOptions,
    });

    clear();
  }

  function handleSaveDraft() {
    if (!canSaveDraft) return;

    onSaveDraft({
      text: text.trim(),
      poll,
    });

    clear();
  }

  return (
    <form
      className={`composer composer--reference ${
        text.trim() || media || poll
          ? "has-content"
          : ""
      }`}
      onSubmit={handleSubmit}
    >
      <span
        className="composer__avatar"
        aria-hidden="true"
      >
        <Avatar person={me} />
      </span>

      <div className="composer__body">
        <div className="composer__field">
          <textarea
            ref={ref}
            className="composer__input"
            rows={1}
            value={text}
            placeholder={
              poll
                ? t(
                    "studyApp.composer.pollPlaceholder"
                  )
                : placeholder ?? inputPlaceholder
            }
            aria-label={placeholder ?? inputPlaceholder}
            aria-autocomplete="list"
            aria-expanded={isMentionOpen}
            aria-controls={
              isMentionOpen
                ? "mention-menu"
                : undefined
            }
            aria-activedescendant={
              isMentionOpen
                ? `mention-menu-${activeIndex}`
                : undefined
            }
            onChange={handleChange}
            onClick={(event) =>
              updateMention(event.target)
            }
            onKeyDown={handleKeyDown}
            onBlur={() => setMention(null)}
          />

          {isMentionOpen && (
            <MentionMenu
              id="mention-menu"
              people={mentionResults}
              activeIndex={activeIndex}
              onSelect={selectMention}
            />
          )}
        </div>

        {poll && (
          <PollEditor
            options={poll}
            onChange={setPoll}
            onRemove={() => setPoll(null)}
          />
        )}

        {mediaPrompt && !media && (
          <button
            type="button"
            className="composer__drop"
            onClick={() =>
              fileRef.current.click()
            }
          >
            <Icon name="upload" size={22} />
            {mediaPrompt}
          </button>
        )}

        {media && (
          <div className="composer__preview">
            {media.type === "image" && (
              <img src={media.src} alt="" />
            )}

            {media.type === "video" && (
              <video
                src={media.src}
                controls
                muted
              />
            )}

            {media.type === "audio" && (
              <AudioPlayer
                src={media.src}
                title={media.name}
              />
            )}

            <button
              type="button"
              className="composer__remove"
              aria-label={t(
                "studyApp.composer.removeMedia"
              )}
              onClick={removeMedia}
            >
              <Icon
                name="x"
                size={16}
                strokeWidth={2.5}
              />
            </button>
          </div>
        )}

        {suggestedTags.length > 0 && (
          <div className="composer__tags">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                dir="auto"
                className="composer__tag"
                aria-pressed={text.includes(
                  `#${tag}`
                )}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="composer__bar">
          <div className="composer__tools">
            <button
              type="button"
              className="composer__tool composer__tool--live"
              title={onLive ? liveLabel : liveHint}
              aria-label={onLive ? liveLabel : `${liveLabel}: ${liveHint}`}
              disabled={!onLive}
              onMouseDown={keepFocus}
              onClick={onLive}
            >
              <LiveVideoIcon size={22} />
              <span>{liveLabel}</span>
            </button>

            <button
              type="button"
              className="composer__tool composer__tool--media"
              aria-label={mediaLabel}
              title={mediaLabel}
              disabled={Boolean(poll)}
              onMouseDown={keepFocus}
              onClick={() =>
                fileRef.current.click()
              }
            >
              <Icon name="camera" size={23} />
              <span>{mediaLabel}</span>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept={accept}
              hidden
              onChange={handleFileChange}
            />

            {allowPoll && (
              <button
                type="button"
                className="composer__tool composer__tool--extra"
                aria-label={t(
                  "studyApp.composer.addPoll"
                )}
                title={t(
                  "studyApp.composer.addPoll"
                )}
                disabled={Boolean(media || poll)}
                onClick={() => setPoll(["", ""])}
              >
                <Icon
                  name="poll"
                  size={20}
                  strokeWidth={2.5}
                />
              </button>
            )}

            {onSaveDraft && (
              <button
                type="button"
                className="composer__tool composer__tool--extra"
                aria-label={t(
                  "studyApp.profile.drafts.save"
                )}
                title={t(
                  "studyApp.profile.drafts.save"
                )}
                disabled={!canSaveDraft}
                onClick={handleSaveDraft}
              >
                <Icon name="draft" size={20} />
              </button>
            )}
          </div>

          <div
            className="composer__send"
            hidden={!text.trim() && !media && !poll}
          >
            {text.length > 0 && (
              <span
                className={`composer__count ${
                  remaining < 20
                    ? "is-warning"
                    : ""
                } ${
                  remaining < 0
                    ? "is-over"
                    : ""
                }`}
              >
                {remaining}
              </span>
            )}

            <button
              type="submit"
              className="composer__submit"
              disabled={!canPost}
            >
              {t("studyApp.composer.post")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default Composer;