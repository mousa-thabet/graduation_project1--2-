import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "areatk-community-alerts";

// الامتحان أو الدورة "جديد" إذا انتشر آخر أسبوع
const NEW_FOR = 7 * 24 * 60 * 60 * 1000;
// الإشعار بيوصل بعد لحظة (كأنه جاي من السيرفر)
const DELAY = 1500;

function loadSent() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return new Set(saved);
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return new Set();
}

/**
 * تنبيهات التواصل: إشعار مرة وحدة بس لكل شي جديد يهمني:
 * - حدا بتابعه بلّش بث مباشر
 * - امتحان أو دورة جديدة (آخر أسبوع) بمجتمع أنا داخل فيه
 * الآن: بنفحص المحتوى الموجود ونبعت الإشعار مرة وحدة (ونحفظ إنه انبعت).
 * لاحقًا: السيرفر بيبعت الإشعار لحظة النشر (WebSocket أو Push Notifications).
 *
 * posts / exams / courses: المحتوى  •  following: أرقام اللي بتابعهم
 * isInMyCommunities(item): هل هو بمجتمعاتي؟  •  onAlert(alert): بعت الإشعار
 * alert: { key, kind: "live" | "exam" | "course", item }
 */
export function useCommunityAlerts({ posts, exams, courses, following, isInMyCommunities, onAlert }) {
  const sentRef = useRef(null);
  if (sentRef.current === null) sentRef.current = loadSent();
  const [openedAt] = useState(() => Date.now());
  const onAlertRef = useRef(onAlert);

  // آخر نسخة من الدالة (حتى لا يتغير المؤقت كل رسم)
  useEffect(() => {
    onAlertRef.current = onAlert;
  });

  const isNew = (item) => !item.isMine && openedAt - item.createdAt < NEW_FOR && isInMyCommunities(item);

  // كل شي بيستاهل إشعار، واللي لسا ما انبعتله
  const pending = [
    ...posts
      .filter((post) => post.type === "live" && post.live?.status === "live" && !post.isMine)
      .filter((post) => following.includes(post.author.id))
      .map((item) => ({ key: `live:${item.id}`, kind: "live", item })),
    ...exams.filter(isNew).map((item) => ({ key: `exam:${item.id}`, kind: "exam", item })),
    ...courses.filter(isNew).map((item) => ({ key: `course:${item.id}`, kind: "course", item })),
  ].filter((alert) => !sentRef.current.has(alert.key));

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  });

  // نص ثابت يتغير بس لما يجي شي جديد (مثلًا تابعت حدا عم يبث، أو انضميت لمجتمع)
  const pendingKey = pending.map((alert) => alert.key).join(",");

  useEffect(() => {
    if (!pendingKey) return;

    const timer = setTimeout(() => {
      pendingRef.current.forEach((alert) => {
        if (sentRef.current.has(alert.key)) return;

        // نحفظ قبل ما نبعت حتى ما يتكرر الإشعار
        sentRef.current.add(alert.key);
        onAlertRef.current(alert);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...sentRef.current]));
    }, DELAY);

    return () => clearTimeout(timer);
  }, [pendingKey]);
}