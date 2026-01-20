import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const mockNotifications = [
  {
    id: 1,
    userId: 3,
    type: 'leave',
    title: 'Leave Approved',
    message: 'Your leave request has been approved',
    isRead: false,
    createdAt: '2025-01-21T10:00:00.000Z',
  },
  {
    id: 2,
    userId: 3,
    type: 'task',
    title: 'Task Assigned',
    message: 'You have been assigned a new task',
    isRead: true,
    createdAt: '2025-01-20T10:00:00.000Z',
  },
];

export const notificationHandlers = [
  // Get notifications
  http.get(`${API_URL}/notifications`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        notifications: mockNotifications,
        pagination: {
          total: mockNotifications.length,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    });
  }),

  // Get unread count
  http.get(`${API_URL}/notifications/unread-count`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        unreadCount: mockNotifications.filter((n) => !n.isRead).length,
      },
    });
  }),

  // Mark as read
  http.put(`${API_URL}/notifications/:id/read`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Notification marked as read',
    });
  }),

  // Mark all as read
  http.put(`${API_URL}/notifications/read-all`, () => {
    return HttpResponse.json({
      status: 'success',
      message: '2 notifications marked as read',
      data: { count: 2 },
    });
  }),

  // Delete notification
  http.delete(`${API_URL}/notifications/:id`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Notification deleted',
    });
  }),
];
