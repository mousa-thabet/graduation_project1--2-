// تنسيق الوقت والأرقام حسب لغة الموقع

// "منذ 5 دقائق" أو "5m ago"
export function formatTimeAgo(time, language) {
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto", style: "short" });
  const minutes = Math.round((time - Date.now()) / 60000);

  if (Math.abs(minutes) < 60) return formatter.format(Math.min(minutes, 0), "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");

  return formatter.format(Math.round(hours / 24), "day");
}

// 1250 ← "1.3K" أو "1.3 ألف"
export function formatCount(count, language) {
  return new Intl.NumberFormat(language, { notation: "compact" }).format(count);
}

// 1453 ثانية ← "24:13"
export function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

// تقسيم نص المنشور إلى كلام عادي ووسوم (#كلمة) وإشارات (@حساب)
export function splitPostText(text) {
  return text.split(/(#[\p{L}\p{N}_]+|@[A-Za-z0-9_.]*[A-Za-z0-9_])/u).filter(Boolean);
}