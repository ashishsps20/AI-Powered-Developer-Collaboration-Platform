import { notificationService } from '../services/notification.service.js';
import { notificationPreferenceService } from '../services/notificationPreference.service.js';

class NotificationController {
  // Inbox

  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 20, unreadOnly } = req.query;
      const isUnreadOnly = unreadOnly === 'true';
      
      const data = await notificationService.getNotifications(
        req.user.id,
        parseInt(page),
        parseInt(limit),
        isUnreadOnly
      );
      
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const data = await notificationService.getUnreadCount(req.user.id);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(req.user.id, notificationId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(req.user.id, notificationId);
      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Preferences

  async getPreferences(req, res, next) {
    try {
      const prefs = await notificationPreferenceService.getPreferences(req.user.id);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const prefs = await notificationPreferenceService.updatePreferences(req.user.id, req.body);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
