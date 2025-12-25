export const mockInitializeSocket = jest.fn().mockReturnValue({
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  use: jest.fn(),
});

export const mockGetIO = jest.fn().mockReturnValue({
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
});

export const mockEmitToUser = jest.fn();
export const mockEmitToUsers = jest.fn();
export const mockBroadcast = jest.fn();

jest.mock('../../../services/socket.service', () => ({
  initializeSocket: mockInitializeSocket,
  getIO: mockGetIO,
  emitToUser: mockEmitToUser,
  emitToUsers: mockEmitToUsers,
  broadcast: mockBroadcast,
  default: {
    initializeSocket: mockInitializeSocket,
    getIO: mockGetIO,
    emitToUser: mockEmitToUser,
    emitToUsers: mockEmitToUsers,
    broadcast: mockBroadcast,
  },
}));

export const resetSocketMocks = (): void => {
  mockInitializeSocket.mockClear();
  mockGetIO.mockClear();
  mockEmitToUser.mockClear();
  mockEmitToUsers.mockClear();
  mockBroadcast.mockClear();
};
