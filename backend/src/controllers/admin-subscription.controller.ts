import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import * as billingService from '../services/billing.service';
import * as upgradeService from '../services/subscription-upgrade.service';
import * as notificationService from '../services/subscription-notifications.service';

// ============================================================================
// ADMIN SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * POST /api/admin/users/:userId/subscription/upgrade
 * Create an upgrade request for a user
 */
export const requestUpgrade = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { target_plan_id, admin_notes } = req.body;
    const adminId = req.user!.id;

    if (!target_plan_id) {
      throw new AppError('VALIDATION_ERROR', 'target_plan_id is required');
    }

    // Create the upgrade request
    const upgradeRequest = await upgradeService.createUpgradeRequest(
      {
        user_id: userId,
        target_plan_id,
        admin_notes,
      },
      adminId
    );

    // Get subscription display info for notification
    const displayInfo = await billingService.getSubscriptionDisplayInfo(userId);
    const targetPlan = await billingService.getSubscriptionType(target_plan_id);

    // Get admin info
    const { data: admin } = await billingService.getAdminClient()
      .from('users')
      .select('full_name')
      .eq('id', adminId)
      .single();

    // Calculate target plan price
    const billingInterval = displayInfo.billing_interval || 'monthly';
    let targetPriceCents = 0;
    if (billingInterval === 'monthly') {
      targetPriceCents = targetPlan.pricing_tiers?.monthly?.price_cents || targetPlan.price_cents || 0;
    } else if (billingInterval === 'annual') {
      targetPriceCents = targetPlan.pricing_tiers?.annual?.price_cents || targetPlan.price_cents || 0;
    }

    const targetPriceFormatted = `${targetPlan.currency} ${(targetPriceCents / 100).toFixed(2)}`;
    const priceDifference = `${targetPlan.currency} ${((targetPriceCents - displayInfo.current_price_cents) / 100).toFixed(2)}`;

    // Send notifications
    await notificationService.notifyUpgradeRequest(
      userId,
      admin?.full_name || 'Admin',
      displayInfo.plan_display_name,
      targetPlan.display_name,
      displayInfo.current_price_formatted,
      targetPriceFormatted,
      displayInfo.billing_interval_label,
      displayInfo.billing_interval_label,
      priceDifference,
      displayInfo.next_billing_date || 'Next billing cycle',
      admin_notes || 'No additional notes',
      upgradeRequest.id,
      upgradeRequest.expires_at
    );

    sendSuccess(
      res,
      {
        upgradeRequest,
        message: 'Upgrade request created and user has been notified',
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/:userId/subscription/pause
 * Pause a user's subscription
 */
export const pauseSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason) {
      throw new AppError('VALIDATION_ERROR', 'reason is required');
    }

    // Get subscription info before pausing
    const displayInfo = await billingService.getSubscriptionDisplayInfo(userId);

    // Pause the subscription
    await billingService.adminPauseSubscription(userId, adminId, reason);

    // Get admin info
    const { data: admin } = await billingService.getAdminClient()
      .from('users')
      .select('full_name')
      .eq('id', adminId)
      .single();

    // Send notifications
    await notificationService.notifySubscriptionPaused(
      userId,
      admin?.full_name || 'Admin',
      displayInfo.plan_display_name,
      reason
    );

    sendSuccess(res, {
      message: 'Subscription paused successfully and user has been notified',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/:userId/subscription/cancel
 * Cancel a user's subscription
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason) {
      throw new AppError('VALIDATION_ERROR', 'reason is required');
    }

    // Get subscription info before cancelling
    const displayInfo = await billingService.getSubscriptionDisplayInfo(userId);
    const accessEndsAt = displayInfo.subscription.expires_at || new Date().toISOString();

    // Cancel the subscription
    await billingService.adminCancelSubscription(userId, adminId, reason);

    // Get admin info
    const { data: admin } = await billingService.getAdminClient()
      .from('users')
      .select('full_name')
      .eq('id', adminId)
      .single();

    // Send notifications
    await notificationService.notifySubscriptionCancelled(
      userId,
      admin?.full_name || 'Admin',
      displayInfo.plan_display_name,
      reason,
      accessEndsAt
    );

    sendSuccess(res, {
      message: 'Subscription cancelled successfully and user has been notified',
      access_ends_at: accessEndsAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/:userId/subscription/reactivate
 * Reactivate a paused subscription
 */
export const reactivateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.id;

    // Reactivate the subscription
    await billingService.adminReactivateSubscription(userId, adminId);

    // Get subscription info after reactivation
    const displayInfo = await billingService.getSubscriptionDisplayInfo(userId);

    // Send notifications
    await notificationService.notifySubscriptionResumed(
      userId,
      displayInfo.plan_display_name,
      displayInfo.current_price_formatted,
      displayInfo.billing_interval_label,
      displayInfo.next_billing_date || 'Next billing cycle'
    );

    sendSuccess(res, {
      message: 'Subscription reactivated successfully and user has been notified',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:userId/subscription/display
 * Get formatted subscription display information
 */
export const getSubscriptionDisplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const displayInfo = await billingService.getSubscriptionDisplayInfo(userId);

    sendSuccess(res, { subscription: displayInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/upgrade-requests
 * List all upgrade requests (admin view)
 */
export const listUpgradeRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id, status, requested_by_admin_id, page, limit } = req.query;

    const result = await upgradeService.listUpgradeRequests({
      user_id: user_id as string,
      status: status as any,
      requested_by_admin_id: requested_by_admin_id as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:userId/available-upgrades
 * Get available upgrade plans for a user (higher-tier plans only)
 */
export const getAvailableUpgrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Get user's current subscription
    const currentSub = await billingService.getUserSubscription(userId);
    const currentPlan = currentSub.subscription_type;

    // Get current price for comparison
    const billingInterval = (currentSub as any).billing_interval || 'monthly';
    let currentPrice = 0;
    if (billingInterval === 'monthly') {
      currentPrice = currentPlan.pricing_tiers?.monthly?.price_cents || currentPlan.price_cents || 0;
    } else if (billingInterval === 'annual') {
      currentPrice = currentPlan.pricing_tiers?.annual?.price_cents || currentPlan.price_cents || 0;
    }

    // Get all active subscription types
    const allPlans = await billingService.listSubscriptionTypes({ is_active: true });

    // Filter to only higher-tier plans (higher price)
    const upgradePlans = allPlans.filter((plan) => {
      let planPrice = 0;
      if (billingInterval === 'monthly') {
        planPrice = plan.pricing_tiers?.monthly?.price_cents || plan.price_cents || 0;
      } else if (billingInterval === 'annual') {
        planPrice = plan.pricing_tiers?.annual?.price_cents || plan.price_cents || 0;
      }
      return planPrice > currentPrice;
    });

    sendSuccess(res, {
      current_plan: currentPlan,
      available_upgrades: upgradePlans,
    });
  } catch (error) {
    next(error);
  }
};
