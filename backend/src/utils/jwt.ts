import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/environment';
import { UserRole } from '../types/enums';

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as any);
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
