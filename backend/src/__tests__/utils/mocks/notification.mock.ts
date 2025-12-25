export const mockCreateNotification = jest.fn().mockResolvedValue({
  id: 1,
  userId: 1,
  type: 'test',
  title: 'Test Notification',
  message: 'Test message',
  actionUrl: '/test',
  relatedId: null,
  relatedType: null,
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const mockCreateNotificationForUsers = jest.fn().mockResolvedValue([]);
export const mockGetNotifications = jest.fn().mockResolvedValue({
  notifications: [],
  total: 0,
  totalPages: 0,
});
export const mockGetUnreadCount = jest.fn().mockResolvedValue(0);
export const mockMarkAsRead = jest.fn().mockResolvedValue(true);
export const mockMarkAllAsRead = jest.fn().mockResolvedValue(0);
export const mockDeleteNotification = jest.fn().mockResolvedValue(true);
export const mockDeleteOldNotifications = jest.fn().mockResolvedValue(0);

jest.mock('../../../services/notification.service', () => ({
  createNotification: mockCreateNotification,
  createNotificationForUsers: mockCreateNotificationForUsers,
  getNotifications: mockGetNotifications,
  getUnreadCount: mockGetUnreadCount,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  deleteNotification: mockDeleteNotification,
  deleteOldNotifications: mockDeleteOldNotifications,
  default: {
    createNotification: mockCreateNotification,
    createNotificationForUsers: mockCreateNotificationForUsers,
    getNotifications: mockGetNotifications,
    getUnreadCount: mockGetUnreadCount,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    deleteNotification: mockDeleteNotification,
    deleteOldNotifications: mockDeleteOldNotifications,
  },
}));

export const resetNotificationMocks = (): void => {
  mockCreateNotification.mockClear();
  mockCreateNotificationForUsers.mockClear();
  mockGetNotifications.mockClear();
  mockGetUnreadCount.mockClear();
  mockMarkAsRead.mockClear();
  mockMarkAllAsRead.mockClear();
  mockDeleteNotification.mockClear();
  mockDeleteOldNotifications.mockClear();
};
