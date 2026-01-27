import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { getSubscriptionAccessStatus } from '../services/billing.service';

/**
 * Middleware to require active subscription
 * Blocks request if user's subscription is paused, expired, or cancelled
 */
export const requireActiveSubscription = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const userId = req.user.id;

    // Get subscription access status
    const accessStatus = await getSubscriptionAccessStatus(userId);

    // Block if no active subscription
    if (!accessStatus.hasActiveSubscription) {
      throw new AppError(
        'SUBSCRIPTION_REQUIRED',
        'Active subscription required to access this resource',
        {
          subscription_status: accessStatus.subscriptionStatus,
          requires_payment: accessStatus.requiresPayment,
          message: accessStatus.message,
        }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require write access
 * Allows GET requests but blocks POST/PUT/PATCH/DELETE if subscription is paused
 * Use this for endpoints that should allow read-only access when paused
 */
export const requireWriteAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const userId = req.user.id;
    const method = req.method.toUpperCase();

    // Allow GET, HEAD, OPTIONS requests (read-only)
    const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (readOnlyMethods.includes(method)) {
      return next();
    }

    // For write operations, check if user has full access
    const accessStatus = await getSubscriptionAccessStatus(userId);

    if (!accessStatus.hasFullAccess) {
      // Subscription is paused, expired, or cancelled - read-only mode
      throw new AppError(
        'READ_ONLY_MODE',
        'Your account is in read-only mode. Please reactivate your subscription to make changes.',
        {
          subscription_status: accessStatus.subscriptionStatus,
          access_mode: accessStatus.accessMode,
          requires_payment: accessStatus.requiresPayment,
          message: accessStatus.message,
        }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check trial status and warn if expiring soon
 * Doesn't block request, but adds trial info to response headers
 */
export const checkTrialStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const accessStatus = await getSubscriptionAccessStatus(userId);

    // If on trial with less than 7 days remaining, add warning header
    if (
      accessStatus.subscriptionStatus === 'trial' &&
      accessStatus.trialDaysRemaining !== null &&
      accessStatus.trialDaysRemaining <= 7
    ) {
      res.setHeader('X-Trial-Expiring', 'true');
      res.setHeader('X-Trial-Days-Remaining', accessStatus.trialDaysRemaining.toString());
      res.setHeader('X-Trial-Message', `Your trial expires in ${accessStatus.trialDaysRemaining} days`);
    }

    next();
  } catch (error) {
    // Don't fail request if trial check fails, just log it
    console.error('Trial status check failed:', error);
    next();
  }
};

/**
 * Middleware to block access if subscription is paused (stricter than requireWriteAccess)
 * Blocks ALL requests (including GET) if subscription is paused
 * Use this for features that should be completely locked when paused
 */
export const blockIfPaused = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const userId = req.user.id;
    const accessStatus = await getSubscriptionAccessStatus(userId);

    if (accessStatus.subscriptionStatus === 'paused') {
      throw new AppError(
        'ACCOUNT_PAUSED',
        'Your account is paused. Please reactivate your subscription to access this feature.',
        {
          subscription_status: 'paused',
          requires_payment: true,
          message: 'Account paused by administrator. Contact support or reactivate your subscription.',
        }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to require minimum subscription tier
 * Use this for premium features that require specific plans
 *
 * Example: requireMinimumPlan(['professional', 'enterprise'])
 */
export const requireMinimumPlan = (allowedPlans: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const userId = req.user.id;

      // Import here to avoid circular dependency
      const { getUserSubscription } = await import('../services/billing.service');
      const subscription = await getUserSubscription(userId);

      const currentPlanName = subscription.subscription_type.name;

      if (!allowedPlans.includes(currentPlanName)) {
        throw new AppError(
          'PLAN_UPGRADE_REQUIRED',
          `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
          {
            current_plan: currentPlanName,
            required_plans: allowedPlans,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
