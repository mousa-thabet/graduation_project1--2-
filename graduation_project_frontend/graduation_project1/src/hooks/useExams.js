import { useEffect, useState } from "react";
import { COMMUNITY_EXAMS } from "../data/communityExams.js";
import { deleteMedia } from "../utils/mediaStore.js";

const EXAMS_KEY = "areatk-community-exams";
const RESULTS_KEY = "areatk-community-exam-results";

function load(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return fallback;
}

// صور أسئلة امتحان (محفوظة بـ IndexedDB)
export const examImages = (exam) => (exam?.questions ?? []).map((question) => question.image).filter(Boolean);

// حذف صور ما عاد إلها استخدام (الخطأ هون ما بيوقف شي)
export function deleteImages(ids) {
  ids.forEach((id) => deleteMedia(id).catch(() => {}));
}

/**
 * امتحانات التواصل: التجريبية + اللي نشرتها أنا، ونتائجي فيها.
 * السؤال: { id, text, options, answer, image?: رقم الصورة بـ IndexedDB, table?: { rows, hasHeader }, code?, explanation? }
 * results: { [examId]: { answers: [رقم الخيار لكل سؤال أو null], score, total, finishedAt } }
 * الآن: كل شي محفوظ في المتصفح. لاحقًا: الامتحانات والنتائج من السيرفر.
 */
export function useExams() {
  const [myExams, setMyExams] = useState(() => load(EXAMS_KEY, []));
  const [results, setResults] = useState(() => load(RESULTS_KEY, {}));

  useEffect(() => {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(myExams));
  }, [myExams]);

  useEffect(() => {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  }, [results]);

  // امتحاناتي أولًا (الأحدث)، ثم التجريبية
  const exams = [...myExams.map((exam) => ({ ...exam, isMine: true })), ...COMMUNITY_EXAMS];

  const findExam = (id) => exams.find((exam) => exam.id === id) ?? null;

  // نشر امتحان: { title, description, communityId, branchId, duration, questions }
  function addExam(data, author) {
    const exam = { ...data, id: `exam-${crypto.randomUUID()}`, author, createdAt: Date.now() };
    setMyExams((current) => [exam, ...current]);
    return exam.id;
  }

  // تعديل امتحاني بعد النشر: نتيجتي القديمة بتنحذف لأن الأسئلة ممكن تكون تغيّرت
  // الصور اللي انشالت من الامتحان بتنحذف من المتصفح
  function updateExam(id, data) {
    const old = myExams.find((exam) => exam.id === id);
    const kept = new Set(examImages(data));
    deleteImages(examImages(old).filter((image) => !kept.has(image)));

    setMyExams((current) => current.map((exam) => (exam.id === id ? { ...exam, ...data, editedAt: Date.now() } : exam)));
    resetResult(id);
  }

  function deleteExam(id) {
    deleteImages(examImages(myExams.find((exam) => exam.id === id)));
    setMyExams((current) => current.filter((exam) => exam.id !== id));
    resetResult(id);
  }

  // تصحيح الامتحان: كل سؤال جوابه صح = علامة
  function submitResult(exam, answers) {
    const score = exam.questions.filter((question, index) => answers[index] === question.answer).length;
    const result = { answers, score, total: exam.questions.length, finishedAt: Date.now() };

    setResults((current) => ({ ...current, [exam.id]: result }));
    return result;
  }

  // إعادة الامتحان من جديد
  function resetResult(id) {
    setResults((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return { exams, results, findExam, addExam, updateExam, deleteExam, submitResult, resetResult };
}