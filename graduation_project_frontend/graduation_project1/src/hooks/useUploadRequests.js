import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { deleteMedia, getMedia, saveMedia } from "../utils/mediaStore.js";
import { useDecisionNotices } from "./useSharedStorage.js";

// ----- طلبات رفع الطلاب (أصوات وخلفيات) اللي بتستنى قرار الأدمن -----
// الملف نفسه بـ IndexedDB، ومعلوماته (الاسم، الحالة، مين رفعه) بـ localStorage.
// نفس القائمة بتقرأها صفحة الطالب ولوحة الأدمن، وأي تغيير بيوصل فورًا للتبويبات الثانية.
// لاحقًا: الطلبات والملفات بتنرفع على السيرفر.

const EMPTY = [];

/**
 * مخزن طلبات لنوع واحد (أصوات أو خلفيات).
 * key: مكان الحفظ بـ localStorage
 * يرجع: load (القائمة الحالية)، update(change) للتعديل، useItems() هوك بيرجع القائمة ويتحدّث معها
 */
export function createUploadStore(key) {
  const changeEvent = `${key}-change`;
  // نفس النص = نفس المصفوفة (useSyncExternalStore بدّه نفس المرجع إذا ما تغيّر شي)
  let cachedText;
  let cachedItems = EMPTY;

  function load() {
    try {
      const text = localStorage.getItem(key);
      if (text !== cachedText) {
        cachedText = text;
        const saved = JSON.parse(text);
        cachedItems = Array.isArray(saved) ? saved : EMPTY;
      }
    } catch {
      // بيانات تالفة: نبدأ بقائمة فاضية
      cachedItems = EMPTY;
    }

    return cachedItems;
  }

  // تغيير بنفس التبويب (حدث خاص) أو بتبويب ثاني (حدث storage)
  function subscribe(onChange) {
    function handleStorage(event) {
      if (event.key === key || event.key === null) onChange();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(changeEvent, onChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(changeEvent, onChange);
    };
  }

  // change(current) ← القائمة الجديدة (نفس القائمة = ما في تغيير)
  function update(change) {
    const current = load();
    const next = change(current);
    if (next === current) return;

    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(changeEvent));
  }

  function useItems() {
    return useSyncExternalStore(subscribe, load, () => EMPTY);
  }

  return { load, update, useItems };
}

/**
 * روابط تشغيل (Object URL) لملفات الطلبات المحفوظة بـ IndexedDB: { رقم الطلب: الرابط }
 * الطلب اللي انحذف بينحذف رابطه من الذاكرة.
 */
function useMediaUrls(items) {
  const [urls, setUrls] = useState({});
  const urlsRef = useRef({});
  const loadingRef = useRef(new Set());
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const saved = urlsRef.current;

    return () => {
      isMountedRef.current = false;
      Object.values(saved).forEach((url) => URL.revokeObjectURL(url));
      Object.keys(saved).forEach((id) => delete saved[id]);
    };
  }, []);

  useEffect(() => {
    const ids = new Set(items.map((item) => item.id));

    // طلبات انحذفت: بنحرّر روابطها
    const removed = Object.keys(urlsRef.current).filter((id) => !ids.has(id));
    if (removed.length > 0) {
      removed.forEach((id) => {
        URL.revokeObjectURL(urlsRef.current[id]);
        delete urlsRef.current[id];
      });
      setUrls({ ...urlsRef.current });
    }

    // طلبات جديدة: بنجهّز رابط تشغيل
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

  return urls;
}

/**
 * طلبات الرفع لنوع واحد: للطالب (يرفع ويحذف ويوصله إشعار بالقرار) وللأدمن (يقبل أو يرفض).
 * store: من createUploadStore  •  idPrefix: بداية رقم الطلب ("u" للأصوات، "s" للخلفيات)
 * onReviewed(item): لما يوصل قرار الأدمن (مرة وحدة لكل طلب). بلوحة الأدمن ما بنمرّرها.
 * يرجع:
 * - items: كل الطلبات مع رابط تشغيلها (url)
 * - upload(file, data): طلب جديد "قيد المراجعة" (data: الاسم والمدة وغيرها)
 * - review(id, isApproved, reason): قرار الأدمن (reason: مفتاح سبب الرفض)
 * - remove(id): حذف الطلب وملفه
 */
export function useUploadRequests(store, { idPrefix, onReviewed } = {}) {
  const items = store.useItems();
  const urls = useMediaUrls(items);

  // إشعار صاحب الطلب بالقرار مرة وحدة (حتى لو كان الموقع مسكّر وقت القرار)
  useDecisionNotices(onReviewed ? items : EMPTY, onReviewed, store.update);

  async function upload(file, data) {
    const item = {
      id: `${idPrefix}-${crypto.randomUUID()}`,
      ...data,
      fileName: file.name,
      size: file.size,
      uploader: { ...CURRENT_USER },
      status: "pending",
      reason: null,
      createdAt: Date.now(),
    };

    // الملف أول، وبعدين القائمة: هيك لما يوصل الطلب للأدمن بيلاقي الملف جاهز
    await saveMedia(item.id, file);
    store.update((current) => [item, ...current]);
    return item;
  }

  function review(id, isApproved, reason = null) {
    store.update((current) => {
      const isPending = current.some((item) => item.id === id && item.status === "pending");
      if (!isPending) return current;

      return current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: isApproved ? "approved" : "rejected",
              reason: isApproved ? null : reason,
              reasonText: null,
              reviewedAt: Date.now(),
              // صاحب الطلب لسا ما وصله إشعار
              isNotified: false,
            }
          : item
      );
    });
  }

  function remove(id) {
    store.update((current) => current.filter((item) => item.id !== id));
    deleteMedia(id).catch(() => {});
  }

  return {
    items: items.map((item) => ({ ...item, url: urls[item.id] ?? null })),
    urls,
    upload,
    review,
    remove,
  };
}