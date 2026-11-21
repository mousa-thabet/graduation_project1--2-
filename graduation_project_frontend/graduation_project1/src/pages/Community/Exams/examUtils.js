// أدوات مشتركة بين صفحات الامتحانات

// رابط امتحان
export const examPath = (id) => `/community/exams/${id}`;

// قسم إنشاء امتحان (لأصحاب شارة القيمة العلمية)، والتعديل بنفس الصفحة
export const CREATE_EXAM_PATH = "/community/create-exam";
export const editExamPath = (id) => `${CREATE_EXAM_PATH}/${id}`;

// حروف الخيارات: أ ب ج د هـ (أو A B C D E بالإنجليزي)
const LETTERS = {
  ar: ["أ", "ب", "ج", "د", "هـ"],
  en: ["A", "B", "C", "D", "E"],
};

export function optionLetter(index, language) {
  return (LETTERS[language] ?? LETTERS.ar)[index] ?? String(index + 1);
}

// نسبة العلامة المئوية
export const percentOf = ({ score, total }) => (total > 0 ? Math.round((score / total) * 100) : 0);