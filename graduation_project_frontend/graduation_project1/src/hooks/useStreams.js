import { useEffect, useRef, useState } from "react";
import { DEMO_JOINERS, DEMO_MESSAGES, LIVE_ROOMS, RECORDED_STREAMS, STREAM_PLANS } from "../data/studyRooms.js";
import { deleteMedia, saveMedia } from "../utils/mediaStore.js";

const STORAGE_KEY = "areatk-streams";

// مدة الإشعار الصغير داخل البث ("انضم فلان")
const NOTICE_TIME = 3500;

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { myRecordings: saved.myRecordings ?? [], liked: saved.liked ?? [] };
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return { myRecordings: [], liked: [] };
}

// إيقاف الكاميرا والمايك (يطفي ضوء الكاميرا)
function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * البثوث: المشاهدة والانضمام، فتح بث، المؤقت المشترك، الدردشة، الكاميرا، والتسجيل.
 * يُستدعى مرة واحدة في StudyLayout، فالبث يبقى شغالًا عند التنقل بين الصفحات.
 *
 * الكاميرا حقيقية (getUserMedia) والتسجيل حقيقي (MediaRecorder) ويُحفظ في IndexedDB،
 * أما وصول البث والرسائل لباقي الناس فمحاكاة إلى أن يجهز الباك إند (WebRTC و WebSocket).
 */
