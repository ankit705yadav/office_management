import { Request, Response } from 'express';
import { User } from '../models';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import logger from '../utils/logger';

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(401).json({
        status: 'error',
        message: 'Your account is not active. Please contact administrator.',
      });
      return;
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          departmentId: user.departmentId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);

    if (!user || user.status !== 'active') {
      res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
      });
      return;
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while refreshing token',
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by deleting the tokens. However, you could maintain a blacklist of tokens
    // or invalidate refresh tokens in the database here.

    logger.info(`User logged out: ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout',
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user profile',
    });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Validate current password
    const isPasswordValid = await user.validatePassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password',
    });
  }
};
