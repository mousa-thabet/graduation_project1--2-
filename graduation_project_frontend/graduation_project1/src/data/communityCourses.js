// دورات تجريبية لقسم التواصل (ينشرها أصحاب شارة القيمة العلمية فقط)
// المحتوى يكتبه المستخدمون، لذلك لا يُترجم
// level: beginner | intermediate | advanced
// lessons: [{ id, title, duration (دقائق), notes (شرح الدرس), video: { mediaId } اختياري }]
// دورات المستخدم فيديوهاتها تُحفظ في IndexedDB، والدورة التجريبية الأولى فيديوهاتها ملفات ثابتة من public/videos
// (mediaId اللي بيبلّش بـ "/" هو رابط الملف نفسه)

import { withBadges } from "./badges.js";

const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

const LEEN = withBadges({ id: "p1", name: "لين", handle: "leen.focus" });

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"];

export const COMMUNITY_COURSES = [
  // دورة كاملة لـ "لين" بالمجتمع العام: بتظهر للكل، فيها فيديوهات حقيقية ودروس مكتوبة
  {
    id: "course-start",
    author: LEEN,
    communityId: "general",
    branchId: null,
    level: "beginner",
    title: "ابدأ صح: كيف تدرس بذكاء وتستفيد من AreaTk",
    description:
      "دورة قصيرة بتعرّفك على أقسام المنصة، وبتعلّمك تقنيات دراسة مجرّبة: بومودورو، الاسترجاع النشط، والتكرار المتباعد.",
    students: 1240,
    createdAt: daysAgo(1),
    lessons: [
      {
        id: "l1",
        title: "جولة بالمنصة: ادرس معي",
        duration: 1,
        notes:
          "بقسم ادرس معي بتلاقي جلسات دراسة بمؤقّت، أصوات وخلفيات بتساعدك تركّز، وبثوث مباشرة تدرس فيها مع غيرك. ابدأ كل يوم بجلسة وحدة على الأقل.",
        video: { mediaId: "/videos/study.mp4", name: "study.mp4" },
      },
      {
        id: "l2",
        title: "تقنية بومودورو",
        duration: 6,
        notes:
          "اشتغل 25 دقيقة بتركيز كامل، وبعدين استراحة 5 دقائق. بعد 4 جولات خذ استراحة أطول (15 لـ 30 دقيقة). المهم بالجولة: ولا إشعار، ولا تليفون، ومهمة وحدة بس.",
      },
      {
        id: "l3",
        title: "مجتمع التواصل: اسأل وشارك",
        duration: 1,
        notes:
          "انضم لمجتمعات تخصصك، اسأل لما تعلق، وجاوب غيرك لما تعرف. الشرح لغيرك من أقوى طرق التعلّم، وأصحاب الشارات بيساعدوك بإجابات موثوقة.",
        video: { mediaId: "/videos/social.mp4", name: "social.mp4" },
      },
      {
        id: "l4",
        title: "الاسترجاع النشط والتكرار المتباعد",
        duration: 8,
        notes:
          "بدل ما تعيد قراءة الملخص، سكّر الدفتر وحاول تتذكر لحالك (الاسترجاع النشط). وراجع نفس المعلومة على فترات بتكبر: بعد يوم، 3 أيام، أسبوع، وبعدين شهر (التكرار المتباعد).",
      },
      {
        id: "l5",
        title: "خطتي: رتّب أسبوعك الدراسي",
        duration: 1,
        notes:
          "حط موادك ومواعيد امتحاناتك بقسم خطتي، ووزّع الدراسة على أيام الأسبوع. الخطة الواقعية أحسن من الخطة المثالية: ابدأ بساعتين يوميًا وزيد تدريجيًا.",
        video: { mediaId: "/videos/plan.mp4", name: "plan.mp4" },
      },
    ],
  },
  {
    id: "course-1",
    author: LEEN,
    communityId: "ai",
    branchId: "ml",
    level: "beginner",
    title: "مدخل لتعلّم الآلة بالبايثون",
    description: "من أول فكرة لحد ما تدرّب أول نموذج بنفسك باستخدام scikit-learn.",
    students: 312,
    createdAt: daysAgo(4),
    lessons: [
      {
        id: "l1",
        title: "شو يعني تعلّم الآلة؟",
        duration: 8,
        notes:
          "تعلّم الآلة يعني إن البرنامج يتعلّم القواعد من البيانات بدل ما نكتبها بإيدنا. في 3 أنواع رئيسية: التعلّم الموجَّه (عنا أجوبة صحيحة)، غير الموجَّه (بندوّر على أنماط)، والمعزَّز (التعلّم بالمكافأة).",
      },
      {
        id: "l2",
        title: "تجهيز البيانات بـ Pandas",
        duration: 14,
        notes:
          "قبل أي نموذج لازم ننظّف البيانات: نحذف الصفوف الناقصة أو نعبّيها، نحوّل النصوص لأرقام، ونقسم البيانات لتدريب واختبار (مثلًا 80% و 20%).",
      },
      {
        id: "l3",
        title: "أول نموذج: Linear Regression",
        duration: 12,
        notes:
          "بنستخدم LinearRegression من scikit-learn: نعمل fit على بيانات التدريب، وبعدين predict على بيانات الاختبار، وبنقيس الخطأ بـ mean_squared_error.",
      },
      {
        id: "l4",
        title: "تقييم النموذج وتجنّب الـ Overfitting",
        duration: 10,
        notes:
          "إذا النموذج ممتاز على التدريب وضعيف على الاختبار يبقى حفظ البيانات بدل ما يتعلّم. الحل: بيانات أكثر، نموذج أبسط، أو Regularization و Cross-validation.",
      },
    ],
  },
  {
    id: "course-2",
    author: LEEN,
    communityId: "databases",
    branchId: "design",
    level: "intermediate",
    title: "تصميم قواعد البيانات من الصفر",
    description: "ER Diagram و Normalization وتحويل التصميم لجداول حقيقية.",
    students: 187,
    createdAt: daysAgo(10),
    lessons: [
      {
        id: "l1",
        title: "الكيانات والعلاقات (ER)",
        duration: 11,
        notes:
          "الكيان (Entity) هو الشي اللي بدنا نخزن عنه معلومات مثل الطالب والمادة. العلاقة بتربطهم: واحد لواحد، واحد لكثير، أو كثير لكثير.",
      },
      {
        id: "l2",
        title: "Normalization: 1NF و 2NF و 3NF",
        duration: 16,
        notes:
          "الهدف نقلل التكرار: 1NF كل خلية فيها قيمة وحدة، 2NF كل عمود يعتمد على المفتاح كامل، 3NF ما في عمود يعتمد على عمود غير المفتاح.",
      },
      {
        id: "l3",
        title: "من التصميم للجداول",
        duration: 9,
        notes:
          "كل كيان بيصير جدول، وعلاقة واحد لكثير بتصير Foreign Key بجدول الكثير، وعلاقة كثير لكثير بتحتاج جدول وسيط.",
      },
    ],
  },
  {
    id: "course-3",
    author: LEEN,
    communityId: "frontend",
    branchId: "frameworks",
    level: "beginner",
    title: "React من الصفر",
    description: "المكوّنات والـ props والـ state، وبناء أول صفحة تفاعلية.",
    students: 540,
    createdAt: daysAgo(15),
    lessons: [
      {
        id: "l1",
        title: "المكوّنات و JSX",
        duration: 10,
        notes: "المكوّن دالة بترجع JSX. بنقسم الصفحة لقطع صغيرة قابلة لإعادة الاستخدام، وكل مكوّن اسمه بيبلش بحرف كبير.",
      },
      {
        id: "l2",
        title: "Props: تمرير البيانات",
        duration: 9,
        notes: "الـ props هي المدخلات اللي بيستقبلها المكوّن من أبوه، وما بنعدّلها جوا المكوّن (للقراءة بس).",
      },
      {
        id: "l3",
        title: "State و useState",
        duration: 13,
        notes: "الـ state بيانات بتتغير مع الوقت. لما نغيّرها بـ setState، React بيعيد رسم المكوّن بالقيمة الجديدة.",
      },
      {
        id: "l4",
        title: "الأحداث والقوائم",
        duration: 11,
        notes: "بنربط الأحداث مثل onClick بدوال، وبنعرض القوائم بـ map مع key فريد لكل عنصر.",
      },
    ],
  },
];