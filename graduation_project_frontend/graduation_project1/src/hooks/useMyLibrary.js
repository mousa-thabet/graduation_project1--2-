import { useEffect, useState } from "react";
import { SESSION_SOUNDS } from "../data/sessionSounds.js";
import { SESSION_SCENES } from "../data/sessionScenes.js";
import { useStorageSync } from "./useSharedStorage.js";

// ----- مكتبتي: الأصوات والخلفيات اللي اختارها الطالب، واللي نقلها منها لجلستي -----
// جلستي بتعرض بس اللي نقلته من مكتبتي.
export const MY_LIBRARY_KEY = "areatk-my-library";

// kind: "sounds" أو "scenes"
export const LIBRARY_KINDS = ["sounds", "scenes"];

// أول مرة: مكتبتي وجلستي فيهم أصوات وخلفيات المنصة الأصلية (حتى ما تكون الجلسة فاضية)
const DEFAULT_LIBRARY = {
  sounds: SESSION_SOUNDS.map((sound) => sound.id),
  scenes: SESSION_SCENES.map((scene) => scene.id),
  session: {
    sounds: SESSION_SOUNDS.map((sound) => sound.id),
    scenes: SESSION_SCENES.map((scene) => scene.id),
  },
};

function loadLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(MY_LIBRARY_KEY));
    if (saved && Array.isArray(saved.sounds) && Array.isArray(saved.scenes) && saved.session) return saved;
  } catch {
    // بيانات تالفة: نرجع للبداية
  }

  return DEFAULT_LIBRARY;
}

const without = (list, id) => list.filter((item) => item !== id);

/**
 * مكتبتي وجلستي.
 * - has(kind, id): بمكتبتي؟  •  toggle(kind, id): أضف لمكتبتي أو شيله (وبينشال من جلستي كمان)
 * - inSession(kind, id): بجلستي؟  •  toggleSession(kind, id): انقل لجلستي أو شيله منها
 * - moveAllToSession(): كل اللي بمكتبتي بينتقل لجلستي
 * الأرقام بتنحفظ بس، والصوت أو الخلفية نفسها بتنجاب من قوائم المكتبة.
 */
export function useMyLibrary() {
  const [library, setLibrary] = useState(loadLibrary);

  useEffect(() => {
    localStorage.setItem(MY_LIBRARY_KEY, JSON.stringify(library));
  }, [library]);

  // تبويب ثاني غيّر مكتبتي: بنقرأها من جديد
  useStorageSync(MY_LIBRARY_KEY, () => setLibrary(loadLibrary()));

  const has = (kind, id) => library[kind].includes(id);
  const inSession = (kind, id) => library.session[kind].includes(id);

  function toggle(kind, id) {
    setLibrary((current) =>
      current[kind].includes(id)
        ? {
            ...current,
            [kind]: without(current[kind], id),
            session: { ...current.session, [kind]: without(current.session[kind], id) },
          }
        : { ...current, [kind]: [...current[kind], id] }
    );
  }

  // النقل لجلستي بيضيفه لمكتبتي كمان (إذا مش موجود)
  function toggleSession(kind, id) {
    setLibrary((current) =>
      current.session[kind].includes(id)
        ? { ...current, session: { ...current.session, [kind]: without(current.session[kind], id) } }
        : {
            ...current,
            [kind]: current[kind].includes(id) ? current[kind] : [...current[kind], id],
            session: { ...current.session, [kind]: [...current.session[kind], id] },
          }
    );
  }

  function moveAllToSession() {
    setLibrary((current) => ({ ...current, session: { sounds: [...current.sounds], scenes: [...current.scenes] } }));
  }

  return { ...library, has, inSession, toggle, toggleSession, moveAllToSession };
}