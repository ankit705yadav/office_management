import { http, HttpResponse } from 'msw';
import { mockLeaveBalance, mockLeaveRequests } from '../data/leaves';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const leaveHandlers = [
  // Get leave balance
  http.get(`${API_URL}/leaves/balance`, () => {
    return HttpResponse.json({
      status: 'success',
      data: { leaveBalance: mockLeaveBalance },
    });
  }),

  // Get all leave requests
  http.get(`${API_URL}/leaves`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';

    return HttpResponse.json({
      status: 'success',
      data: {
        leaveRequests: mockLeaveRequests,
        pagination: {
          total: mockLeaveRequests.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 1,
        },
      },
    });
  }),

  // Apply for leave
  http.post(`${API_URL}/leaves`, async ({ request }) => {
    const body = await request.json() as {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
      isHalfDay?: boolean;
      halfDaySession?: string;
    };

    // Validate required fields
    if (!body.leaveType || !body.startDate || !body.endDate || !body.reason) {
      return HttpResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRequest = {
      id: Date.now(),
      userId: 3,
      ...body,
      daysCount: 1,
      status: 'pending',
      currentApprovalLevel: 0,
      totalApprovalLevels: 2,
      createdAt: new Date().toISOString(),
      user: {
        id: 3,
        firstName: 'Employee',
        lastName: 'User',
        email: 'employee@test.com',
      },
    };

    return HttpResponse.json({
      status: 'success',
      message: 'Leave request submitted successfully',
      data: { leaveRequest: newRequest },
    }, { status: 201 });
  }),

  // Approve leave
  http.put(`${API_URL}/leaves/:id/approve`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      status: 'success',
      message: 'Leave request approved',
      data: {
        leaveRequest: {
          ...mockLeaveRequests[0],
          id: Number(id),
          status: 'approved',
        },
      },
    });
  }),

  // Reject leave
  http.put(`${API_URL}/leaves/:id/reject`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      status: 'success',
      message: 'Leave request rejected',
      data: {
        leaveRequest: {
          ...mockLeaveRequests[0],
          id: Number(id),
          status: 'rejected',
        },
      },
    });
  }),

  // Cancel leave
  http.put(`${API_URL}/leaves/:id/cancel`, () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Leave request cancelled successfully',
    });
  }),

  // Get leave history
  http.get(`${API_URL}/leaves/history`, () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        },
      },
    });
  }),
];
