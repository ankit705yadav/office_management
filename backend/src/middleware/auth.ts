import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { User } from '../models';
import { UserRole } from '../types/enums';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
        departmentId?: number;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please login again.',
      });
      return;
    }

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User no longer exists.',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(401).json({
        status: 'error',
        message: 'Your account is not active. Please contact administrator.',
      });
      return;
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed.',
    });
  }
};

/**
 * Middleware to authorize requests based on user role
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyAccessToken(token);

      if (decoded) {
        const user = await User.findByPk(decoded.userId);

        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};
