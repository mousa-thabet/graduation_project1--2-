import { useEffect, useState } from "react";
import { DEMO_NOTIFICATIONS } from "../data/notifications.js";
import { CURRENT_USER } from "../data/currentUser.js";

// كل حساب إله إشعاراته (بالـ handle)، حتى ما يشوف حساب جديد إشعارات حساب ثاني
const storageKey = (handle) => `areatk-notifications:${handle}`;

// received: إشعارات وصلت أثناء الاستخدام، read: أرقام الإشعارات المقروءة
const EMPTY_STATE = { received: [], read: [] };

function loadState(handle) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(handle)));
    if (saved) return { ...EMPTY_STATE, ...saved };
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return EMPTY_STATE;
}

/**
 * الإشعارات المشتركة بين الأقسام: قائمة الإشعارات، عدد غير المقروءة، والتحديد كمقروء.
 * لاحقًا: تصل الإشعارات من السيرفر بدل البيانات التجريبية.
 */
export function useNotifications() {
  // الحساب اللي فتح الصفحة (القسم بيتركّب من جديد بعد كل تسجيل دخول)
  const [handle] = useState(() => CURRENT_USER.handle);
  const [state, setState] = useState(() => loadState(handle));

  useEffect(() => {
    localStorage.setItem(storageKey(handle), JSON.stringify(state));
  }, [handle, state]);

  const notifications = [...state.received, ...DEMO_NOTIFICATIONS]
    .map((notification) => ({
      ...notification,
      isRead: Boolean(notification.read) || state.read.includes(notification.id),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  // إشعار جديد وصل (من السيرفر لاحقًا)
  function receive(notification) {
    const newNotification = { ...notification, id: crypto.randomUUID(), createdAt: Date.now() };
    setState((current) => ({ ...current, received: [newNotification, ...current.received] }));
  }

  function markRead(id) {
    setState((current) => (current.read.includes(id) ? current : { ...current, read: [...current.read, id] }));
  }

  function markAllRead() {
    setState((current) => ({ ...current, read: notifications.map((notification) => notification.id) }));
  }

  return { notifications, unreadCount, receive, markRead, markAllRead };
}