// أدوات مشتركة للبث المباشر في التواصل

// رابط غرفة البث
export const livePath = (postId) => `/community/live/${postId}`;

// المدة بصيغة 12:05 أو 1:02:09
export function formatDuration(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

// إيقاف الكاميرا والمايك (يطفي ضوء الكاميرا)
export const stopStream = (stream) => stream?.getTracks().forEach((track) => track.stop());

/*
 * كاميرا ومايك المضيف: من نافذة "ابدأ البث" لغرفة البث (بالذاكرة بس، ما بتنحفظ).
 * المغادرة بتطفيها بعد لحظة (release)، ولو رجعت الغرفة فورًا (StrictMode بيعمل هيك) بتضل شغالة.
 */
const hostStreams = new Map();

export function setHostStream(postId, stream) {
  hostStreams.set(postId, { stream, stopTimer: null });
}

export function getHostStream(postId) {
  const entry = hostStreams.get(postId);
  if (!entry) return null;

  clearTimeout(entry.stopTimer);
  entry.stopTimer = null;
  return entry.stream;
}

export function releaseHostStream(postId) {
  const entry = hostStreams.get(postId);
  if (!entry) return;

  entry.stopTimer = setTimeout(() => {
    stopStream(entry.stream);
    hostStreams.delete(postId);
  }, 0);
}

// إنهاء البث: إطفاء فوري
export function endHostStream(postId) {
  const entry = hostStreams.get(postId);
  if (!entry) return;

  clearTimeout(entry.stopTimer);
  stopStream(entry.stream);
  hostStreams.delete(postId);
}