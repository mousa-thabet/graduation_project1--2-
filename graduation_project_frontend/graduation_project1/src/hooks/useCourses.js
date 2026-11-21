import { useEffect, useState } from "react";
import { COMMUNITY_COURSES } from "../data/communityCourses.js";
import { deleteMedia, saveMedia } from "../utils/mediaStore.js";
import { isStaticMedia } from "./useMediaUrl.js";

const COURSES_KEY = "areatk-community-courses";
const PROGRESS_KEY = "areatk-community-course-progress";
// الدورتين التجريبيتين القديمتين اللي كانوا بينضافوا كأنهم "إلي": بنشيلهم من دوراتي
const OLD_DEMO_PREFIX = "course-demo-";
const OLD_DEMO_KEY = "areatk-community-courses-demo";

// حذف فيديو درس من IndexedDB (فيديوهات public الثابتة مش محفوظة هناك)
function removeVideo(video) {
  if (video?.mediaId && !isStaticMedia(video.mediaId)) deleteMedia(video.mediaId);
}

// دوراتي المحفوظة (بدون الدورات التجريبية القديمة)
function loadMyCourses() {
  localStorage.removeItem(OLD_DEMO_KEY);
  return load(COURSES_KEY, []).filter((course) => !course.id.startsWith(OLD_DEMO_PREFIX));
}

function load(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return fallback;
}

/**
 * دورات التواصل: التجريبية + دوراتي، وتسجيلي وتقدّمي فيها.
 * دوراتي إلها حالة (status): "draft" مسودة (بس أنا بشوفها) أو "published" منشورة للطلاب.
 * الدورات القديمة اللي ما إلها حالة بتنحسب منشورة.
 * progress: { [courseId]: { done: [أرقام الدروس اللي خلصتها], enrolledAt } }
 * معلومات الدورات في localStorage، وفيديوهات الدروس في IndexedDB (رقمها: courseId-lessonId).
 */
export function useCourses() {
  const [myCourses, setMyCourses] = useState(loadMyCourses);
  const [progress, setProgress] = useState(() => load(PROGRESS_KEY, {}));

  useEffect(() => {
    localStorage.setItem(COURSES_KEY, JSON.stringify(myCourses));
  }, [myCourses]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  // دوراتي أولًا (الأحدث)، ثم التجريبية
  const courses = [...myCourses.map((course) => ({ ...course, isMine: true })), ...COMMUNITY_COURSES];

  const findCourse = (id) => courses.find((course) => course.id === id) ?? null;

  // تجهيز الدروس للحفظ: الفيديو الجديد بيتحفظ في IndexedDB، والقديم بيضل زي ما هو
  // lesson: { id (للدرس القديم), title, duration, notes, file (فيديو جديد), video (الفيديو القديم) }
  function saveLessons(courseId, lessons) {
    return lessons.map(({ file, video, ...lesson }) => {
      // الدرس الجديد بياخد رقم جديد، والقديم بيضل برقمه حتى ما يضيع تقدّم الطلاب
      const lessonId = lesson.id ?? `l-${crypto.randomUUID().slice(0, 8)}`;
      if (!file) return { ...lesson, id: lessonId, ...(video && { video }) };

      // فيديو جديد: الملف نفسه في IndexedDB، ونحفظ رقمه فقط
      const mediaId = `${courseId}-${lessonId}-${Date.now().toString(36)}`;
      saveMedia(mediaId, file);
      return { ...lesson, id: lessonId, video: { mediaId, name: file.name } };
    });
  }

  // دورة جديدة: { title, description, communityId, branchId, level, status, lessons }
  // status: "draft" (مسودة) أو "published" (منشورة، وهو الافتراضي)  •  ترجع رقم الدورة الجديدة
  function addCourse({ lessons, status = "published", ...data }, author) {
    const id = `course-${crypto.randomUUID()}`;
    const now = Date.now();
    const course = {
      ...data,
      id,
      author,
      status,
      students: 0,
      createdAt: now,
      updatedAt: now,
      ...(status === "published" && { publishedAt: now }),
      lessons: saveLessons(id, lessons),
    };

    setMyCourses((current) => [course, ...current]);
    return id;
  }

  // تعديل دورتي (مسودة أو منشورة): فيديوهات الدروس المحذوفة (أو اللي شلت فيديوها) بتنحذف من IndexedDB
  // data.status (اختياري): نشر المسودة، أو إرجاع المنشورة لمسودة
  // ترجع الدروس زي ما انحفظت (الفيديو الجديد صار إله رقم)، حتى المحرّر يكمل عليها
  function updateCourse(id, { lessons, ...data }) {
    const old = myCourses.find((course) => course.id === id);
    if (!old) return [];

    const newLessons = saveLessons(id, lessons);
    const keptMedia = new Set(newLessons.map((lesson) => lesson.video?.mediaId).filter(Boolean));
    old.lessons.forEach((lesson) => {
      if (lesson.video && !keptMedia.has(lesson.video.mediaId)) removeVideo(lesson.video);
    });

    const now = Date.now();
    const isFirstPublish = data.status === "published" && !old.publishedAt && old.status === "draft";

    setMyCourses((current) =>
      current.map((course) =>
        course.id === id
          ? {
              ...course,
              ...data,
              lessons: newLessons,
              editedAt: now,
              updatedAt: now,
              ...(isFirstPublish && { publishedAt: now }),
            }
          : course
      )
    );

    return newLessons;
  }

  // نشر دورتي أو إرجاعها مسودة بدون ما نغيّر محتواها (من صفحة "دوراتي")
  function setCourseStatus(id, status) {
    const now = Date.now();
    setMyCourses((current) =>
      current.map((course) =>
        course.id === id
          ? { ...course, status, updatedAt: now, ...(status === "published" && !course.publishedAt && { publishedAt: now }) }
          : course
      )
    );
  }

  function deleteCourse(id) {
    const course = myCourses.find((item) => item.id === id);
    course?.lessons.forEach((lesson) => removeVideo(lesson.video));

    setMyCourses((current) => current.filter((item) => item.id !== id));
    setProgress((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  const isEnrolled = (courseId) => Boolean(progress[courseId]);

  function enroll(courseId) {
    setProgress((current) => (current[courseId] ? current : { ...current, [courseId]: { done: [], enrolledAt: Date.now() } }));
  }

  // إلغاء التسجيل يحذف التقدّم
  function leave(courseId) {
    setProgress((current) => {
      const next = { ...current };
      delete next[courseId];
      return next;
    });
  }

  // درس خلص / لسا (يسجّل بالدورة تلقائيًا إذا مش مسجّل)
  function toggleLesson(courseId, lessonId) {
    setProgress((current) => {
      const entry = current[courseId] ?? { done: [], enrolledAt: Date.now() };
      const done = entry.done.includes(lessonId)
        ? entry.done.filter((id) => id !== lessonId)
        : [...entry.done, lessonId];

      return { ...current, [courseId]: { ...entry, done } };
    });
  }

  // نسبة الإنجاز من 0 لـ 100
  function percentOf(course) {
    const done = progress[course.id]?.done ?? [];
    const count = course.lessons.filter((lesson) => done.includes(lesson.id)).length;
    return course.lessons.length > 0 ? Math.round((count / course.lessons.length) * 100) : 0;
  }

  const isLessonDone = (courseId, lessonId) => Boolean(progress[courseId]?.done.includes(lessonId));

  return {
    courses,
    findCourse,
    addCourse,
    updateCourse,
    setCourseStatus,
    deleteCourse,
    isEnrolled,
    enroll,
    leave,
    toggleLesson,
    isLessonDone,
    percentOf,
  };
}