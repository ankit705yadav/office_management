import api from './api';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  status: string;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  status: string;
  data: {
    unreadCount: number;
  };
}

export const notificationService = {
  /**
   * Get user's notifications
   */
  getNotifications: async (
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; pagination: any }> => {
    const response = await api.get<NotificationResponse>('/notifications', {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
