import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as usersController from '../controllers/users.controller';
import {
  authenticate,
  loadUserProfile,
  requirePermission,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  userIdParamSchema,
  userListQuerySchema,
  updateUserSchema,
  approveUserSchema,
  assignRolesSchema,
  assignPermissionsSchema,
  assignPropertiesSchema,
  createUserSchema,
} from '../validators/user.validators';

// Configure multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// Create user - super admin only
router.post(
  '/',
  validateBody(createUserSchema),
  requireSuperAdmin(),
  usersController.createUser
);

// List users - requires users:read permission
router.get(
  '/',
  requirePermission('users', 'read'),
  validateQuery(userListQuerySchema),
  usersController.listUsers
);

// Get single user - requires users:read or own profile
router.get(
  '/:id',
  validateParams(userIdParamSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  usersController.getUser
);

// Update user - requires users:update or own profile
router.patch(
  '/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  usersController.updateUser
);

// Hard delete user (permanent) - requires users:delete
// IMPORTANT: This must come BEFORE the generic /:id route
router.delete(
  '/:id/hard',
  validateParams(userIdParamSchema),
  requirePermission('users', 'delete'),
  usersController.hardDeleteUser
);

// Delete user (soft delete) - requires users:delete
router.delete(
  '/:id',
  validateParams(userIdParamSchema),
  requirePermission('users', 'delete'),
  usersController.deleteUser
);

// Approve user - requires users:manage
router.post(
  '/:id/approve',
  validateParams(userIdParamSchema),
  validateBody(approveUserSchema),
  requirePermission('users', 'manage'),
  usersController.approveUser
);

// Assign roles - super admin only
router.post(
  '/:id/roles',
  validateParams(userIdParamSchema),
  validateBody(assignRolesSchema),
  requireSuperAdmin(),
  usersController.assignRoles
);

// Assign permissions - super admin only
router.post(
  '/:id/permissions',
  validateParams(userIdParamSchema),
  validateBody(assignPermissionsSchema),
  requireSuperAdmin(),
  usersController.assignPermissions
);

// Assign properties - requires users:manage
router.post(
  '/:id/properties',
  validateParams(userIdParamSchema),
  validateBody(assignPropertiesSchema),
  requirePermission('users', 'manage'),
  usersController.assignProperties
);

// Get user properties - requires users:read
router.get(
  '/:id/properties',
  validateParams(userIdParamSchema),
  requirePermission('users', 'read'),
  usersController.getUserProperties
);

// Unassign property from user - requires users:manage
router.delete(
  '/:id/properties/:propertyId',
  validateParams(userIdParamSchema),
  requirePermission('users', 'manage'),
  usersController.unassignProperty
);

// Suspend user - requires users:manage
router.post(
  '/:id/suspend',
  validateParams(userIdParamSchema),
  requirePermission('users', 'manage'),
  usersController.suspendUser
);

// Reactivate user - requires users:manage
router.post(
  '/:id/reactivate',
  validateParams(userIdParamSchema),
  requirePermission('users', 'manage'),
  usersController.reactivateUser
);

// Upload avatar - requires ownership or admin
router.post(
  '/:id/avatar',
  validateParams(userIdParamSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  avatarUpload.single('avatar') as unknown as RequestHandler,
  usersController.uploadAvatar
);

// ============================================================================
// SUPER ADMIN USER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/users/:userId/bookings
 * Get all bookings for a user (as guest + as property owner)
 */
router.get(
  '/:userId/bookings',
  requireSuperAdmin(),
  usersController.getUserBookings
);

/**
 * GET /api/users/:userId/reviews
 * Get all reviews for a user (written by + received for properties)
 */
router.get(
  '/:userId/reviews',
  requireSuperAdmin(),
  usersController.getUserReviews
);

/**
 * GET /api/users/:userId/refunds
 * Get all refund requests for a user
 */
router.get(
  '/:userId/refunds',
  requireSuperAdmin(),
  usersController.getUserRefunds
);

/**
 * GET /api/users/:userId/stats
 * Get user statistics (property count, room count, team count, etc.)
 */
router.get(
  '/:userId/stats',
  requireSuperAdmin(),
  usersController.getUserStats
);

/**
 * GET /api/users/:userId/team
 * Get team members for a user
 */
router.get(
  '/:userId/team',
  requireSuperAdmin(),
  usersController.getTeamMembers
);

/**
 * POST /api/users/:userId/team
 * Invite a team member
 */
router.post(
  '/:userId/team',
  requireSuperAdmin(),
  usersController.inviteTeamMember
);

/**
 * DELETE /api/users/:userId/team/:memberId
 * Remove a team member
 */
router.delete(
  '/:userId/team/:memberId',
  requireSuperAdmin(),
  usersController.removeTeamMember
);

/**
 * GET /api/users/:userId/customers
 * Get customers for a user
 */
router.get(
  '/:userId/customers',
  requireSuperAdmin(),
  usersController.getCustomersByUser
);

/**
 * GET /api/users/:userId/rooms
 * Get all rooms for a user's properties
 */
router.get(
  '/:userId/rooms',
  requireSuperAdmin(),
  usersController.getUserRooms
);

/**
 * GET /api/users/:userId/addons
 * Get all addons for a user's properties
 */
router.get(
  '/:userId/addons',
  requireSuperAdmin(),
  usersController.getUserAddons
);

/**
 * GET /api/users/:userId/policies
 * Get all cancellation policies for a user's properties
 */
router.get(
  '/:userId/policies',
  requireSuperAdmin(),
  usersController.getUserPolicies
);

/**
 * GET /api/users/:userId/terms
 * Get property terms and conditions for a user
 */
router.get(
  '/:userId/terms',
  requireSuperAdmin(),
  usersController.getUserTerms
);

/**
 * GET /api/users/:userId/payment-integrations
 * Get payment integrations for a user's company
 */
router.get(
  '/:userId/payment-integrations',
  requireSuperAdmin(),
  usersController.getUserPaymentIntegrations
);

/**
 * GET /api/users/:userId/subscription
 * Get subscription details and usage for a user
 */
router.get(
  '/:userId/subscription',
  requireSuperAdmin(),
  usersController.getUserSubscription
);

/**
 * GET /api/users/:userId/payment-history
 * Get payment history for a user
 */
router.get(
  '/:userId/payment-history',
  requireSuperAdmin(),
  usersController.getUserPaymentHistory
);

export default router;
