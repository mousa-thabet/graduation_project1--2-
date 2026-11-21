import { useEffect, useState } from "react";
import { useSessionTimer } from "./useSessionTimer.js";
import { useSoundMixer } from "./useSoundMixer.js";
import { useSessionStats } from "./useSessionStats.js";
import { COMMUNITY_SOUNDS, SESSION_SOUNDS } from "../data/sessionSounds.js";

const STORAGE_KEY = "areatk-session";

// sceneId: الخلفية، goal: هدف الجلسة، taskId: مهمة مربوطة من خطتي
const DEFAULT_PREFS = { sceneId: "espresso", goal: "", taskId: null };

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { ...DEFAULT_PREFS, ...saved };
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return DEFAULT_PREFS;
}

/**
 * كل ما يخص جلستي في مكان واحد: المؤقت وجدول المراحل، خلاط الأصوات، الإحصائيات، والهدف والخلفية.
 * يُستدعى في StudyLayout حتى تبقى الجلسة شغالة عند التنقل بين الصفحات.
 * mySounds: أصواتي التي وافقت عليها الإدارة (تُضاف للخلاط)
 */
export function useStudySession(mySounds = []) {
  const [prefs, setPrefs] = useState(loadPrefs);
  // دقائق الدراسة في هذه الجلسة (منذ آخر إعادة)
  const [sessionMinutes, setSessionMinutes] = useState(0);
  // آخر جولة انتهت: لإظهار رسالة "أحسنت" وزر المشاركة
  const [lastRound, setLastRound] = useState(null);

  const stats = useSessionStats();
  // أصوات الخلاط: المنصة، ثم الطلبة، ثم أصواتي
  const mixer = useSoundMixer([...SESSION_SOUNDS, ...COMMUNITY_SOUNDS, ...mySounds]);
  const timer = useSessionTimer({
    onStudyEnd(minutes) {
      stats.addRound(minutes);
      setSessionMinutes((current) => current + minutes);
      setLastRound({ minutes, at: Date.now() });
    },

    // كل مرحلة تشغّل أصواتها (إذا حدد الطالب أصواتًا في الجدول، وإلا يبقى الخلاط يدويًا)
    onSegmentStart(segment, plan) {
      const usesSounds = plan.segments.some((item) => item.sounds.length > 0);
      if (usesSounds) mixer.setActive(segment.sounds);
    },
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  function updatePrefs(changes) {
    setPrefs((current) => ({ ...current, ...changes }));
  }

  // إعادة المؤقت تبدأ جلسة جديدة
  function reset() {
    timer.reset();
    setSessionMinutes(0);
    setLastRound(null);
  }

  return {
    ...prefs,
    updatePrefs,
    timer: { ...timer, reset },
    mixer,
    stats,
    sessionMinutes,
    lastRound,
    dismissRound: () => setLastRound(null),
  };
}