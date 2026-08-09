import { Notification } from '../models/Notification.js';

export async function createNotification({ userId, type, title, message, data = {} }) {
  return Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
  });
}

export async function listNotifications(userId, { unreadOnly = false } = {}) {
  const filter = { user: userId };
  if (unreadOnly) filter.isRead = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(100);
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) return null;
  notification.isRead = true;
  await notification.save();
  return notification;
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}

export async function countUnreadNotifications(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}
