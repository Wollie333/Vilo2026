import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as usersService from '../services/users.service';
import { getAuditLogs } from '../services/audit.service';

/**
 * POST /api/users
 * Create a new user (admin function)
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.createUser(req.body, req.user!.id);
    sendSuccess(res, { user, message: 'User created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * List users with pagination and filters
 */
export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await usersService.listUsers(req.query as any);

    sendSuccess(res, result, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get single user by ID
 */
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.getUser(req.params.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Update user profile
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.updateUser(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Soft delete user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await usersService.deleteUser(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/approve
 * Approve pending user
 */
export const approveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.approveUser(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { user, message: 'User approved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/roles
 * Assign roles to user
 */
export const assignRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.assignRoles(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { user, message: 'Roles assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/permissions
 * Assign permission overrides to user
 */
export const assignPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.assignPermissions(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { user, message: 'Permissions assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/properties
 * Assign properties to user
 */
export const assignProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.assignProperties(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { user, message: 'Properties assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/suspend
 * Suspend user
 */
export const suspendUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.suspendUser(req.params.id, req.user!.id);
    sendSuccess(res, { user, message: 'User suspended successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/reactivate
 * Reactivate suspended user
 */
export const reactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.reactivateUser(req.params.id, req.user!.id);
    sendSuccess(res, { user, message: 'User reactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/avatar
 * Upload user avatar
 */
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const avatarUrl = await usersService.uploadAvatar(
      req.params.id,
      req.file,
      req.user!.id
    );
    sendSuccess(res, { avatarUrl, message: 'Avatar uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id/activity
 * Get user activity history from audit logs
 */
export const getUserActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getAuditLogs({
      entityId: id,
      page,
      limit,
    });

    sendSuccess(res, result, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
