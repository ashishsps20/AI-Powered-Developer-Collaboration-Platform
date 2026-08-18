import Notification from '../models/Notification.js';
import { notificationPreferenceService } from './notificationPreference.service.js';
import { socketService } from './socket.service.js';

class NotificationService {
  /**
   * Create a notification after checking user preferences.
   * Emits a socket event if successfully created.
   */
  async createNotification(data) {
    const {
      userId,
      actorId,
      organizationId,
      projectId,
      type,
      entityType,
      entityId,
      message,
      metadata = {}
    } = data;

    // Do not notify a user about their own actions
    if (actorId && userId.toString() === actorId.toString()) {
      return null;
    }

    // Check user preferences
    const prefs = await notificationPreferenceService.getPreferences(userId);

    // Map notification types to preference flags
    const typeToPrefMap = {
      TASK_ASSIGNED: 'taskAssignments',
      ISSUE_ASSIGNED: 'issueAssignments',
      MENTION: 'mentions',
      COMMENT_ON_TASK: 'comments',
      COMMENT_ON_ISSUE: 'comments',
      GITHUB_PR_LINKED: 'githubEvents',
      GITHUB_PR_MERGED: 'githubEvents',
      GITHUB_SYNC: 'githubEvents',
      PROJECT_INVITATION: 'projectUpdates',
      PROJECT_MANAGER_CHANGED: 'projectUpdates',
      TASK_STATUS_CHANGED: 'projectUpdates',
      PROJECT_MEMBER_ADDED: 'projectUpdates'
    };

    const prefKey = typeToPrefMap[type];
    if (prefKey && prefs[prefKey] === false) {
      // User opted out of this notification type
      return null;
    }

    // Check for idempotency if an external reference or specific entity exists
    // (A more advanced implementation would use metadata.deliveryId, but we can do a simple recent check)
    if (type.startsWith('GITHUB_') && metadata.deliveryId) {
      const existing = await Notification.findOne({
        user: userId,
        type,
        'metadata.deliveryId': metadata.deliveryId
      });
      if (existing) return existing;
    }

    const notification = await Notification.create({
      user: userId,
      actor: actorId,
      organization: organizationId,
      project: projectId,
      type,
      entityType,
      entityId,
      message,
      metadata
    });

    // Populate actor for the real-time event
    const populated = await notification.populate('actor project', 'name avatar');

    // Emit real-time notification
    socketService.emitToUser(userId.toString(), 'notification:new', populated);

    return populated;
  }

  async getNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const query = { user: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name avatar email')
      .populate('project', 'name');

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false
    });
    return { count };
  }

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).populate('actor', 'name avatar email').populate('project', 'name');

    if (!notification) {
      throw { status: 404, message: 'Notification not found' };
    }

    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { success: true };
  }

  async deleteNotification(userId, notificationId) {
    const result = await Notification.deleteOne({ _id: notificationId, user: userId });
    
    if (result.deletedCount === 0) {
      throw { status: 404, message: 'Notification not found' };
    }
    
    return { success: true };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
