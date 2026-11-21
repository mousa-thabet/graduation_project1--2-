import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../../components/Icon/Icon.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";
import ReportDialog from "../../../../components/ReportDialog/ReportDialog.jsx";
import StudyHeader from "../../StudyHeader/StudyHeader.jsx";
import EmptyState from "../../EmptyState/EmptyState.jsx";
import RoomChat from "./RoomChat.jsx";
import { REACTIONS } from "../../../../data/studyRooms.js";
import { profilePath } from "../../../../data/studyPeople.js";
import { useNow } from "../../../../hooks/useNow.js";
import { deviceErrorKey, formatDuration, getRoomTimer } from "../../../../utils/streams.js";
import { formatCount } from "../../../../utils/format.js";
import { playChime } from "../../../../utils/ambientSound.js";
// شارة "مباشر" ستايلها مع بطاقة البث (الصفحة بتنزل لحالها، فلازم تستورده بنفسها)
import "../StreamCard/StreamCard.css";
import "./StreamRoom.css";

// كل كم ثانية تصل رسالة تجريبية وقت الاستراحة، وتفاعل تجريبي من الناس
const DEMO_MESSAGE_EVERY = 6000;
const DEMO_REACTION_EVERY = 4500;
const REACTION_TIME = 2200;
const TOAST_TIME = 3000;

// كاميرتي الحقيقية: MediaStream يُوضع في srcObject (لا يصلح src)
function LiveVideo({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} className="room-video is-mirrored" autoPlay muted playsInline />;
}

// مربع شخص في البث: كاميرته (أو شكل متحرك يمثلها إلى أن يجهز البث الحقيقي) أو صورته، ومايكه
function PersonTile({ person, stream, cam, mic, label }) {
  return (
    <li className={`room-tile ${cam ? "is-cam" : ""}`}>
      {cam && stream ? (
        <LiveVideo stream={stream} />
      ) : (
        <span className="room-tile__avatar" aria-hidden="true">
          <Avatar person={person} />
        </span>
      )}
      <span className="room-tile__name">
        <Icon name={mic ? "mic" : "micOff"} size={12} />
        <bdi>{label ?? person.name}</bdi>
      </span>
    </li>
  );
}

/**
 * غرفة البث المباشر: الفيديو، المؤقت المشترك، المشاركون، التفاعلات، الدردشة، وأدوات الكاميرا والمايك.
 * صاحب البث يرى كاميرته وينهي البث، والمشاهد يفتح كاميرته إن أراد ويغادر.
 */
