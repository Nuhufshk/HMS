import { findAllNotifications, markAsRead, markAllAsRead } from './notifications.repository';

export async function listNotifications() {
  return findAllNotifications();
}

export async function markNotificationAsRead(id: string) {
  const updated = await markAsRead(id);
  if (!updated) return { error: 'Notification not found' };
  return { notification: updated, error: undefined };
}

export async function markAllNotificationsAsRead() {
  await markAllAsRead();
}
