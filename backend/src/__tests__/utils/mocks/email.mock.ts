export const mockSendEmail = jest.fn().mockResolvedValue(true);
export const mockSendLeaveRequestNotification = jest.fn().mockResolvedValue(true);
export const mockSendLeaveApprovalNotification = jest.fn().mockResolvedValue(true);
export const mockSendLeaveRejectionNotification = jest.fn().mockResolvedValue(true);
export const mockSendWelcomeEmail = jest.fn().mockResolvedValue(true);

jest.mock('../../../services/email.service', () => ({
  sendEmail: mockSendEmail,
  sendLeaveRequestNotification: mockSendLeaveRequestNotification,
  sendLeaveApprovalNotification: mockSendLeaveApprovalNotification,
  sendLeaveRejectionNotification: mockSendLeaveRejectionNotification,
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

export const resetEmailMocks = (): void => {
  mockSendEmail.mockClear();
  mockSendLeaveRequestNotification.mockClear();
  mockSendLeaveApprovalNotification.mockClear();
  mockSendLeaveRejectionNotification.mockClear();
  mockSendWelcomeEmail.mockClear();
};
