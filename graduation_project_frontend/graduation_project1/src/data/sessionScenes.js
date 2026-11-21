// خلفيات جلستي: مشاهد متحركة بالـ CSS، أو فيديو (src)
// الخلفيات اللي بترفعها الإدارة بتنضاف عليهم (useOfficialLibrary)

export const SESSION_SCENES = [
  { id: "espresso" },
  { id: "aurora" },
  { id: "stars" },
  { id: "rain" },
  { id: "balcony", src: "/videos/study.mp4" },
];

// اسم الخلفية: خلفيات المنصة الأصلية مترجمة، واللي رفعتها الإدارة باسمها (name)
export function getSceneName(scene, t) {
  return scene.name ?? t(`studyApp.session.scenes.items.${scene.id}`);
}