export function useStreams() {
  const [saved, setSaved] = useState(loadSaved);
  const [rooms, setRooms] = useState(() => LIVE_ROOMS.map((room) => ({ ...room, messages: [] })));
  const [activeRoomId, setActiveRoomId] = useState(null);
  // حالتي داخل البث: المايك والكاميرا (stream: كاميرتي الحقيقية)
  const [myMedia, setMyMedia] = useState({ mic: false, cam: false, stream: null });
  const [notices, setNotices] = useState([]);
  const timersRef = useRef([]);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  // رقم البث الحالي فورًا (state يتأخر حتى الرسم التالي، فلا ينفع لمنع الانضمام مرتين)
  const activeIdRef = useRef(null);

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;
  const recordings = [...saved.myRecordings, ...RECORDED_STREAMS].map((recording) => ({
    ...recording,
    isLiked: saved.liked.includes(recording.id),
    likes: recording.likes + (saved.liked.includes(recording.id) ? 1 : 0),
  }));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  // عند مغادرة القسم: نطفي الكاميرا ونلغي المؤقتات
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      stopStream(streamRef.current);
    };
  }, []);

  function later(callback, delay) {
    timersRef.current.push(setTimeout(callback, delay));
  }

  // إشعار يختفي وحده (key: مفتاح الترجمة، values: المتغيرات)
  function notify(key, values) {
    const id = crypto.randomUUID();
    setNotices((current) => [...current, { id, key, values }]);
    later(() => setNotices((current) => current.filter((notice) => notice.id !== id)), NOTICE_TIME);
  }

  function updateRoom(roomId, update) {
    setRooms((current) => current.map((room) => (room.id === roomId ? update(room) : room)));
  }

  function setActiveRoom(roomId) {
    activeIdRef.current = roomId;
    setActiveRoomId(roomId);
  }

  function setMyStream(stream) {
    streamRef.current = stream;
    setMyMedia((current) => ({ ...current, stream }));
  }

  // ----- المشاهدة -----

  function join(roomId) {
    if (activeIdRef.current === roomId) return;
    if (activeIdRef.current) leave();

    updateRoom(roomId, (room) => ({ ...room, viewers: room.viewers + 1 }));
    setActiveRoom(roomId);
  }

  // المشاهد يخرج فقط، وصاحب البث يجب أن ينهيه (endStream)
  function leave() {
    if (!activeRoom || activeRoom.isMine) return;

    updateRoom(activeRoom.id, (room) => ({ ...room, viewers: Math.max(0, room.viewers - 1) }));
    stopStream(streamRef.current);
    setMyStream(null);
    setMyMedia({ mic: false, cam: false, stream: null });
    setActiveRoom(null);
  }

  // ----- فتح بث -----

  // me: أنا  •  stream: كاميرتي/مايكي من نافذة البدء (أو null)  •  thumbnail: صورة الواجهة (أو null)
  function goLive({ title, thumbnail, planId, isRecorded, stream }, me) {
    if (activeIdRef.current) leave();

    const plan = STREAM_PLANS.find((item) => item.id === planId) ?? STREAM_PLANS[0];
    const room = {
      id: crypto.randomUUID(),
      title,
      thumbnail,
      host: { id: me.id, name: me.name, handle: me.handle, avatar: me.avatar },
      startedAt: Date.now(),
      timer: { focus: plan.focus, break: plan.break },
      isRecorded,
      isMine: true,
      video: null,
      viewers: 0,
      participants: [],
      messages: [],
    };

    setRooms((current) => [room, ...current]);
    setActiveRoom(room.id);
    setMyStream(stream);
    setMyMedia({
      stream,
      cam: Boolean(stream?.getVideoTracks().length),
      mic: Boolean(stream?.getAudioTracks().length),
    });

    // التسجيل الحقيقي: MediaRecorder يجمع الفيديو قطعًا كل ثانية
    // (إن فشل التسجيل لأي سبب يستمر البث بدونه)
    if (isRecorded && stream && typeof MediaRecorder !== "undefined") {
      try {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
        recorder.start(1000);
        recorderRef.current = { recorder, chunks };
      } catch {
        recorderRef.current = null;
      }
    }

    // محاكاة: ناس ينضمون ويتفرجون بعد ثوانٍ
    DEMO_JOINERS.forEach((person, index) => {
      later(() => {
        updateRoom(room.id, (current) => ({
          ...current,
          participants: [...current.participants, person],
          viewers: current.viewers + 3,
        }));
        notify("studyApp.streams.room.joined", { name: person.name });
      }, 3000 + index * 3500);
    });

    return room.id;
  }

  // إنهاء بثي: يُحفظ تسجيله إن كان مسجّلًا، وترجع رقم التسجيل (أو null)
  function endStream() {
    if (!activeRoom?.isMine) return null;

    const room = activeRoom;
    const recordingId = room.isRecorded ? `rec-${room.id}` : null;

    if (recordingId) {
      const recording = {
        id: recordingId,
        title: room.title,
        thumbnail: room.thumbnail,
        host: { id: room.host.id, name: room.host.name, handle: room.host.handle },
        endedAt: Date.now(),
        // بالدقائق مثل باقي التسجيلات (قد تكون كسرًا إن كان البث قصيرًا)
        duration: (Date.now() - room.startedAt) / 60000,
        views: room.viewers,
        likes: 0,
        isMine: true,
        mediaId: recorderRef.current ? recordingId : null,
        isReady: !recorderRef.current,
      };

      setSaved((current) => ({ ...current, myRecordings: [recording, ...current.myRecordings] }));

      // نوقف التسجيل، ولما تجهز القطع نحفظ الفيديو في IndexedDB
      if (recorderRef.current) {
        const { recorder, chunks } = recorderRef.current;
        recorder.onstop = async () => {
          await saveMedia(recordingId, new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
          setSaved((current) => ({
            ...current,
            myRecordings: current.myRecordings.map((item) => (item.id === recordingId ? { ...item, isReady: true } : item)),
          }));
        };
        recorder.stop();
      }
    }

    recorderRef.current = null;
    stopStream(streamRef.current);
    setMyStream(null);
    setMyMedia({ mic: false, cam: false, stream: null });
    setRooms((current) => current.filter((item) => item.id !== room.id));
    setActiveRoom(null);

    return recordingId;
  }

  // ----- الكاميرا والمايك داخل البث -----

  // الكاميرا: أول مرة نطلب الإذن من المتصفح، وبعدها نطفيها ونشغلها
  async function toggleCam() {
    const videoTrack = streamRef.current?.getVideoTracks()[0];

    if (myMedia.cam) {
      // صاحب البث: نطفي الصورة فقط حتى يستمر التسجيل، والمشاهد: نطفي الكاميرا كلها
      if (activeRoom?.isMine) {
        if (videoTrack) videoTrack.enabled = false;
      } else {
        stopStream(streamRef.current);
        setMyStream(null);
      }
      setMyMedia((current) => ({ ...current, cam: false }));
      return;
    }

    if (videoTrack && videoTrack.readyState === "live") {
      videoTrack.enabled = true;
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMyStream(stream);
    }
    setMyMedia((current) => ({ ...current, cam: true }));
  }

  function toggleMic() {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !myMedia.mic;
    setMyMedia((current) => ({ ...current, mic: !current.mic }));
  }

  // ----- الدردشة -----

  function sendMessage(text, me) {
    if (!activeRoom) return;

    const message = { id: crypto.randomUUID(), author: me, text, createdAt: Date.now(), isMine: true };
    updateRoom(activeRoom.id, (room) => ({ ...room, messages: [...room.messages, message] }));
  }

  // رسالة من شخص في البث (محاكاة، لاحقًا تصل من WebSocket)
  function receiveMessage(roomId) {
    updateRoom(roomId, (room) => {
      const people = room.participants.length ? room.participants : [room.host];
      const author = people[Math.floor(Math.random() * people.length)];
      const text = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
      const message = { id: crypto.randomUUID(), author, text, createdAt: Date.now() };

      // نحتفظ بآخر 50 رسالة فقط
      return { ...room, messages: [...room.messages, message].slice(-50) };
    });
  }

  // ----- التسجيلات -----

  function toggleLike(recordingId) {
    setSaved((current) => ({
      ...current,
      liked: current.liked.includes(recordingId)
        ? current.liked.filter((id) => id !== recordingId)
        : [...current.liked, recordingId],
    }));
  }

  function deleteRecording(recordingId) {
    deleteMedia(recordingId);
    setSaved((current) => ({
      ...current,
      myRecordings: current.myRecordings.filter((item) => item.id !== recordingId),
      liked: current.liked.filter((id) => id !== recordingId),
    }));
  }

  return {
    rooms,
    recordings,
    activeRoom,
    myMedia,
    notices,
    join,
    leave,
    goLive,
    endStream,
    toggleCam,
    toggleMic,
    sendMessage,
    receiveMessage,
    toggleLike,
    deleteRecording,
  };
}