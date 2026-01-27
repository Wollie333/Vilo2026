import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as usersService from '../services/users.service';
import * as bookingService from '../services/booking.service';
import * as reviewService from '../services/review.service';
import * as refundService from '../services/refund.service';

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
 * DELETE /api/users/:id/hard
 * Permanently delete user (hard delete)
 */
export const hardDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await usersService.hardDeleteUser(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'User permanently deleted' });
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
 * GET /api/users/:id/properties
 * Get properties for a user
 */
export const getUserProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const properties = await usersService.getUserProperties(req.params.id);
    sendSuccess(res, { properties, total: properties.length });
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
 * DELETE /api/users/:id/properties/:propertyId
 * Unassign property from user
 */
export const unassignProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await usersService.unassignProperty(
      req.params.id,
      req.params.propertyId,
      req.user!.id
    );
    sendSuccess(res, { message: 'Property unassigned successfully' });
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

// ============================================================================
// SUPER ADMIN USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/users/:userId/bookings
 * Get all bookings for a user (as guest + as property owner)
 * Super admin only
 */
export const getUserBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await bookingService.getBookingsByUser(userId, req.query as any);

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
 * GET /api/users/:userId/reviews
 * Get all reviews for a user (written by + received for properties)
 * Super admin only
 */
export const getUserReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const reviews = await reviewService.getReviewsByUser(userId, req.query as any);
    sendSuccess(res, { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:userId/refunds
 * Get all refund requests for a user
 * Super admin only
 */
export const getUserRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await refundService.getRefundsByUser(userId, req.query as any);

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
 * GET /api/users/:userId/stats
 * Get user statistics (property count, room count, team count, etc.)
 * Super admin only
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const stats = await usersService.getUserStats(userId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:userId/team
 * Get team members for a user (users where parent_user_id = userId)
 * Super admin only
 */
export const getTeamMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const members = await usersService.getTeamMembers(userId);
    sendSuccess(res, { members, total: members.length });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:userId/team
 * Invite a team member (create user with parent_user_id)
 * Super admin only
 */
export const inviteTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const member = await usersService.inviteTeamMember(
      userId,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { member, message: 'Team member invited successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:userId/team/:memberId
 * Remove team member (remove parent relationship)
 * Super admin only
 */
export const removeTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, memberId } = req.params;
    await usersService.removeTeamMember(userId, memberId, req.user!.id);
    sendSuccess(res, { message: 'Team member removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:userId/customers
 * Get customers for a user (unique guests who booked at their properties)
 * Super admin only
 */
export const getCustomersByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const customers = await usersService.getCustomersByUser(userId);
    sendSuccess(res, { customers, total: customers.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rooms for a user's properties
 * Super admin only - GET /api/users/:userId/rooms
 */
export const getUserRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    console.log('getUserRooms - userId:', userId);
    const rooms = await usersService.getUserRooms(userId);
    console.log('getUserRooms - found rooms:', rooms.length);
    sendSuccess(res, { rooms, total: rooms.length });
  } catch (error) {
    console.error('getUserRooms error:', error);
    next(error);
  }
};

/**
 * Get all addons for a user's properties
 * Super admin only - GET /api/users/:userId/addons
 */
export const getUserAddons = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const addons = await usersService.getUserAddons(userId);
    sendSuccess(res, { addons, total: addons.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all cancellation policies for a user's properties
 * Super admin only - GET /api/users/:userId/policies
 */
export const getUserPolicies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await usersService.getUserPolicies(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get property terms and conditions for a user
 * Super admin only - GET /api/users/:userId/terms
 */
export const getUserTerms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const properties = await usersService.getUserTerms(userId);
    sendSuccess(res, { properties, total: properties.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment integrations for a user's company
 * Super admin only - GET /api/users/:userId/payment-integrations
 */
export const getUserPaymentIntegrations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const integrations = await usersService.getUserPaymentIntegrations(userId);
    sendSuccess(res, { integrations, total: integrations.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription details and usage for a user
 * Super admin only - GET /api/users/:userId/subscription
 */
export const getUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await usersService.getUserSubscriptionDetails(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history for a user
 * Super admin only - GET /api/users/:userId/payment-history
 */
export const getUserPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await usersService.getUserPaymentHistory(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