function StreamRoom() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { streams, profile } = useOutletContext();
  const [panel, setPanel] = useState("chat");
  const [reactions, setReactions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  // التكبير: ملء الشاشة الحقيقي (Fullscreen API)، أو تكبير بالـ CSS إن لم يدعمه المتصفح (مثل iPhone)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const phaseRef = useRef(null);
  const stageRef = useRef(null);

  const room = streams.rooms.find((item) => item.id === roomId);
  const now = useNow(Boolean(room));
  const timer = room ? getRoomTimer(room, now) : null;
  const isHost = Boolean(room?.isMine);
  const isInRoom = streams.activeRoom?.id === roomId;
  const { myMedia } = streams;
  const language = i18n.resolvedLanguage;

  // فتح الصفحة = الانضمام للبث (صاحب البث منضم أصلًا)
  useEffect(() => {
    if (room && !room.isMine && !isInRoom) streams.join(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function showToast(text) {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, text }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_TIME);
  }

  // تبدّل المرحلة (تركيز ↔ استراحة): نغمة ورسالة
  useEffect(() => {
    if (!timer) return;

    if (phaseRef.current && phaseRef.current !== timer.phase) {
      playChime();
      showToast(t(timer.phase === "break" ? "studyApp.streams.room.breakStarted" : "studyApp.streams.room.focusStarted"));
    }
    phaseRef.current = timer.phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer?.phase]);

  // محاكاة: رسائل تصل وقت الاستراحة فقط
  useEffect(() => {
    if (!room || timer.phase !== "break") return;

    const interval = setInterval(() => streams.receiveMessage(room.id), DEMO_MESSAGE_EVERY);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, timer?.phase]);

  // تفاعل يطير فوق الفيديو ثم يختفي
  function addReaction(emoji) {
    const id = crypto.randomUUID();
    setReactions((current) => [...current, { id, emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setReactions((current) => current.filter((item) => item.id !== id)), REACTION_TIME);
  }

  // محاكاة: الناس يتفاعلون أحيانًا
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      addReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    }, DEMO_REACTION_EVERY);
    return () => clearInterval(interval);
  }, [room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // نعرف متى يدخل البث وضع ملء الشاشة أو يخرج منه (حتى لو خرج بزر Esc)
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(stageRef.current) && document.fullscreenElement === stageRef.current);
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // زر F للتكبير والتصغير (إلا أثناء الكتابة)، و Esc يخرج من التكبير البديل
  useEffect(() => {
    function handleKeyDown(event) {
      const isTyping = ["INPUT", "TEXTAREA"].includes(event.target.tagName);

      if (event.code === "KeyF" && !isTyping && !event.ctrlKey && !event.metaKey) toggleFullscreen();
      if (event.key === "Escape") setIsExpanded(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  // "متأكد؟" ترجع لطبيعتها بعد 3 ثوانٍ
  useEffect(() => {
    if (!isConfirmingEnd) return;

    const timeout = setTimeout(() => setIsConfirmingEnd(false), TOAST_TIME);
    return () => clearTimeout(timeout);
  }, [isConfirmingEnd]);

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
      // المتصفح لا يدعم ملء الشاشة لهذا العنصر: نكبّره بالـ CSS
      setIsExpanded(true);
    }
  }

  async function handleCam() {
    try {
      await streams.toggleCam();
    } catch (error) {
      showToast(t(`studyApp.streams.goLive.errors.${deviceErrorKey(error)}`));
    }
  }

  function handleLeave() {
    streams.leave();
    navigate("/study/streams");
  }

  function handleEnd() {
    if (!isConfirmingEnd) {
      setIsConfirmingEnd(true);
      return;
    }

    const recordingId = streams.endStream();
    navigate(recordingId ? `/study/streams/replay/${recordingId}` : "/study/streams");
  }

  // البث انتهى أو الرابط غلط
  if (!room) {
    return (
      <>
        <StudyHeader title={t("studyApp.nav.streams")} backTo="/study/streams" />
        <EmptyState icon="radio" title={t("studyApp.streams.room.ended")} text={t("studyApp.streams.room.endedText")}>
          <Link to="/study/streams" className="room-ended__link">
            {t("studyApp.streams.room.backToStreams")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const isBig = isFullscreen || isExpanded;
  const showMe = !isHost && isInRoom && (myMedia.cam || myMedia.mic);
  const peopleCount = 1 + room.participants.length + (isInRoom && !isHost ? 1 : 0);

  return (
    <>
      <StudyHeader title={room.title} backTo="/study/streams" />

      {/* ----- الفيديو ----- */}
      {/* الضغط مرتين على الفيديو يكبّره ويصغّره */}
      <section
        ref={stageRef}
        className={`room-stage ${isBig ? "is-big" : ""} ${isExpanded ? "is-expanded" : ""}`}
        aria-label={room.title}
        onDoubleClick={toggleFullscreen}
      >
        {isHost ? (
          myMedia.cam && myMedia.stream ? (
            <LiveVideo stream={myMedia.stream} />
          ) : (
            <div className="room-stage__off">
              <span className="room-stage__avatar">
                <Avatar person={profile.me} />
              </span>
              <span>{t("studyApp.streams.room.camOff")}</span>
            </div>
          )
        ) : room.video ? (
          <video className="room-video" src={room.video} autoPlay muted loop playsInline />
        ) : (
          // كاميرا صاحب البث مطفأة: صورة الواجهة باهتة خلف صورته
          <div className="room-stage__off">
            {room.thumbnail && <img className="room-stage__backdrop" src={room.thumbnail} alt="" />}
            <span className="room-stage__avatar">
              <Avatar person={room.host} />
            </span>
            <span>{t("studyApp.streams.room.camOff")}</span>
          </div>
        )}

        {/* مباشر، المدة، التسجيل، المشاهدون */}
        <div className="room-stage__top">
          <span className="stream-badge stream-badge--live">{t("studyApp.streams.live")}</span>
          <span className="room-stage__pill" dir="ltr">
            {formatDuration(Math.floor((now - room.startedAt) / 1000))}
          </span>
          {room.isRecorded && (
            <span className="room-stage__pill room-stage__pill--rec">{t("studyApp.streams.room.recording")}</span>
          )}
          <span className="room-stage__pill room-stage__viewers">
            <Icon name="eye" size={14} />
            {formatCount(room.viewers, language)}
          </span>
        </div>

        {/* المؤقت المشترك: نفس الوقت عند الكل */}
        <div className={`room-timer is-${timer.phase}`} role="timer">
          <span className="room-timer__phase">{t(`studyApp.streams.phases.${timer.phase}`)}</span>
          <strong dir="ltr">{formatDuration(timer.secondsLeft)}</strong>
          <span className="room-timer__round">{t("studyApp.streams.round", { count: timer.round })}</span>
        </div>

        {/* زر التكبير */}
        <button
          type="button"
          className="room-stage__size"
          aria-label={isBig ? t("studyApp.streams.room.exitFullscreen") : t("studyApp.streams.room.fullscreen")}
          title={`${isBig ? t("studyApp.streams.room.exitFullscreen") : t("studyApp.streams.room.fullscreen")} (F)`}
          onClick={toggleFullscreen}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <Icon name={isBig ? "x" : "maximize"} size={18} />
        </button>

        {/* التفاعلات الطائرة */}
        <div className="room-reactions" aria-hidden="true">
          {reactions.map((item) => (
            <span key={item.id} className="room-reaction" style={{ "--x": `${item.x}%` }}>
              {item.emoji}
            </span>
          ))}
        </div>
      </section>

      {/* ----- صاحب البث والمشاركون ----- */}
      <div className="room-info">
        <Link to={profilePath(room.host.handle)} className="room-host">
          <span className="room-host__avatar" aria-hidden="true">
            <Avatar person={isHost ? profile.me : room.host} />
          </span>
          <span className="room-host__text">
            <strong dir="auto">{isHost ? profile.me.name : room.host.name}</strong>
            <span>{t("studyApp.streams.plan", { focus: room.timer.focus, break: room.timer.break })}</span>
          </span>
        </Link>
      </div>

      <ul className="room-tiles" aria-label={t("studyApp.streams.room.people", { count: peopleCount })}>
        {showMe && (
          <PersonTile
            person={profile.me}
            stream={myMedia.stream}
            cam={myMedia.cam}
            mic={myMedia.mic}
            label={t("studyApp.streams.room.you")}
          />
        )}
        {room.participants.map((person) => (
          <PersonTile key={person.id} person={person} cam={person.cam} mic={person.mic} />
        ))}
      </ul>

      {/* ----- أدوات التحكم ----- */}
      <div className="room-controls">
        <button
          type="button"
          className={`room-control ${myMedia.mic ? "is-on" : ""}`}
          aria-pressed={myMedia.mic}
          aria-label={t("studyApp.streams.room.mic")}
          title={t("studyApp.streams.room.mic")}
          onClick={streams.toggleMic}
        >
          <Icon name={myMedia.mic ? "mic" : "micOff"} size={20} />
        </button>
        <button
          type="button"
          className={`room-control ${myMedia.cam ? "is-on" : ""}`}
          aria-pressed={myMedia.cam}
          aria-label={t("studyApp.streams.room.cam")}
          title={t("studyApp.streams.room.cam")}
          onClick={handleCam}
        >
          <Icon name={myMedia.cam ? "video" : "videoOff"} size={20} />
        </button>

        {/* التفاعلات السريعة */}
        <div className="room-controls__reactions" role="group" aria-label={t("studyApp.streams.room.react")}>
          {REACTIONS.map((emoji) => (
            <button key={emoji} type="button" className="room-react" onClick={() => addReaction(emoji)}>
              {emoji}
            </button>
          ))}
        </div>

        {!isHost && (
          <button
            type="button"
            className="room-control"
            aria-label={t("studyApp.streams.room.report")}
            title={t("studyApp.streams.room.report")}
            onClick={() => setIsReporting(true)}
          >
            <Icon name="flag" size={18} />
          </button>
        )}

        {isHost ? (
          <button type="button" className="room-leave" onClick={handleEnd}>
            {isConfirmingEnd ? t("studyApp.streams.room.confirmEnd") : t("studyApp.streams.room.end")}
          </button>
        ) : (
          <button type="button" className="room-leave" onClick={handleLeave}>
            <Icon name="logOut" size={18} />
            {t("studyApp.streams.room.leave")}
          </button>
        )}
      </div>

      {/* ----- الدردشة والمشاركون ----- */}
      <section className="room-panel">
        <div className="room-panel__tabs" role="tablist">
          {["chat", "people"].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={panel === item}
              className="room-panel__tab"
              onClick={() => setPanel(item)}
            >
              {item === "chat"
                ? t("studyApp.streams.room.chat")
                : t("studyApp.streams.room.people", { count: peopleCount })}
            </button>
          ))}
        </div>

        {panel === "chat" ? (
          <RoomChat
            messages={room.messages}
            isOpen={timer.phase === "break"}
            secondsToOpen={timer.secondsLeft}
            onSend={(text) => streams.sendMessage(text, profile.me)}
          />
        ) : (
          <ul className="room-people">
            <li className="room-person">
              <span className="room-person__avatar" aria-hidden="true">
                <Avatar person={isHost ? profile.me : room.host} />
              </span>
              <bdi>{isHost ? profile.me.name : room.host.name}</bdi>
              <span className="room-person__badge">{t("studyApp.streams.room.host")}</span>
            </li>
            {isInRoom && !isHost && (
              <li className="room-person">
                <span className="room-person__avatar" aria-hidden="true">
                  <Avatar person={profile.me} />
                </span>
                <bdi>{profile.me.name}</bdi>
                <span className="room-person__badge">{t("studyApp.streams.room.you")}</span>
              </li>
            )}
            {room.participants.map((person) => (
              <li key={person.id} className="room-person">
                <span className="room-person__avatar" aria-hidden="true">
                  <Avatar person={person} />
                </span>
                <bdi>{person.name}</bdi>
                <span className="room-person__devices">
                  <Icon name={person.mic ? "mic" : "micOff"} size={14} />
                  <Icon name={person.cam ? "video" : "videoOff"} size={14} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* رسائل صغيرة: انضمام، تبدّل المرحلة، أخطاء الكاميرا */}
      <div className="room-toasts" role="status">
        {[...(isInRoom ? streams.notices.map((notice) => ({ id: notice.id, text: t(notice.key, notice.values) })) : []), ...toasts].map(
          (toast) => (
            <div key={toast.id} className="room-toast">
              {toast.text}
            </div>
          )
        )}
      </div>

      {isReporting && (
        <ReportDialog
          onSubmit={() => {
            setIsReporting(false);
            showToast(t("studyApp.profile.reported"));
          }}
          onClose={() => setIsReporting(false)}
        />
      )}
    </>
  );
}

export default StreamRoom;