import { useEffect, useRef, useState } from "react";
import { playChime } from "../utils/ambientSound.js";

const STORAGE_KEY = "areatk-session-plan";

// الجدول الافتراضي: بومودورو (25 دراسة ثم 5 استراحة، ويتكرر)
const DEFAULT_PLAN = {
  repeat: true,
  segments: [
    { id: "s1", kind: "study", minutes: 25, sounds: [] },
    { id: "s2", kind: "break", minutes: 5, sounds: [] },
  ],
};

function loadPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.segments?.length) return { ...DEFAULT_PLAN, ...saved };
  } catch {
    // جدول تالف: نستخدم الافتراضي
  }

  return DEFAULT_PLAN;
}

/**
 * مؤقت الجلسة حسب جدول مراحل يختاره الطالب.
 * كل مرحلة: { kind: "study" | "break", minutes, sounds: [أرقام الأصوات] }
 * status: idle (جاهز) | running (يعمل) | paused (متوقف مؤقتًا) | finished (انتهى الجدول)
 * onStudyEnd(minutes): عند انتهاء مرحلة دراسة
 * onSegmentStart(segment, plan): عند بداية أي مرحلة (لتغيير الأصوات)
 * الجدول يُعدَّل في أي وقت، حتى والمؤقت شغال
 */
export function useSessionTimer({ onStudyEnd, onSegmentStart } = {}) {
  const [plan, setPlan] = useState(loadPlan);
  const [status, setStatus] = useState("idle");
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(plan.segments[0].minutes * 60);

  // وقت انتهاء المرحلة الحالية: نحسب الباقي منه حتى لا يتأخر العدّ
  const endAtRef = useRef(0);
  // عند التخطي: الثواني التي دُرست فعلًا (حتى لا نحسب المرحلة كاملة)
  const skippedAtRef = useRef(null);
  const callbacksRef = useRef({ onStudyEnd, onSegmentStart });

  const segment = plan.segments[index] ?? plan.segments[0];
  const nextIndex = index + 1 < plan.segments.length ? index + 1 : plan.repeat ? 0 : null;
  const nextSegment = nextIndex === null ? null : plan.segments[nextIndex];
  const totalSeconds = segment.minutes * 60;

  // آخر نسخة من الدوال دون إعادة تشغيل المؤقت
  useEffect(() => {
    callbacksRef.current = { onStudyEnd, onSegmentStart };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  // العدّ أثناء التشغيل
  useEffect(() => {
    if (status !== "running") return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining > 0) return;

      playChime();

      // دقائق الدراسة الفعلية: كامل المرحلة، أو ما دُرس قبل التخطي
      const studied = skippedAtRef.current === null ? segment.minutes : Math.floor(skippedAtRef.current / 60);
      skippedAtRef.current = null;
      if (segment.kind === "study" && studied > 0) callbacksRef.current.onStudyEnd?.(studied);

      // انتهى الجدول ولا يتكرر
      if (nextSegment === null) {
        setStatus("finished");
        callbacksRef.current.onSegmentStart?.({ sounds: [] }, plan);
        return;
      }

      endAtRef.current = Date.now() + nextSegment.minutes * 60 * 1000;
      setIndex(nextIndex);
      setSecondsLeft(nextSegment.minutes * 60);
      callbacksRef.current.onSegmentStart?.(nextSegment, plan);
    }, 250);

    return () => clearInterval(timer);
  }, [status, segment, nextSegment, nextIndex, plan]);

  function start() {
    // بعد انتهاء الجدول نبدأ من أوله
    const startIndex = status === "finished" ? 0 : index;
    const startSegment = plan.segments[startIndex];
    const seconds = status === "paused" ? secondsLeft : startSegment.minutes * 60;

    if (status !== "paused") {
      setIndex(startIndex);
      setSecondsLeft(seconds);
      callbacksRef.current.onSegmentStart?.(startSegment, plan);
    }

    endAtRef.current = Date.now() + seconds * 1000;
    setStatus("running");
  }

  function pause() {
    setStatus("paused");
  }

  function reset() {
    setStatus("idle");
    setIndex(0);
    setSecondsLeft(plan.segments[0].minutes * 60);
  }

  // إنهاء المرحلة الحالية فورًا
  function skip() {
    skippedAtRef.current = totalSeconds - secondsLeft;
    endAtRef.current = Date.now();
    setStatus("running");
  }

  // تغيير الوقت الباقي (ونقل وقت النهاية إن كان المؤقت شغالًا)
  function setRemaining(seconds) {
    setSecondsLeft(seconds);
    if (status === "running") endAtRef.current = Date.now() + seconds * 1000;
  }

  // تعديل الجدول في أي وقت
  function updatePlan(changes) {
    const nextPlan = { ...plan, ...changes };
    setPlan(nextPlan);

    // المؤقت غير شغال: نجهّز المرحلة الأولى
    if (status === "idle" || status === "finished") {
      setIndex(0);
      setSecondsLeft(nextPlan.segments[0].minutes * 60);
      setStatus("idle");
      return;
    }

    // أثناء الجلسة: نكمل من نفس المرحلة إن بقيت موجودة
    const elapsed = totalSeconds - secondsLeft;
    const sameIndex = nextPlan.segments.findIndex((item) => item.id === segment.id);

    if (sameIndex === -1) {
      // حُذفت المرحلة الحالية: نبدأ المرحلة التي أخذت مكانها
      const newIndex = Math.min(index, nextPlan.segments.length - 1);
      const newSegment = nextPlan.segments[newIndex];

      setIndex(newIndex);
      setRemaining(newSegment.minutes * 60);
      callbacksRef.current.onSegmentStart?.(newSegment, nextPlan);
      return;
    }

    // تغيّرت مدة المرحلة الحالية: الباقي = المدة الجديدة - ما مضى
    const updated = nextPlan.segments[sameIndex];
    setIndex(sameIndex);
    setRemaining(Math.max(1, updated.minutes * 60 - elapsed));

    // تغيّرت أصوات المرحلة الحالية: نطبّقها فورًا
    if (updated.sounds.join() !== segment.sounds.join()) {
      callbacksRef.current.onSegmentStart?.(updated, nextPlan);
    }
  }

  return {
    plan,
    status,
    index,
    segment,
    nextSegment,
    phase: segment.kind,
    secondsLeft,
    totalSeconds,
    isActive: status === "running" || status === "paused",
    start,
    pause,
    reset,
    skip,
    updatePlan,
  };
}