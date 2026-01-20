import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { leaveHandlers } from './handlers/leave.handlers';
import { projectHandlers } from './handlers/project.handlers';
import { attendanceHandlers } from './handlers/attendance.handlers';
import { notificationHandlers } from './handlers/notification.handlers';
import { dashboardHandlers } from './handlers/dashboard.handlers';

export const server = setupServer(
  ...authHandlers,
  ...leaveHandlers,
  ...projectHandlers,
  ...attendanceHandlers,
  ...notificationHandlers,
  ...dashboardHandlers
);
