/**
 * Thin wrapper over the browser Notification API. Deliberately does NOT
 * request permission on load — only when the user actually sets a reminder
 * (see TaskDetailPanel), matching "never ask for a permission before the
 * user needs the feature."
 *
 * Scope, honestly: this fires notifications while the app/tab is open (or
 * briefly backgrounded) in this browser session. It is NOT the same as
 * server-initiated push, which would fire even with the app fully closed —
 * that needs backend infrastructure (VAPID keys + persistent subscription
 * storage + a trigger mechanism) this project doesn't have yet. See
 * docs/PRODUCT_VISION.md.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function showTaskReminder(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  new Notification(title, { body, tag: title, icon: '/icon-192.png' });
}
