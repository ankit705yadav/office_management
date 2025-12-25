import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { leaveHandlers } from './handlers/leave.handlers';
import { projectHandlers } from './handlers/project.handlers';

export const server = setupServer(
  ...authHandlers,
  ...leaveHandlers,
  ...projectHandlers
);
