import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const mockAttendance = {
  id: 1,
  userId: 3,
  date: new Date().toISOString().split('T')[0],
  checkInTime: '2025-01-21T09:00:00.000Z',
  checkOutTime: null,
  status: 'present',
  workHours: 0,
  isLate: false,
  isEarlyDeparture: false,
  checkInLocation: 'Office',
};

const mockRegularization = {
  id: 1,
  userId: 3,
  date: '2025-01-20',
  requestedCheckIn: '2025-01-20T09:00:00.000Z',
  requestedCheckOut: '2025-01-20T18:00:00.000Z',
  reason: 'Forgot to check in',
  status: 'pending',
};

export const attendanceHandlers = [
  // Check-in
  http.post(`${API_URL}/attendance/check-in`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Checked in successfully',
      data: { attendance: mockAttendance },
    });
  }),

  // Check-out
  http.post(`${API_URL}/attendance/check-out`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Checked out successfully. Total work hours: 9',
      data: {
        attendance: {
          ...mockAttendance,
          checkOutTime: '2025-01-21T18:00:00.000Z',
          workHours: 9,
        },
      },
    });
  }),

  // Get today's attendance
  http.get(`${API_URL}/attendance/today`, () => {
    return HttpResponse.json({
      status: 'success',
      data: { attendance: mockAttendance },
    });
  }),

  // Get my attendance
  http.get(`${API_URL}/attendance/my`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';

    return HttpResponse.json({
      status: 'success',
      data: {
        attendance: [mockAttendance],
        pagination: {
          total: 1,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 1,
        },
      },
    });
  }),

  // Get team attendance
  http.get(`${API_URL}/attendance/team`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        attendance: [mockAttendance],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });
  }),

  // Get monthly attendance
  http.get(`${API_URL}/attendance/monthly`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        presentDays: 20,
        absentDays: 2,
        lateDays: 1,
        halfDays: 0,
        totalWorkHours: 180,
        attendanceRecords: [mockAttendance],
      },
    });
  }),

  // Request regularization
  http.post(`${API_URL}/attendance/regularize`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Regularization request submitted successfully',
      data: { regularization: mockRegularization },
    });
  }),

  // Get regularizations
  http.get(`${API_URL}/attendance/regularizations`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        regularizations: [mockRegularization],
        pagination: {
          total: 1,
          page: 1,
          limit: 50,
          pages: 1,
        },
      },
    });
  }),

  // Approve regularization
  http.put(`${API_URL}/attendance/regularizations/:id/approve`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Regularization request approved successfully',
      data: {
        regularization: { ...mockRegularization, status: 'approved' },
      },
    });
  }),

  // Reject regularization
  http.put(`${API_URL}/attendance/regularizations/:id/reject`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Regularization request rejected',
      data: {
        regularization: { ...mockRegularization, status: 'rejected' },
      },
    });
  }),

  // Get attendance settings
  http.get(`${API_URL}/attendance/settings`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        settings: {
          workStartTime: '09:00',
          workEndTime: '18:00',
          lateGracePeriodMinutes: 15,
          earlyDepartureGracePeriodMinutes: 15,
          halfDayHours: 4,
          fullDayHours: 8,
        },
      },
    });
  }),

  // Export attendance
  http.get(`${API_URL}/attendance/export`, () => {
    return new HttpResponse(
      'Date,Employee Name,Email,Check In,Check Out,Work Hours,Status\n2025-01-21,Employee User,employee@test.com,09:00,18:00,9,present',
      {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=attendance-report.csv',
        },
      }
    );
  }),
];
