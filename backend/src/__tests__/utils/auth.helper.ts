import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { UserRole } from '../../types/enums';

interface TokenUser {
  id: number;
  email: string;
  role: UserRole;
}

export const generateTestTokens = (user: TokenUser) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const getAuthHeader = (user: TokenUser): { Authorization: string } => {
  const { accessToken } = generateTestTokens(user);
  return { Authorization: `Bearer ${accessToken}` };
};
