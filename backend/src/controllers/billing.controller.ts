import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as billingService from '../services/billing.service';

// ============================================================================
// USER TYPES (MEMBER TYPES)
// ============================================================================

/**
 * GET /api/billing/user-types
 * List all user types
 */
export const listUserTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userTypes = await billingService.listUserTypes();
    sendSuccess(res, { userTypes });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/user-types/:id
 * Get single user type
 */
export const getUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userType = await billingService.getUserType(req.params.id);
    sendSuccess(res, { userType });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/user-types
 * Create a new user type
 */
export const createUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userType = await billingService.createUserType(req.body, req.user!.id);
    sendSuccess(res, { userType, message: 'User type created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/user-types/:id
 * Update a user type
 */
export const updateUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userType = await billingService.updateUserType(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { userType, message: 'User type updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/user-types/:id
 * Delete a user type
 */
export const deleteUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.deleteUserType(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'User type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// USER TYPE PERMISSIONS
// ============================================================================

/**
 * GET /api/billing/permissions
 * List all available permissions
 */
export const listPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await billingService.listPermissions();
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/permissions-by-category
 * Get all permissions grouped by category (for subscription plan editor)
 */
export const getPermissionsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await billingService.getPermissionsByCategory();
    sendSuccess(res, { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/user-types/:id/permissions
 * Get permissions for a user type
 */
export const getUserTypePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await billingService.getUserTypePermissions(req.params.id);
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/user-types-with-permissions
 * Get all user types with their permissions
 */
export const listUserTypesWithPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userTypes = await billingService.listUserTypesWithPermissions();
    sendSuccess(res, { userTypes });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/billing/user-types/:id/permissions
 * Update permissions for a user type (replaces all)
 */
export const updateUserTypePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { permission_ids } = req.body;
    await billingService.updateUserTypePermissions(
      req.params.id,
      permission_ids,
      req.user!.id
    );
    const updatedPermissions = await billingService.getUserTypePermissions(req.params.id);
    sendSuccess(res, {
      permissions: updatedPermissions,
      message: 'User type permissions updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/user-types/:id/permissions
 * Add a permission to a user type
 */
export const assignPermissionToUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { permission_id } = req.body;
    await billingService.assignPermissionToUserType(
      req.params.id,
      permission_id,
      req.user!.id
    );
    sendSuccess(res, { message: 'Permission assigned successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/user-types/:id/permissions/:permissionId
 * Remove a permission from a user type
 */
export const removePermissionFromUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.removePermissionFromUserType(
      req.params.id,
      req.params.permissionId,
      req.user!.id
    );
    sendSuccess(res, { message: 'Permission removed successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUBSCRIPTION TYPES (with embedded limits)
// ============================================================================

/**
 * GET /api/billing/subscription-types
 * List all subscription types with embedded limits
 */
export const listSubscriptionTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriptionTypes = await billingService.listSubscriptionTypes(req.query as any);
    sendSuccess(res, { subscriptionTypes });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/subscription-types/:id
 * Get single subscription type with embedded limits
 */
export const getSubscriptionType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriptionType = await billingService.getSubscriptionType(req.params.id);
    sendSuccess(res, { subscriptionType });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/subscription-types
 * Create a new subscription type with limits
 */
export const createSubscriptionType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriptionType = await billingService.createSubscriptionType(req.body, req.user!.id);
    sendSuccess(res, { subscriptionType, message: 'Subscription type created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/subscription-types/:id
 * Update a subscription type (including limits)
 */
export const updateSubscriptionType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriptionType = await billingService.updateSubscriptionType(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { subscriptionType, message: 'Subscription type updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/subscription-types/:id
 * Delete a subscription type
 */
export const deleteSubscriptionType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.deleteSubscriptionType(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Subscription type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// USER SUBSCRIPTIONS (with status field)
// ============================================================================

/**
 * GET /api/billing/subscriptions
 * List all user subscriptions
 */
export const listUserSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await billingService.listUserSubscriptions(req.query as any);
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
 * GET /api/billing/subscriptions/user/:userId
 * Get a user's active subscription
 */
export const getUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = await billingService.getUserSubscription(req.params.userId);
    sendSuccess(res, { subscription });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/subscriptions
 * Create a user subscription
 */
export const createUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = await billingService.createUserSubscription(req.body, req.user!.id);
    sendSuccess(res, { subscription, message: 'Subscription created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/subscriptions/user/:userId
 * Update a user's subscription
 */
export const updateUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = await billingService.updateUserSubscription(
      req.params.userId,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { subscription, message: 'Subscription updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/subscriptions/user/:userId/cancel
 * Cancel a user's subscription
 */
export const cancelUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.cancelUserSubscription(
      req.params.userId,
      req.body.cancellation_reason,
      req.user!.id
    );
    sendSuccess(res, { message: 'Subscription cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// USER BILLING INFO
// ============================================================================

/**
 * GET /api/billing/users/:userId/billing-info
 * Get complete billing info for a user
 */
export const getUserBillingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingInfo = await billingService.getUserBillingInfo(req.params.userId);
    sendSuccess(res, { billingInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/my-billing
 * Get current user's billing info (for profile page)
 */
export const getMyBillingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingInfo = await billingService.getUserBillingInfo(req.user!.id);
    sendSuccess(res, { billingInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/my-subscription-access
 * Get current user's subscription access status (for paywall/read-only mode)
 */
export const getMySubscriptionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessStatus = await billingService.getSubscriptionAccessStatus(req.user!.id);
    sendSuccess(res, { accessStatus });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/users/:userId/user-type
 * Assign user type to a user
 */
export const assignUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.assignUserType(
      req.params.userId,
      req.body.user_type_id,
      req.user!.id
    );
    sendSuccess(res, { message: 'User type assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/users/:userId/check-limit
 * Check if user is within a specific limit
 */
export const checkUserLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await billingService.checkUserLimit(
      req.params.userId,
      req.body.limit_key,
      req.body.current_count || 0
    );
    sendSuccess(res, { limitCheck: result });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// OVERVIEW
// ============================================================================

/**
 * GET /api/billing/overview
 * Get complete billing overview (user types + subscription types)
 */
export const getBillingOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const overview = await billingService.getBillingOverview();
    sendSuccess(res, { overview });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

/**
 * GET /api/billing/permission-templates
 * List all permission templates
 */
export const listPermissionTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templates = await billingService.listPermissionTemplates();
    sendSuccess(res, { templates });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/permission-templates/:id
 * Get single permission template
 */
export const getPermissionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await billingService.getPermissionTemplateWithPermissions(req.params.id);
    sendSuccess(res, { template });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/permission-templates
 * Create a new permission template
 */
export const createPermissionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await billingService.createPermissionTemplate(req.body, req.user!.id);
    sendSuccess(res, { template, message: 'Permission template created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/permission-templates/:id
 * Update a permission template
 */
export const updatePermissionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await billingService.updatePermissionTemplate(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { template, message: 'Permission template updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/permission-templates/:id
 * Delete a permission template
 */
export const deletePermissionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.deletePermissionTemplate(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Permission template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/user-types/:id/apply-template
 * Apply a permission template to a user type
 */
export const applyTemplateToUserType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.applyTemplateToUserType(
      req.params.id,
      req.body.template_id,
      req.user!.id
    );
    // Return updated permissions
    const permissions = await billingService.getUserTypePermissions(req.params.id);
    sendSuccess(res, {
      permissions,
      message: 'Permission template applied successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUBSCRIPTION TYPE PERMISSIONS (NEW)
// ============================================================================

/**
 * GET /api/billing/subscription-types/:id/permissions
 * Get permissions for a subscription type
 */
export const getSubscriptionTypePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await billingService.getSubscriptionTypePermissions(req.params.id);
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/billing/subscription-types/:id/permissions
 * Update permissions for a subscription type
 */
export const updateSubscriptionTypePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
      res.status(400).json({
        success: false,
        error: 'permission_ids must be an array'
      });
      return;
    }

    const permissions = await billingService.updateSubscriptionTypePermissions(
      req.params.id,
      permission_ids,
      req.user!.id
    );

    sendSuccess(res, {
      permissions,
      message: 'Subscription permissions updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
