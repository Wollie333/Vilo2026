import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import {
  authenticate,
  loadUserProfile,
  requireSuperAdmin,
  requirePermission,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  idParamSchema,
  createUserTypeSchema,
  updateUserTypeSchema,
  createSubscriptionTypeSchema,
  updateSubscriptionTypeSchema,
  subscriptionTypeListQuerySchema,
  createUserSubscriptionSchema,
  updateUserSubscriptionSchema,
  cancelSubscriptionSchema,
  userSubscriptionListQuerySchema,
  userIdParamSchema,
  checkLimitSchema,
} from '../validators/billing.validators';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// List subscription types - public for pricing page
router.get(
  '/subscription-types',
  validateQuery(subscriptionTypeListQuerySchema),
  billingController.listSubscriptionTypes
);

// Get subscription type by slug - public for /plans/:slug checkout pages
// IMPORTANT: This route must come BEFORE /:id to avoid slug being treated as ID
router.get(
  '/subscription-types/slug/:slug',
  billingController.getSubscriptionTypeBySlug
);

// Get single subscription type - public for pricing/checkout
router.get(
  '/subscription-types/:id',
  validateParams(idParamSchema),
  billingController.getSubscriptionType
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// All routes below require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// OVERVIEW - Get all billing settings at once
// ============================================================================

router.get(
  '/overview',
  requireSuperAdmin(),
  billingController.getBillingOverview
);

// ============================================================================
// MY BILLING - User's own billing info (no special permissions needed)
// ============================================================================

router.get('/my-billing', billingController.getMyBillingInfo);

// Get current user's subscription access status (for paywall/read-only mode)
router.get('/my-subscription-access', billingController.getMySubscriptionAccess);

// ============================================================================
// USER TYPES (MEMBER TYPES)
// ============================================================================

// List user types - authenticated users can view
router.get(
  '/user-types',
  billingController.listUserTypes
);

// Get single user type
router.get(
  '/user-types/:id',
  validateParams(idParamSchema),
  billingController.getUserType
);

// Create user type - super admin only
router.post(
  '/user-types',
  validateBody(createUserTypeSchema),
  requireSuperAdmin(),
  billingController.createUserType
);

// Update user type - super admin only
router.patch(
  '/user-types/:id',
  validateParams(idParamSchema),
  validateBody(updateUserTypeSchema),
  requireSuperAdmin(),
  billingController.updateUserType
);

// Delete user type - super admin only
router.delete(
  '/user-types/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.deleteUserType
);

// ============================================================================
// USER TYPE PERMISSIONS
// ============================================================================

// List all available permissions
router.get(
  '/permissions',
  billingController.listPermissions
);

// Get all permissions grouped by category (for subscription plan editor)
router.get(
  '/permissions-by-category',
  billingController.getPermissionsByCategory
);

// List all user types with their permissions
router.get(
  '/user-types-with-permissions',
  billingController.listUserTypesWithPermissions
);

// Get permissions for a user type
router.get(
  '/user-types/:id/permissions',
  validateParams(idParamSchema),
  billingController.getUserTypePermissions
);

// Update all permissions for a user type (replace) - super admin only
router.put(
  '/user-types/:id/permissions',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.updateUserTypePermissions
);

// Add a permission to a user type - super admin only
router.post(
  '/user-types/:id/permissions',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.assignPermissionToUserType
);

// Remove a permission from a user type - super admin only
router.delete(
  '/user-types/:id/permissions/:permissionId',
  requireSuperAdmin(),
  billingController.removePermissionFromUserType
);

// Apply a permission template to a user type - super admin only
router.post(
  '/user-types/:id/apply-template',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.applyTemplateToUserType
);

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

// List all permission templates
router.get(
  '/permission-templates',
  billingController.listPermissionTemplates
);

// Get single permission template with permissions
router.get(
  '/permission-templates/:id',
  validateParams(idParamSchema),
  billingController.getPermissionTemplate
);

// Create permission template - super admin only
router.post(
  '/permission-templates',
  requireSuperAdmin(),
  billingController.createPermissionTemplate
);

// Update permission template - super admin only
router.patch(
  '/permission-templates/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.updatePermissionTemplate
);

// Delete permission template - super admin only
router.delete(
  '/permission-templates/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.deletePermissionTemplate
);

// ============================================================================
// SUBSCRIPTION TYPES (with embedded JSONB limits)
// Note: GET routes are public and defined above the auth middleware
// ============================================================================

// Create subscription type (with limits) - super admin only
router.post(
  '/subscription-types',
  validateBody(createSubscriptionTypeSchema),
  requireSuperAdmin(),
  billingController.createSubscriptionType
);

// Update subscription type (including limits) - super admin only
router.patch(
  '/subscription-types/:id',
  validateParams(idParamSchema),
  validateBody(updateSubscriptionTypeSchema),
  requireSuperAdmin(),
  billingController.updateSubscriptionType
);

// Delete subscription type - super admin only
router.delete(
  '/subscription-types/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.deleteSubscriptionType
);

// Force delete subscription type (with checkout history) - super admin only
router.delete(
  '/subscription-types/:id/force',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.forceDeleteSubscriptionType
);

// ============================================================================
// USER SUBSCRIPTIONS (with status field)
// ============================================================================

// List user subscriptions - requires users:read permission
router.get(
  '/subscriptions',
  requirePermission('users', 'read'),
  validateQuery(userSubscriptionListQuerySchema),
  billingController.listUserSubscriptions
);

// Get user's subscription
router.get(
  '/subscriptions/user/:userId',
  validateParams(userIdParamSchema),
  requirePermission('users', 'read'),
  billingController.getUserSubscription
);

// Create user subscription - super admin only
router.post(
  '/subscriptions',
  validateBody(createUserSubscriptionSchema),
  requireSuperAdmin(),
  billingController.createUserSubscription
);

// Update user subscription - super admin only
router.patch(
  '/subscriptions/user/:userId',
  validateParams(userIdParamSchema),
  validateBody(updateUserSubscriptionSchema),
  requireSuperAdmin(),
  billingController.updateUserSubscription
);

// Cancel user subscription - users can cancel their own, admin can cancel any
router.post(
  '/subscriptions/user/:userId/cancel',
  validateParams(userIdParamSchema),
  validateBody(cancelSubscriptionSchema),
  billingController.cancelUserSubscription
);

// Pause user subscription - users can pause their own, admin can pause any
router.post(
  '/subscriptions/user/:userId/pause',
  validateParams(userIdParamSchema),
  billingController.pauseUserSubscription
);

// Resume paused subscription - users can resume their own, admin can resume any
router.post(
  '/subscriptions/user/:userId/resume',
  validateParams(userIdParamSchema),
  billingController.resumeUserSubscription
);

// ============================================================================
// USER BILLING INFO
// ============================================================================

// Get user's complete billing info
router.get(
  '/users/:userId/billing-info',
  validateParams(userIdParamSchema),
  requirePermission('users', 'read'),
  billingController.getUserBillingInfo
);

// Assign user type to a user - super admin only
router.post(
  '/users/:userId/user-type',
  validateParams(userIdParamSchema),
  requireSuperAdmin(),
  billingController.assignUserType
);

// Check user limit
router.post(
  '/users/:userId/check-limit',
  validateParams(userIdParamSchema),
  validateBody(checkLimitSchema),
  billingController.checkUserLimit
);

// ============================================================================
// SUBSCRIPTION TYPE PERMISSIONS (NEW)
// ============================================================================

// Get subscription type permissions - super admin only
router.get(
  '/subscription-types/:id/permissions',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.getSubscriptionTypePermissions
);

// Update subscription type permissions - super admin only
router.put(
  '/subscription-types/:id/permissions',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.updateSubscriptionTypePermissions
);

// ============================================================================
// SUBSCRIPTION UPGRADE REQUESTS (User Response)
// ============================================================================

// Get current user's pending upgrade request
router.get(
  '/my-pending-upgrade',
  billingController.getMyPendingUpgrade
);

// Respond to an upgrade request (accept or decline)
router.post(
  '/upgrade-requests/:id/respond',
  validateParams(idParamSchema),
  billingController.respondToUpgradeRequest
);

export default router;
