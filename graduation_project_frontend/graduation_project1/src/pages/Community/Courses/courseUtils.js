// أدوات مشتركة بين صفحات الدورات

// رابط دورة (ومعه درس معيّن اختياريًا)
export const coursePath = (id, lessonId) =>
  lessonId ? `/community/courses/${id}?lesson=${lessonId}` : `/community/courses/${id}`;

// مجموع مدة الدروس بالدقائق
export const totalMinutes = (course) => course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

// مسودة: بس صاحبها بيشوفها (بصفحة "دوراتي")، وما بتظهر بقائمة الدورات ولا بالحساب
export const isDraft = (course) => course.status === "draft";

// جاهزة للنشر: عنوان، ودرس واحد على الأقل، وكل درس إله عنوان وفيديو أو شرح
export const isCourseReady = (course) =>
  course.title.trim() !== "" &&
  course.lessons.length > 0 &&
  course.lessons.every((lesson) => lesson.title.trim() && (lesson.video || lesson.notes.trim()));

// تبويبات صفحة الدورات: كل الدورات، اللي سجّلت فيها (بتعلّمها)، ودوراتي (اللي بعملها وبنشرها)
export const COURSE_TABS = ["all", "enrolled", "mine"];
export const coursesTabPath = (tab) => (tab === "all" ? "/community/courses" : `/community/courses?tab=${tab}`);

// "دوراتي" (استوديو الدورات): تبويب بصفحة الدورات، ومحرّر الدورة
export const STUDIO_PATH = coursesTabPath("mine");
export const newCoursePath = () => "/community/courses/new";
export const editCoursePath = (id) => `/community/courses/${id}/edit`;