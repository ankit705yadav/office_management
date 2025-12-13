import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticate middleware
 */
export const requireRole = (allowedRoles: UserRole[]) => {
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
        message: 'You do not have permission to access this resource.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to check if user is manager or admin
 */
export const requireManagerOrAdmin = requireRole([UserRole.MANAGER, UserRole.ADMIN]);

/**
 * Middleware to check if user can manage a specific user
 * (either their manager or admin)
 */
export const canManageUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const targetUserId = parseInt(req.params.id || req.params.userId);

  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required.',
    });
    return;
  }

  // Admin can manage anyone
  if (req.user.role === UserRole.ADMIN) {
    next();
    return;
  }

  // User can manage themselves
  if (req.user.id === targetUserId) {
    next();
    return;
  }

  // Manager can manage their subordinates (would need to check in DB)
  // For now, we'll just deny access
  res.status(403).json({
    status: 'error',
    message: 'You can only manage your own profile.',
  });
};
