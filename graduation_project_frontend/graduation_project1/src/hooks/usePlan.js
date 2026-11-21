import { useEffect, useState } from "react";
import { getTodayIndex } from "../utils/planUtils.js";

// مفتاح حفظ الخطة في المتصفح
const STORAGE_KEY = "areatk-plan";

// قائمة مهام وحدة، وكل مهمة مربوطة بيوم من الأسبوع (task.day: السبت = 0)
// اليومية = مهام اليوم فقط، والأسبوعية = نفس المهام موزعة على الأيام
const EMPTY_PLAN = { mode: "daily", dayStart: "08:00", tasks: [] };

// قراءة الخطة المحفوظة، أو خطة فارغة إذا لم توجد أو كانت تالفة
function loadPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.tasks)) {
      return { ...EMPTY_PLAN, ...saved };
    }

    // الشكل القديم: خطة يومية وخطة أسبوعية منفصلتين ← قائمة وحدة
    // (مهام اليومية القديمة بتنحط على يوم اليوم)
    if (saved && Array.isArray(saved.daily) && Array.isArray(saved.weekly)) {
      const today = getTodayIndex();

      return {
        mode: saved.mode ?? EMPTY_PLAN.mode,
        dayStart: saved.dayStart ?? EMPTY_PLAN.dayStart,
        tasks: [...saved.weekly, ...saved.daily.map((task) => ({ ...task, day: today }))],
      };
    }
  } catch {
    // بيانات تالفة: نبدأ بخطة جديدة
  }

  return EMPTY_PLAN;
}

/**
 * كل بيانات الخطة الدراسية وطرق تعديلها في مكان واحد.
 * أي تغيير يُحفظ تلقائيًا في المتصفح.
 * لاحقًا: نستبدل localStorage بطلبات إلى الباك إند.
 */
export function usePlan() {
  const [plan, setPlan] = useState(loadPlan);
  const today = getTodayIndex();

  // الحفظ بعد كل تغيير
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  function updateTasks(update) {
    setPlan((current) => ({ ...current, tasks: update(current.tasks) }));
  }

  // المهام اللي بتعرضها الواجهة الحالية
  const isDaily = plan.mode === "daily";
  const todayTasks = plan.tasks.filter((task) => task.day === today);
  const tasks = isDaily ? todayTasks : plan.tasks;

  function setMode(mode) {
    setPlan((current) => ({ ...current, mode }));
  }

  function setDayStart(dayStart) {
    setPlan((current) => ({ ...current, dayStart }));
  }

  // مهمة بدون يوم (من الخطة اليومية) بتنحط على يوم اليوم
  function addTask(task) {
    updateTasks((current) => [...current, { ...task, day: task.day ?? getTodayIndex() }]);
  }

  // الضغط على نفس الحالة مرة ثانية يرجع المهمة إلى "لم تُعلَّم"
  function toggleStatus(id, status) {
    updateTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: task.status === status ? "pending" : status } : task
      )
    );
  }

  // تحريك المهمة للأعلى (-1) أو للأسفل (+1) بين مهام نفس اليوم
  function moveTask(id, direction) {
    updateTasks((current) => {
      const index = current.findIndex((task) => task.id === id);
      if (index === -1) return current;

      // أقرب مهمة بنفس اليوم بالاتجاه المطلوب
      let target = index + direction;
      while (target >= 0 && target < current.length && current[target].day !== current[index].day) {
        target += direction;
      }

      if (target < 0 || target >= current.length) return current;

      const nextTasks = [...current];
      [nextTasks[index], nextTasks[target]] = [nextTasks[target], nextTasks[index]];
      return nextTasks;
    });
  }

  function deleteTask(id) {
    updateTasks((current) => current.filter((task) => task.id !== id));
  }

  // اليومية: بتمسح مهام اليوم بس  •  الأسبوعية: بتمسح الأسبوع كله
  function clearTasks() {
    setPlan((current) => ({
      ...current,
      tasks: current.mode === "daily" ? current.tasks.filter((task) => task.day !== getTodayIndex()) : [],
    }));
  }

  return {
    plan,
    tasks,
    todayTasks,
    today,
    setMode,
    setDayStart,
    addTask,
    toggleStatus,
    moveTask,
    deleteTask,
    clearTasks,
  };
}