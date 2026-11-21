// أدوات الخطة الدراسية: الوقت والإحصائيات

export const MIN_TASK_MINUTES = 5;
export const MAX_TASK_MINUTES = 480;

// أيام الأسبوع تبدأ من السبت (0) إلى الجمعة (6)
export const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6];

const MINUTES_IN_DAY = 24 * 60;

// "08:30" ← 510 دقيقة
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// 510 دقيقة ← "08:30" (بعد منتصف الليل يرجع من الصفر)
export function minutesToTime(total) {
  const minutes = ((total % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(minutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// الدقيقة الحالية من اليوم
export function getCurrentMinute() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// رقم اليوم الحالي (السبت = 0)
export function getTodayIndex() {
  return (new Date().getDay() + 1) % 7;
}

// معرّف فريد لكل مهمة
export function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getTotalMinutes(tasks) {
  return tasks.reduce((sum, task) => sum + task.minutes, 0);
}

export function getTasksOfDay(tasks, day) {
  return tasks.filter((task) => task.day === day);
}

// الإحصائيات تُحسب من مهام الدراسة فقط (الاستراحة ليست إنجازًا)
export function getStats(tasks) {
  const studyTasks = tasks.filter((task) => task.kind === "study");
  const doneTasks = studyTasks.filter((task) => task.status === "done");

  const total = studyTasks.length;
  const done = doneTasks.length;
  const missed = studyTasks.filter((task) => task.status === "missed").length;

  return {
    total,
    done,
    missed,
    pending: total - done - missed,
    planned: getTotalMinutes(studyTasks),
    studied: getTotalMinutes(doneTasks),
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

// أفضل يوم بالأسبوع = أعلى نسبة التزام (null إذا لم تُنجز أي مهمة)
export function getBestDay(tasks) {
  let best = null;

  WEEK_DAYS.forEach((day) => {
    const stats = getStats(getTasksOfDay(tasks, day));

    if (stats.done > 0 && (!best || stats.percent > best.percent)) {
      best = { day, percent: stats.percent };
    }
  });

  return best;
}

// رسالة النتيجة حسب نسبة الالتزام
export function getResultKey(percent) {
  if (percent >= 80) return "plan.resultGreat";
  if (percent >= 50) return "plan.resultGood";
  return "plan.resultLow";
}