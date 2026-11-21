import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import ReportButton from "../ReportButton/ReportButton.jsx";
import { COMMUNITY_PEOPLE, communityProfilePath } from "../../../data/communityPeople.js";
import { LIVE_CHAT_MESSAGES } from "../../../data/communityLive.js";
import { findCommunity } from "../../../data/communities.js";
import { useNow } from "../../../hooks/useNow.js";
import { deviceErrorKey } from "../../../utils/streams.js";
import {
  endHostStream,
  formatDuration,
  getHostStream,
  releaseHostStream,
  setHostStream,
  stopStream,
} from "./liveUtils.js";
import "../../Study/Search/Search.css";
import "./CommunityLive.css";

// كل كم ثانية تصل رسالة تجريبية، وأقصى عدد رسائل نحتفظ فيه
const CHAT_EVERY = 5000;
const MAX_MESSAGES = 60;
const MAX_MESSAGE_LENGTH = 200;

const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

// هل في جهاز (video أو audio) شغال بالبث؟
const isTrackOn = (stream, kind) =>
  Boolean(stream?.getTracks().some((track) => track.kind === kind && track.enabled && track.readyState === "live"));

/**
 * تسجيل البث: قطعة كل ثانية حتى ما يضيع شي.
 * بيسجّل نسخة من الأجهزة اللي شغالة هلأ (لأن إضافة جهاز لنفس البث بتوقف التسجيل بالمتصفح).
 * بيرجع null لو ما في أجهزة أو المتصفح ما بيدعم التسجيل.
 */
function createRecorder(stream, chunksRef) {
  if (!stream?.getTracks().length || typeof MediaRecorder === "undefined") return null;

  try {
    const recorder = new MediaRecorder(new MediaStream(stream.getTracks()));
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start(1000);
    return recorder;
  } catch {
    return null;
  }
}

/**
 * دردشة البث: رسائل المشاهدين (محاكاة) ورسائلي.
 */
