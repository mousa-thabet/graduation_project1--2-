import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { localName } from "../data/communities.js";
import { deleteMedia, getMedia, saveMedia } from "../utils/mediaStore.js";
import { useStorageSync } from "./useSharedStorage.js";

// ----- مكتبة المنصة الرسمية: أصوات وخلفيات بيرفعها الأدمن -----
// الملف نفسه بـ IndexedDB (نفس المكان بكل التبويبات)، ومعلوماته (الاسم، النوع، المدة) بـ localStorage
// لاحقًا: الملفات بتنرفع على السيرفر، والقائمة بتيجي منه
export const OFFICIAL_LIBRARY_KEY = "areatk-official-library";

export const OFFICIAL_LIMITS = {
  sound: { accept: "audio/*", type: "audio/", maxSize: 15 * 1024 * 1024 },
  scene: { accept: "video/*", type: "video/", maxSize: 60 * 1024 * 1024 },
};

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFICIAL_LIBRARY_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ بمكتبة فاضية
  }

  return [];
}

/**
 * مكتبة المنصة الرسمية (الأدمن بيضيف وبيحذف، والطلاب بيشوفوا).
 * items: كل اللي انرفع مع رابط تشغيله (url)
 * sounds: الأصوات بالشكل اللي بيفهمه خلاط الجلسة  •  scenes: الخلفيات بالشكل اللي بيفهمه مشهد الجلسة
 * add({ kind, file, name, duration })  •  remove(id)
 */
export function useOfficialLibrary() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const [items, setItems] = useState(loadItems);
  // روابط مؤقتة (Object URL) لتشغيل الملفات: { رقم العنصر: الرابط }
  const [urls, setUrls] = useState({});
  const urlsRef = useRef({});
  // اللي عم نحمّله هلأ (حتى ما نحمّل نفس الملف مرتين)
  const loadingRef = useRef(new Set());
  const isMountedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(OFFICIAL_LIBRARY_KEY, JSON.stringify(items));
  }, [items]);

  // الأدمن ضاف أو حذف بتبويب ثاني: بنقرأ القائمة من جديد
  useStorageSync(OFFICIAL_LIBRARY_KEY, () => setItems(loadItems()));

  // نجهّز رابط تشغيل لكل ملف ما إله رابط لسا
  useEffect(() => {
    items.forEach((item) => {
      if (urlsRef.current[item.id] || loadingRef.current.has(item.id)) return;

      loadingRef.current.add(item.id);
      getMedia(item.id)
        .then((blob) => {
          if (!blob || !isMountedRef.current) return;
          const url = URL.createObjectURL(blob);
          urlsRef.current[item.id] = url;
          setUrls((current) => ({ ...current, [item.id]: url }));
        })
        .catch(() => {})
        .finally(() => loadingRef.current.delete(item.id));
    });
  }, [items]);

  // لما تتسكّر الصفحة: بنحرّر الروابط من الذاكرة
  useEffect(() => {
    const saved = urlsRef.current;
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      Object.values(saved).forEach((url) => URL.revokeObjectURL(url));
      Object.keys(saved).forEach((id) => delete saved[id]);
    };
  }, []);

  // رفع صوت أو خلفية جديدة
  // kind: "sound" أو "scene"  •  name: { ar, en }  •  duration: مدة الصوت بالثواني
  async function add({ kind, file, name, duration = null }) {
    const item = {
      id: `o-${crypto.randomUUID()}`,
      kind,
      name,
      duration,
      size: file.size,
      createdAt: Date.now(),
    };

    // الملف أول، وبعدين القائمة: هيك لما يوصل التحديث للتبويب الثاني بيلاقي الملف جاهز
    await saveMedia(item.id, file);
    setItems((current) => [item, ...current]);
    return item;
  }

  function remove(id) {
    deleteMedia(id);
    if (urlsRef.current[id]) URL.revokeObjectURL(urlsRef.current[id]);
    delete urlsRef.current[id];
    setItems((current) => current.filter((item) => item.id !== id));
  }

  // بس اللي جاهز رابطه، واسمه بلغة الموقع
  const ready = items
    .filter((item) => urls[item.id])
    .map((item) => ({ ...item, url: urls[item.id], label: localName(item, language) }));

  return {
    items: items.map((item) => ({ ...item, url: urls[item.id] ?? null, label: localName(item, language) })),
    sounds: ready
      .filter((item) => item.kind === "sound")
      .map((item) => ({ id: item.id, name: item.label, icon: "music", src: item.url, isOfficial: true })),
    scenes: ready
      .filter((item) => item.kind === "scene")
      .map((item) => ({ id: item.id, name: item.label, src: item.url, isOfficial: true })),
    add,
    remove,
  };
}