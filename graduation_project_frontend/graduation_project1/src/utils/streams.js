// حسابات البثوث (لا تُخزَّن، بل تُحسب من الوقت)

/**
 * المؤقت المشترك للبث: الكل يرى نفس المرحلة ونفس الوقت الباقي
 * لأنه يُحسب من وقت بدء البث، وليس عدّادًا عند كل شخص.
 * ترجع { phase: "focus" | "break", secondsLeft, round }
 */
export function getRoomTimer(room, now) {
  const focus = room.timer.focus * 60;
  const cycle = focus + room.timer.break * 60;
  const elapsed = Math.max(0, Math.floor((now - room.startedAt) / 1000));
  const position = elapsed % cycle;

  return {
    phase: position < focus ? "focus" : "break",
    secondsLeft: position < focus ? focus - position : cycle - position,
    round: Math.floor(elapsed / cycle) + 1,
  };
}

// 95 دقيقة ← "1:35:00"، 42 دقيقة ← "42:00"
export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// مفتاح رسالة الخطأ عندما يرفض المتصفح الكاميرا أو المايك
export function deviceErrorKey(error) {
  if (error.name === "NotAllowedError") return "denied";
  if (error.name === "NotFoundError") return "notFound";
  return "other";
}