import { createUploadStore, useUploadRequests } from "./useUploadRequests.js";

// ----- خلفياتي: الخلفيات (صورة أو فيديو) اللي رفعها الطالب للمكتبة -----
// بدون حد للحجم. كل خلفية جديدة بتبدأ "قيد المراجعة"، والأدمن بيقبلها أو برفضها من "طلبات الرفع".
// المقبولة بتنضاف لخلفيات جلستي.
export const MY_SCENES_KEY = "areatk-my-scenes";

// الأنواع المسموحة: صورة أو فيديو
export const SCENE_ACCEPT = "image/*,video/*";
export const sceneMediaType = (file) =>
  file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;

const scenesStore = createUploadStore(MY_SCENES_KEY);

// قائمة طلبات الخلفيات بس (لعدّاد "بيستنى قرار" بلوحة الأدمن)
export function useSceneRequests() {
  return scenesStore.useItems();
}

/**
 * خلفياتي: رفع، حذف، وقرار الأدمن.
 * onReviewed(scene): لما يوصل قرار الأدمن (لإرسال إشعار للطالب). بلوحة الأدمن ما بنمرّرها.
 * يرجع:
 * - scenes: كل خلفياتي مع رابطها (url) ونوعها (mediaType: image أو video)
 * - approved: المقبولة بالشكل اللي بيفهمه مشهد الجلسة
 * - upload(file, name)  •  remove(id)  •  reviewScene(id, isApproved, reason)
 */
export function useMyScenes({ onReviewed } = {}) {
  const requests = useUploadRequests(scenesStore, { idPrefix: "s", onReviewed });

  const approved = requests.items
    .filter((scene) => scene.status === "approved" && scene.url)
    .map((scene) => ({ id: scene.id, name: scene.name, src: scene.url, mediaType: scene.mediaType, isMine: true }));

  return {
    scenes: requests.items,
    approved,
    upload: (file, name) => requests.upload(file, { name, mediaType: sceneMediaType(file) }),
    remove: requests.remove,
    reviewScene: requests.review,
  };
}