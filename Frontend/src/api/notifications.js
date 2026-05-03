/**
 * notifications.js — Notification API client.
 *
 * Thin wrapper around the /notifications/ REST endpoints used by
 * NotificationDropdown and NotificationTest.
 */
import api from './axios';

const notificationsAPI = {
  /** GET /notifications/ — fetch all notifications for the current user. */
  getAll: () => api.get('/notifications/'),

  /** GET /notifications/unread_count/ — return the count of unread notifications. */
  getUnreadCount: () => api.get('/notifications/unread_count/'),

  /** POST /notifications/:id/mark_read/ — mark a single notification as read. */
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),

  /** POST /notifications/mark_all_read/ — mark every notification as read. */
  markAllRead: () => api.post('/notifications/mark_all_read/'),

  /** DELETE /notifications/clear_all/ — permanently delete all notifications. */
  clearAll: () => api.delete('/notifications/clear_all/'),
};

export default notificationsAPI;
