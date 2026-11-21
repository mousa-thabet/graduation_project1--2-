import { createUploadStore, useUploadRequests } from "./useUploadRequests.js";

// ----- أصواتي: الأصوات اللي رفعها الطالب للمكتبة -----
// كل صوت جديد بيبدأ "قيد المراجعة"، والأدمن بيقبله أو برفضه من قسم "طلبات الرفع" باللوحة.
export const MY_SOUNDS_KEY = "areatk-my-sounds";

const soundsStore = createUploadStore(MY_SOUNDS_KEY);

// قائمة طلبات الأصوات بس (لعدّاد "بيستنى قرار" بلوحة الأدمن)
export function useSoundRequests() {
  return soundsStore.useItems();
}

/**
 * أصواتي: رفع، حذف، وقرار الأدمن.
 * onReviewed(sound): لما يوصل قرار الأدمن (لإرسال إشعار للطالب). بلوحة الأدمن ما بنمرّرها.
 * يرجع:
 * - sounds: كل أصواتي مع رابط تشغيلها (url)
 * - approved: المقبولة بالشكل اللي بيفهمه خلاط الجلسة
 * - upload(file, name, duration)  •  remove(id)  •  reviewSound(id, isApproved, reason)
 */
export function useMySounds({ onReviewed } = {}) {
  const requests = useUploadRequests(soundsStore, { idPrefix: "u", onReviewed });

  const approved = requests.items
    .filter((sound) => sound.status === "approved" && sound.url)
    .map((sound) => ({ id: sound.id, name: sound.name, icon: "music", src: sound.url, isMine: true }));

  return {
    sounds: requests.items,
    approved,
    upload: (file, name, duration) => requests.upload(file, { name, duration }),
    remove: requests.remove,
    reviewSound: requests.review,
  };
}