// إشعارات تجريبية إلى أن يجهز الباك إند
// section: القسم الذي جاء منه الإشعار (study / plan / social)
// read: الإشعار مقروء من قبل  •  roomId: البث المباشر الذي يفتحه إشعار "live"

const minutesAgo = (minutes) => Date.now() - minutes * 60 * 1000;

const RAHAF = { id: "p3", name: "رهف", handle: "rahaf.db" };
const OMAR = { id: "p2", name: "Omar", handle: "omar_codes" };

export const DEMO_NOTIFICATIONS = [
  { id: "n1", type: "follow", section: "study", actor: RAHAF, createdAt: minutesAgo(10) },
  {
    id: "n2",
    type: "live",
    section: "study",
    actor: OMAR,
    title: "React hooks — silent study",
    roomId: "room-2",
    createdAt: minutesAgo(15),
  },
  {
    id: "n4",
    type: "plan",
    section: "plan",
    task: "مراجعة قواعد البيانات",
    createdAt: minutesAgo(120),
    read: true,
  },
  { id: "n5", type: "follow", section: "study", actor: OMAR, createdAt: minutesAgo(1440), read: true },
];