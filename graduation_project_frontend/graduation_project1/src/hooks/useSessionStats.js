import { useEffect, useState } from "react";

const STORAGE_KEY = "areatk-session-stats";

// "2026-11-07" بالتوقيت المحلي
function toDayKey(date) {
  return date.toLocaleDateString("en-CA");
}

// تاريخ قبل عدد من الأيام
function daysAgo(count) {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return date;
}

function loadDays() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

/**
 * إحصائيات الدراسة: دقائق وجولات كل يوم، والأيام المتتالية.
 * days: { "2026-11-07": { minutes, rounds } }
 */
export function useSessionStats() {
  const [days, setDays] = useState(loadDays);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  }, [days]);

  const today = days[toDayKey(new Date())] ?? { minutes: 0, rounds: 0 };

  // آخر 7 أيام (الأقدم أولًا) لرسم الأعمدة
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgo(6 - index);
    return { date, minutes: days[toDayKey(date)]?.minutes ?? 0 };
  });

  // الأيام المتتالية: نعدّ للخلف من اليوم (أو من أمس إن لم ندرس اليوم بعد)
  let streak = 0;
  for (let offset = today.minutes > 0 ? 0 : 1; days[toDayKey(daysAgo(offset))]?.minutes > 0; offset++) {
    streak++;
  }

  // مجموع دقائق الدراسة من أول يوم (لصفحة الحساب)
  const totalMinutes = Object.values(days).reduce((sum, day) => sum + day.minutes, 0);

  // جولة دراسة انتهت
  function addRound(minutes) {
    const key = toDayKey(new Date());

    setDays((current) => {
      const day = current[key] ?? { minutes: 0, rounds: 0 };
      return { ...current, [key]: { minutes: day.minutes + minutes, rounds: day.rounds + 1 } };
    });
  }

  return { today, week, streak, totalMinutes, addRound };
}