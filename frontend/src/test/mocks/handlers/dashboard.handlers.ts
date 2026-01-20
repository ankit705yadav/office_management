import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const dashboardHandlers = [
  // Get dashboard stats
  http.get(`${API_URL}/dashboard/stats`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        stats: {
          user: {
            leaveBalance: {
              sickLeave: 10,
              casualLeave: 8,
              earnedLeave: 5,
              compOff: 2,
            },
          },
          leaves: {
            pending: 1,
            approved: 2,
          },
          notifications: {
            unread: 3,
          },
          approvals: {
            pending: 5,
          },
          admin: {
            totalEmployees: 50,
          },
        },
      },
    });
  }),

  // Get upcoming birthdays
  http.get(`${API_URL}/dashboard/birthdays`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        birthdays: [
          {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            dateOfBirth: '1990-01-25',
            department: { id: 1, name: 'Engineering' },
          },
        ],
      },
    });
  }),

  // Get work anniversaries
  http.get(`${API_URL}/dashboard/anniversaries`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        anniversaries: [
          {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            dateOfJoining: '2023-01-15',
            yearsOfService: 2,
            department: { id: 1, name: 'Engineering' },
          },
        ],
      },
    });
  }),

  // Get recent activities
  http.get(`${API_URL}/dashboard/activities`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        activities: [
          {
            id: 1,
            type: 'leave',
            title: 'Leave Approved',
            message: 'Your leave has been approved',
            createdAt: '2025-01-21T10:00:00Z',
          },
        ],
      },
    });
  }),

  // Get employees on leave
  http.get(`${API_URL}/dashboard/employees-on-leave`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        employeesOnLeave: [
          {
            id: 1,
            employee: {
              id: 4,
              firstName: 'Bob',
              lastName: 'Smith',
              email: 'bob@test.com',
              department: { id: 1, name: 'Engineering' },
            },
            leaveType: 'casual',
            startDate: '2025-01-20',
            endDate: '2025-01-22',
            daysCount: 3,
            isCurrentlyOnLeave: true,
          },
        ],
      },
    });
  }),

  // Get team calendar
  http.get(`${API_URL}/dashboard/team-calendar`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        leaves: [
          {
            id: 1,
            userId: 4,
            startDate: '2025-01-20',
            endDate: '2025-01-22',
            leaveType: 'casual',
            status: 'approved',
            user: {
              id: 4,
              firstName: 'Bob',
              lastName: 'Smith',
            },
          },
        ],
      },
    });
  }),

  // Mark notification as read
  http.put(`${API_URL}/dashboard/notifications/:id/read`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Notification marked as read',
    });
  }),

  // Mark all notifications as read
  http.put(`${API_URL}/dashboard/notifications/read-all`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  }),
];