function LiveChat({ messages, onSend }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // النزول لآخر رسالة عند وصول رسالة جديدة
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;

    onSend(text.trim());
    setText("");
  }

  return (
    <section className="live-chat" aria-label={t("community.live.chat")}>
      <h2 className="live-chat__title">
        <Icon name="chat" size={16} />
        {t("community.live.chat")}
      </h2>

      <ul ref={listRef} className="live-chat__list" aria-live="polite">
        {messages.length === 0 && <li className="live-chat__empty">{t("community.live.chatEmpty")}</li>}
        {messages.map((message) => (
          <li key={message.id} className={`live-chat__message ${message.isMine ? "is-mine" : ""}`}>
            <strong dir="auto">{message.author.name}</strong>
            <span dir="auto">{message.text}</span>
          </li>
        ))}
      </ul>

      <form className="live-chat__form" onSubmit={handleSubmit}>
        <input
          dir="auto"
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={t("community.live.chatPlaceholder")}
          aria-label={t("community.live.chatPlaceholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" aria-label={t("studyApp.post.send")} disabled={!text.trim()}>
          <Icon name="send" size={18} />
        </button>
      </form>
    </section>
  );
}

/**
 * غرفة بث واحد شغال: المسرح (كاميرتي إن كنت المضيف)، المدة، عدد المشاهدين، والدردشة.
 * المضيف: الكاميرا والمايك حقيقيان (getUserMedia) من نافذة "ابدأ البث" (نفس ادرس معي)،
 * والبث يتسجّل (MediaRecorder) إذا اختار "تسجيل البث"، وعند "إنهاء البث" يتحوّل المنشور لبث منتهي ومعه التسجيل كفيديو.
 * لو فتح الغرفة من جديد (تحديث الصفحة) بنطلب إذن الكاميرا والمايك مرة ثانية.
 * أزرار المايك والكاميرا: بتطفي وبتشغّل، ولو الجهاز مش مفتوح أصلًا بتطلب إذنه.
 * المشاهد: الصوت والصورة يحتاجان سيرفر (WebRTC)، فالمسرح هنا معاينة (مع صورة الواجهة إن وُجدت).
 * (إحنا فرونت إند بس: المشاهدين والدردشة محاكاة)
 */
function LiveRoom({ post }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { feed, me } = useOutletContext();
  const isHost = post.isMine;
  const author = isHost ? me : post.author;
  const community = findCommunity(post.communityId);

  const now = useNow();
  const { thumbnail } = post.live;
  // البثوث القديمة (قبل خيار التسجيل) كانت تتسجّل دايمًا
  const isRecorded = post.live.isRecorded !== false;
  // camera: loading (ننتظر الإذن) • ready • denied (رفض أو ما في كاميرا ولا مايك)
  const [camera, setCamera] = useState(isHost ? "loading" : "off");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [viewers, setViewers] = useState(() => (isHost ? 0 : 25 + Math.floor(Math.random() * 40)));
  const [messages, setMessages] = useState([]);
  // التكبير: ملء الشاشة الحقيقي، أو تكبير بالـ CSS لو المتصفح ما بيدعمه
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isBig = isFullscreen || isExpanded;
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  // الغرفة تبدأ من أول الصفحة
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // المضيف: الكاميرا والمايك من نافذة البدء (أو نطلبهم من جديد)، وبدء التسجيل
  useEffect(() => {
    if (!isHost) return;
    let isCancelled = false;

    // status: ready، أو denied لو طلبنا الإذن من الغرفة وانرفض
    function attach(stream, status = "ready") {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCamOn(isTrackOn(stream, "video"));
      setIsMicOn(isTrackOn(stream, "audio"));
      setCamera(status);
      if (isRecorded) recorderRef.current = createRecorder(stream, chunksRef);
    }

    const handed = getHostStream(post.id);

    // من النافذة: اللي اخترته (حتى لو بدأت بدون كاميرا ومايك)
    if (handed) {
      attach(handed);
    } else if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => ({ stream, status: "ready" }))
        .catch(() => ({ stream: new MediaStream(), status: "denied" }))
        .then(({ stream, status }) => {
          if (isCancelled) {
            stopStream(stream);
            return;
          }
          setHostStream(post.id, stream);
          attach(stream, status);
        });
    } else {
      // متصفح بدون كاميرا (أو صفحة مش آمنة): البث بيكمل بدون صورة
      const empty = new MediaStream();
      setHostStream(post.id, empty);
      attach(empty, "denied");
    }

    // مغادرة الصفحة: نطفي الكاميرا (البث يضل ظاهر كمباشر لحد ما ترجع وتنهيه)
    return () => {
      isCancelled = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
      releaseHostStream(post.id);
    };
  }, [isHost, isRecorded, post.id]);

  // محاكاة: عدد المشاهدين يتغيّر، ورسائل تصل للدردشة
  useEffect(() => {
    const viewersTimer = setInterval(() => {
      setViewers((current) => Math.max(isHost ? 0 : 5, current + Math.floor(Math.random() * 5) - (isHost ? 1 : 2)));
    }, 4000);

    const chatTimer = setInterval(() => {
      const people = COMMUNITY_PEOPLE.filter((person) => person.id !== post.author.id);
      const message = { id: crypto.randomUUID(), author: randomItem(people), text: randomItem(LIVE_CHAT_MESSAGES) };
      setMessages((current) => [...current, message].slice(-MAX_MESSAGES));
    }, CHAT_EVERY);

    return () => {
      clearInterval(viewersTimer);
      clearInterval(chatTimer);
    };
  }, [isHost, post.author.id]);

  // نعرف متى يدخل البث وضع ملء الشاشة أو يخرج منه (حتى لو خرج بزر Esc)
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(stageRef.current) && document.fullscreenElement === stageRef.current);
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // زر F للتكبير والتصغير (إلا أثناء الكتابة بالدردشة)، و Esc يخرج من التكبير البديل
  useEffect(() => {
    function handleKeyDown(event) {
      const isTyping = ["INPUT", "TEXTAREA"].includes(event.target.tagName);

      if (event.code === "KeyF" && !isTyping && !event.ctrlKey && !event.metaKey) toggleFullscreen();
      if (event.key === "Escape") setIsExpanded(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  // تكبير البث وحده بدون الدردشة (مثل يوتيوب)
  async function toggleFullscreen() {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    try {
      await stageRef.current.requestFullscreen();
    } catch {
      // المتصفح ما بيدعم ملء الشاشة لهاد العنصر: نكبّره بالـ CSS
      setIsExpanded(true);
    }
  }

  function sendMessage(text) {
    const message = { id: crypto.randomUUID(), author: me, text, isMine: true };
    setMessages((current) => [...current, message].slice(-MAX_MESSAGES));
  }

  // تشغيل/إطفاء المايك أو الكاميرا بدون إيقاف البث، ولو الجهاز مش مفتوح بنطلب إذنه
  async function toggleDevice(kind) {
    const stream = streamRef.current;
    if (!stream) return;
    setDeviceError(null);

    const track = stream.getTracks().find((item) => item.kind === kind && item.readyState === "live");

    if (track) {
      track.enabled = !track.enabled;
    } else {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ [kind]: true });
        media.getTracks().forEach((item) => stream.addTrack(item));
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamera("ready");
        // البث بلّش بدون أجهزة: التسجيل بيبدأ من هون
        if (isRecorded && !recorderRef.current) recorderRef.current = createRecorder(stream, chunksRef);
      } catch (error) {
        setDeviceError(t(`studyApp.streams.goLive.errors.${deviceErrorKey(error)}`));
        return;
      }
    }

    setIsCamOn(isTrackOn(stream, "video"));
    setIsMicOn(isTrackOn(stream, "audio"));
  }

  // إنهاء البث: نوقف التسجيل ونحفظه مع المنشور
  async function endLive() {
    setIsEnding(true);
    const recorder = recorderRef.current;
    let file = null;

    if (recorder && recorder.state === "recording") {
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        recorder.stop();
      });

      const type = (recorder.mimeType || "video/webm").split(";")[0];
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size > 0) file = new File([blob], "live.webm", { type });
    }

    endHostStream(post.id);
    feed.updatePost(post.id, { live: { ...post.live, status: "ended", endedAt: Date.now() } }, file);
    navigate(`/community/post/${post.id}`, { replace: true });
  }

  return (
    <div className="live-room" style={{ "--track": community?.color }}>
      {/* المسرح: الضغط مرتين عليه بيكبّره وبيصغّره */}
      <section
        ref={stageRef}
        className={`live-stage ${isBig ? "is-big" : ""} ${isExpanded ? "is-expanded" : ""}`}
        onDoubleClick={toggleFullscreen}
      >
        {isHost && (
          <video
            ref={videoRef}
            className={`live-stage__video ${isCamOn ? "is-visible" : ""}`}
            autoPlay
            muted
            playsInline
          />
        )}

        {/* بدون صورة: صورة المضيف بدائرة تنبض (وفوق صورة الواجهة إن وُجدت) */}
        {!(isHost && isCamOn) && (
          <div
            className="live-stage__placeholder"
            style={
              thumbnail
                ? {
                    backgroundImage: `linear-gradient(rgba(5, 7, 15, 0.6), rgba(5, 7, 15, 0.6)), url(${thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <span className="live-stage__avatar">
              <Avatar person={author} />
            </span>
            <p>
              {isHost && camera === "loading" && t("community.live.cameraLoading")}
              {isHost && camera === "denied" && t("community.live.cameraDenied")}
              {isHost && camera === "ready" && !isCamOn && t("community.live.cameraOff")}
              {!isHost && t("community.live.viewerNote")}
            </p>
          </div>
        )}

        <div className="live-stage__top">
          <span className="live-badge">
            <span className="live-badge__dot" aria-hidden="true" />
            {t("community.live.badge")}
          </span>
          <span className="live-stage__chip" dir="ltr">
            <Icon name="clock" size={14} />
            {formatDuration(now - post.live.startedAt)}
          </span>
          <span className="live-stage__chip">
            <Icon name="eye" size={14} />
            {t("community.live.viewers", { count: viewers })}
          </span>
        </div>

        {/* زر التكبير (ملء الشاشة) */}
        <button
          type="button"
          className="live-stage__size"
          aria-label={t(isBig ? "studyApp.streams.room.exitFullscreen" : "studyApp.streams.room.fullscreen")}
          title={`${t(isBig ? "studyApp.streams.room.exitFullscreen" : "studyApp.streams.room.fullscreen")} (F)`}
          onClick={toggleFullscreen}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <Icon name={isBig ? "x" : "maximize"} size={18} />
        </button>
      </section>

      {/* أدوات المضيف */}
      {isHost && (
        <div className="live-controls">
          <button
            type="button"
            className={`live-controls__button ${isMicOn ? "" : "is-off"}`}
            aria-pressed={!isMicOn}
            disabled={camera === "loading"}
            aria-label={t(isMicOn ? "community.live.micOff" : "community.live.micOn")}
            title={t(isMicOn ? "community.live.micOff" : "community.live.micOn")}
            onClick={() => toggleDevice("audio")}
          >
            <Icon name={isMicOn ? "mic" : "micOff"} size={20} />
          </button>
          <button
            type="button"
            className={`live-controls__button ${isCamOn ? "" : "is-off"}`}
            aria-pressed={!isCamOn}
            disabled={camera === "loading"}
            aria-label={t(isCamOn ? "community.live.camOff" : "community.live.camOn")}
            title={t(isCamOn ? "community.live.camOff" : "community.live.camOn")}
            onClick={() => toggleDevice("video")}
          >
            <Icon name={isCamOn ? "video" : "videoOff"} size={20} />
          </button>
          <button type="button" className="live-controls__end" disabled={isEnding} onClick={endLive}>
            {t(isEnding ? "community.live.ending" : "community.live.end")}
          </button>
        </div>
      )}

      {/* معلومات البث */}
      <section className="live-info">
        <PostOrigin post={post} />
        <h2 className="live-info__title" dir="auto">
          {post.text}
        </h2>
        <Link to={isHost ? "/community/profile" : communityProfilePath(author.handle)} className="live-info__host">
          <span className="live-info__avatar" aria-hidden="true">
            <Avatar person={author} />
          </span>
          <strong dir="auto">{author.name}</strong>
          <UserBadges badges={author.badges} size={15} />
        </Link>
        {/* خطأ بالكاميرا أو المايك (رفض الإذن مثلًا) */}
        {isHost && deviceError && (
          <p className="live-info__note" role="alert">
            {deviceError}
          </p>
        )}
        {isHost && isRecorded && <p className="live-info__note">{t("community.live.hostNote")}</p>}
        {/* بث غيري: إبلاغ */}
        {!isHost && <ReportButton targetType="live" targetId={post.id} title={post.text} />}
      </section>

      <LiveChat messages={messages} onSend={sendMessage} />
    </div>
  );
}

/**
 * صفحة البث: /community/live/:postId
 * بث شغال ← الغرفة، بث منتهي ← التسجيل ورابط المنشور.
 */
function CommunityLive() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const { feed } = useOutletContext();
  const post = feed.posts.find((item) => item.id === postId && item.type === "live");

  if (!post) {
    return (
      <>
        <StudyHeader title={t("community.live.notFound")} backTo="/community" />
        <EmptyState icon="radio" title={t("community.live.notFound")} text={t("community.live.notFoundText")}>
          <Link to="/community" className="search-clear">
            {t("community.nav.home")}
          </Link>
        </EmptyState>
      </>
    );
  }

  // البث انتهى: التسجيل (إن وُجد)
  if (post.live.status !== "live") {
    return (
      <>
        <StudyHeader title={t("community.live.endedTitle")} backTo="/community" />
        <div className="live-room">
          {post.media?.src ? (
            <video className="live-recording" src={post.media.src} controls playsInline />
          ) : (
            <EmptyState icon="radio" title={t("community.live.endedTitle")} text={t("community.live.noRecording")} />
          )}
          <section className="live-info">
            <PostOrigin post={post} />
            <h2 className="live-info__title" dir="auto">
              {post.text}
            </h2>
            <p className="live-info__note">
              {t("community.live.endedAfter", { duration: formatDuration(post.live.endedAt - post.live.startedAt) })}
            </p>
            <Link to={`/community/post/${post.id}`} className="search-clear">
              {t("community.live.openPost")}
            </Link>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <StudyHeader title={t("community.types.live")} backTo="/community" />
      {/* key: غرفة جديدة لكل بث */}
      <LiveRoom key={post.id} post={post} />
    </>
  );
}

export default CommunityLive;