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
  createBillingStatusSchema,
  updateBillingStatusSchema,
  createSubscriptionTypeSchema,
  updateSubscriptionTypeSchema,
  subscriptionTypeListQuerySchema,
  createSubscriptionLimitSchema,
  updateSubscriptionLimitSchema,
  bulkUpdateLimitsSchema,
  subscriptionTypeLimitsParamSchema,
  createUserSubscriptionSchema,
  updateUserSubscriptionSchema,
  cancelSubscriptionSchema,
  userSubscriptionListQuerySchema,
  userIdParamSchema,
  checkLimitSchema,
} from '../validators/billing.validators';

const router = Router();

// All routes require authentication
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
// USER TYPES
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
// BILLING STATUSES
// ============================================================================

// List billing statuses - authenticated users can view
router.get(
  '/statuses',
  billingController.listBillingStatuses
);

// Get single billing status
router.get(
  '/statuses/:id',
  validateParams(idParamSchema),
  billingController.getBillingStatus
);

// Create billing status - super admin only
router.post(
  '/statuses',
  validateBody(createBillingStatusSchema),
  requireSuperAdmin(),
  billingController.createBillingStatus
);

// Update billing status - super admin only
router.patch(
  '/statuses/:id',
  validateParams(idParamSchema),
  validateBody(updateBillingStatusSchema),
  requireSuperAdmin(),
  billingController.updateBillingStatus
);

// Delete billing status - super admin only
router.delete(
  '/statuses/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.deleteBillingStatus
);

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

// List subscription types - authenticated users can view
router.get(
  '/subscription-types',
  validateQuery(subscriptionTypeListQuerySchema),
  billingController.listSubscriptionTypes
);

// Get single subscription type with limits
router.get(
  '/subscription-types/:id',
  validateParams(idParamSchema),
  billingController.getSubscriptionType
);

// Create subscription type - super admin only
router.post(
  '/subscription-types',
  validateBody(createSubscriptionTypeSchema),
  requireSuperAdmin(),
  billingController.createSubscriptionType
);

// Update subscription type - super admin only
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

// Get limits for a subscription type
router.get(
  '/subscription-types/:subscriptionTypeId/limits',
  validateParams(subscriptionTypeLimitsParamSchema),
  billingController.getSubscriptionLimits
);

// Bulk update limits for a subscription type - super admin only
router.put(
  '/subscription-types/:subscriptionTypeId/limits',
  validateParams(subscriptionTypeLimitsParamSchema),
  validateBody(bulkUpdateLimitsSchema),
  requireSuperAdmin(),
  billingController.bulkUpdateLimits
);

// ============================================================================
// SUBSCRIPTION LIMITS (Individual)
// ============================================================================

// Create subscription limit - super admin only
router.post(
  '/limits',
  validateBody(createSubscriptionLimitSchema),
  requireSuperAdmin(),
  billingController.createSubscriptionLimit
);

// Update subscription limit - super admin only
router.patch(
  '/limits/:id',
  validateParams(idParamSchema),
  validateBody(updateSubscriptionLimitSchema),
  requireSuperAdmin(),
  billingController.updateSubscriptionLimit
);

// Delete subscription limit - super admin only
router.delete(
  '/limits/:id',
  validateParams(idParamSchema),
  requireSuperAdmin(),
  billingController.deleteSubscriptionLimit
);

// ============================================================================
// USER SUBSCRIPTIONS
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

// Cancel user subscription - super admin only
router.post(
  '/subscriptions/user/:userId/cancel',
  validateParams(userIdParamSchema),
  validateBody(cancelSubscriptionSchema),
  requireSuperAdmin(),
  billingController.cancelUserSubscription
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

export default router;
