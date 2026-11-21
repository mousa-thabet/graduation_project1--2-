// اسم الصوت: أصوات المنصة مترجمة، وأصوات الطلبة باسمها كما كتبه صاحبها
export function getSoundName(sound, t) {
  return sound.name ?? t(`studyApp.session.sounds.items.${sound.id}`);
}

// مدة ملف صوت بالثواني (نقرأها من المتصفح قبل الرفع)
export function readAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
    };
    // ملف تالف أو صيغة لا يدعمها المتصفح
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}