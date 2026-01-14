import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as dashboardService from '../services/dashboard.service';
import { AppError } from '../utils/errors';
import { hasRole, isSuperAdmin } from '../middleware/rbac.middleware';

/**
 * GET /api/dashboard/property-owner
 * Get Property Owner Dashboard Data
 */
export const getPropertyOwnerDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await dashboardService.getPropertyOwnerDashboard(userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/guest
 * Get Guest Dashboard Data
 */
export const getGuestDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await dashboardService.getGuestDashboard(userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/admin
 * Get Admin Dashboard Data
 */
export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user has admin permissions
    const isAdmin = hasRole(req, 'property_admin') || isSuperAdmin(req);
    if (!isAdmin) {
      throw new AppError('FORBIDDEN', 'Admin access required');
    }

    const data = await dashboardService.getAdminDashboard();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/super-admin
 * Get Super Admin Dashboard Data
 */
export const getSuperAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user has super admin permissions
    if (!isSuperAdmin(req)) {
      throw new AppError('FORBIDDEN', 'Super admin access required');
    }

    const data = await dashboardService.getSuperAdminDashboard();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/dashboard/clear-cache
 * Clear dashboard cache (admin only)
 */
export const clearDashboardCache = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = hasRole(req, 'property_admin') || isSuperAdmin(req);
    if (!isAdmin) {
      throw new AppError('FORBIDDEN', 'Admin access required');
    }

    const { userId } = req.body;
    dashboardService.clearDashboardCache(userId);

    sendSuccess(res, { message: 'Dashboard cache cleared successfully' });
  } catch (error) {
    next(error);
  }
};
