import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as billingService from '../services/billing.service';

// ============================================================================
// USER TYPES
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
// BILLING STATUSES
// ============================================================================

/**
 * GET /api/billing/statuses
 * List all billing statuses
 */
export const listBillingStatuses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingStatuses = await billingService.listBillingStatuses();
    sendSuccess(res, { billingStatuses });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/billing/statuses/:id
 * Get single billing status
 */
export const getBillingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingStatus = await billingService.getBillingStatus(req.params.id);
    sendSuccess(res, { billingStatus });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/statuses
 * Create a new billing status
 */
export const createBillingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingStatus = await billingService.createBillingStatus(req.body, req.user!.id);
    sendSuccess(res, { billingStatus, message: 'Billing status created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/statuses/:id
 * Update a billing status
 */
export const updateBillingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billingStatus = await billingService.updateBillingStatus(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { billingStatus, message: 'Billing status updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/statuses/:id
 * Delete a billing status
 */
export const deleteBillingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.deleteBillingStatus(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Billing status deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * GET /api/billing/subscription-types
 * List all subscription types
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
 * Get single subscription type with limits
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
 * Create a new subscription type
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
 * Update a subscription type
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
// SUBSCRIPTION LIMITS
// ============================================================================

/**
 * GET /api/billing/subscription-types/:subscriptionTypeId/limits
 * Get limits for a subscription type
 */
export const getSubscriptionLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limits = await billingService.getSubscriptionLimits(req.params.subscriptionTypeId);
    sendSuccess(res, { limits });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/limits
 * Create a new subscription limit
 */
export const createSubscriptionLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = await billingService.createSubscriptionLimit(req.body, req.user!.id);
    sendSuccess(res, { limit, message: 'Subscription limit created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/billing/limits/:id
 * Update a subscription limit
 */
export const updateSubscriptionLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = await billingService.updateSubscriptionLimit(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { limit, message: 'Subscription limit updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/billing/limits/:id
 * Delete a subscription limit
 */
export const deleteSubscriptionLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await billingService.deleteSubscriptionLimit(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Subscription limit deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/billing/subscription-types/:subscriptionTypeId/limits
 * Bulk update limits for a subscription type
 */
export const bulkUpdateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limits = await billingService.bulkUpdateLimits(
      req.params.subscriptionTypeId,
      req.body.limits,
      req.user!.id
    );
    sendSuccess(res, { limits, message: 'Limits updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// USER SUBSCRIPTIONS
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
 * Get complete billing overview (all settings)
 */
export const getBillingOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [userTypes, billingStatuses, subscriptionTypes] = await Promise.all([
      billingService.listUserTypes(),
      billingService.listBillingStatuses(),
      billingService.listSubscriptionTypes(),
    ]);

    sendSuccess(res, {
      overview: {
        userTypes,
        billingStatuses,
        subscriptionTypes,
      },
    });
  } catch (error) {
    next(error);
  }
};
