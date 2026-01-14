import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/auth.service';

/**
 * POST /api/auth/signup
 * Register a new user and auto-login
 */
export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.signUp(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Return tokens in same format as login for auto-login
    sendSuccess(res, {
      user: {
        id: result.user.id,
        email: result.user.email,
      },
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      expiresAt: result.session.expires_at,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Sign in with email/password
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.signIn(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, {
      user: {
        id: result.user.id,
        email: result.user.email,
      },
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      expiresAt: result.session.expires_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Sign out and invalidate session
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.accessToken && req.user) {
      await authService.signOut(req.accessToken, req.user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);

    sendSuccess(res, {
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      expiresAt: result.session.expires_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);

    // Always return success to prevent email enumeration
    sendSuccess(res, {
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.resetPassword(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, { message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string;
    const result = await authService.verifyEmail(token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendSuccess(res, {
      message: 'Email verified successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile with roles and permissions
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }

    const user = await authService.getCurrentUser(req.user.id);

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/check-email
 * Check if email already exists
 */
export const checkEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error('Email is required');
    }

    const exists = await authService.checkEmailExists(email);

    sendSuccess(res, { exists });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register-guest
 * Register a guest user (for booking flow)
 */
export const registerGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('📝 [Register Guest] Request body:', req.body);
    const result = await authService.registerGuest(req.body);

    sendSuccess(res, {
      user: {
        id: result.user_id,
        email: result.email,
        user_type: result.user_type,
      },
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    }, 201);
  } catch (error) {
    console.error('❌ [Register Guest] Error:', error);
    next(error);
  }
};
