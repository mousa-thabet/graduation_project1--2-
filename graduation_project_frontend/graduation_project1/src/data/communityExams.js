// امتحانات تجريبية لقسم التواصل (ينشرها أصحاب شارة القيمة العلمية فقط)
// الأسئلة محتوى يكتبه المستخدمون، لذلك لا تُترجم
// questions: [{ id, text, options: [نص الخيار...], answer: رقم الخيار الصحيح }]
// duration: مدة الامتحان بالدقائق  •  communityId / branchId: مكانه

import { withBadges } from "./badges.js";

const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

const LEEN = withBadges({ id: "p1", name: "لين", handle: "leen.focus" });

export const COMMUNITY_EXAMS = [
  {
    id: "exam-1",
    author: LEEN,
    communityId: "ai",
    branchId: "ml",
    title: "أساسيات تعلّم الآلة",
    description: "5 أسئلة سريعة تراجع فيها المفاهيم الأساسية قبل امتحان المادة.",
    duration: 5,
    createdAt: daysAgo(1),
    questions: [
      {
        id: "q1",
        text: "شو نوع التعلّم اللي بيكون فيه لكل مثال جواب صحيح (label)؟",
        options: ["تعلّم موجَّه (Supervised)", "تعلّم غير موجَّه (Unsupervised)", "تعلّم معزَّز (Reinforcement)"],
        answer: 0,
      },
      {
        id: "q2",
        text: "لما يكون أداء النموذج ممتاز على بيانات التدريب وضعيف على بيانات الاختبار، هاد اسمه:",
        options: ["Underfitting", "Overfitting", "Normalization", "Regularization"],
        answer: 1,
      },
      {
        id: "q3",
        text: "أي خوارزمية من هدول بتستخدم للتجميع (Clustering)؟",
        options: ["Linear Regression", "K-Means", "Logistic Regression", "Naive Bayes"],
        answer: 1,
      },
      {
        id: "q4",
        text: "ليش بنقسم البيانات لتدريب واختبار؟",
        options: [
          "حتى يصير التدريب أسرع",
          "حتى نقيس أداء النموذج على بيانات ما شافها قبل",
          "حتى نقلل حجم الملفات",
        ],
        answer: 1,
      },
      {
        id: "q5",
        text: "أي مكتبة بايثون مشهورة لتعلّم الآلة الكلاسيكي؟",
        options: ["React", "scikit-learn", "Express", "Laravel"],
        answer: 1,
      },
    ],
  },
  {
    id: "exam-2",
    author: LEEN,
    communityId: "databases",
    branchId: "sql",
    title: "SQL للمبتدئين",
    description: "أوامر SQL الأساسية: SELECT و WHERE و JOIN.",
    duration: 4,
    createdAt: daysAgo(3),
    questions: [
      {
        id: "q1",
        text: "أي أمر بيرجع البيانات من جدول؟",
        options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
        answer: 1,
      },
      {
        id: "q2",
        text: "شو بيعمل WHERE؟",
        options: ["بيرتب النتائج", "بيفلتر الصفوف حسب شرط", "بيجمع جدولين"],
        answer: 1,
      },
      {
        id: "q3",
        text: "INNER JOIN بيرجع:",
        options: [
          "كل صفوف الجدول الأول",
          "الصفوف المتطابقة بالجدولين بس",
          "كل صفوف الجدولين حتى لو ما تطابقت",
        ],
        answer: 1,
      },
      {
        id: "q4",
        text: "المفتاح الأساسي (Primary Key) لازم يكون:",
        options: ["مكرر وممكن يكون فاضي", "فريد وما بيكون فاضي", "نص دائمًا"],
        answer: 1,
      },
    ],
  },
  {
    id: "exam-3",
    author: LEEN,
    communityId: "frontend",
    branchId: "frameworks",
    title: "React Hooks",
    description: "مراجعة useState و useEffect وقواعد الـ Hooks.",
    duration: 4,
    createdAt: daysAgo(6),
    questions: [
      {
        id: "q1",
        text: "أي Hook بنستخدمه لحفظ قيمة بتتغير وبتعيد رسم المكوّن؟",
        options: ["useRef", "useState", "useMemo"],
        answer: 1,
      },
      {
        id: "q2",
        text: "useEffect بمصفوفة اعتماديات فاضية [] بيشتغل:",
        options: ["مع كل رسم", "مرة وحدة بعد أول رسم", "ما بيشتغل أبدًا"],
        answer: 1,
      },
      {
        id: "q3",
        text: "وين مسموح نستدعي الـ Hooks؟",
        options: ["جوا if و loops", "بأعلى المكوّن أو بـ Hook ثاني", "بأي دالة عادية"],
        answer: 1,
      },
    ],
  },
  {
    id: "exam-4",
    author: LEEN,
    communityId: "algorithms",
    branchId: "complexity",
    title: "تحليل التعقيد Big-O",
    description: "قدّر سرعة الخوارزميات الشائعة.",
    duration: 3,
    createdAt: daysAgo(9),
    questions: [
      {
        id: "q1",
        text: "البحث الثنائي (Binary Search) تعقيده:",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        answer: 1,
      },
      {
        id: "q2",
        text: "حلقتين متداخلتين على نفس المصفوفة تعقيدهم غالبًا:",
        options: ["O(n)", "O(n log n)", "O(n²)"],
        answer: 2,
      },
      {
        id: "q3",
        text: "الوصول لعنصر بمصفوفة عن طريق رقمه (index):",
        options: ["O(1)", "O(n)", "O(log n)"],
        answer: 0,
      },
    ],
  },
];