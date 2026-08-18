import api from './api';

const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data.data;
  },

  updateNotificationPreferences: async (data) => {
    const response = await api.patch('/notifications/preferences', data);
    return response.data.data;
  }
};

export default notificationService;
