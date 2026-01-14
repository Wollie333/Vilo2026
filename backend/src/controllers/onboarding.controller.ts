/**
 * Onboarding Controller
 *
 * Handles HTTP requests for the onboarding wizard
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as onboardingService from '../services/onboarding.service';
import {
  updateOnboardingStepSchema,
  onboardingProfileSchema,
  onboardingCompanySchema,
  onboardingPropertySchema,
  skipStepSchema,
  setSelectedPlanSchema,
} from '../validators/onboarding.validators';
import type { OnboardingStepNumber } from '../types/onboarding.types';

// ============================================================================
// PROGRESS
// ============================================================================

/**
 * GET /api/onboarding/progress
 * Get user's onboarding progress
 */
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const progress = await onboardingService.getOnboardingProgress(req.user!.id);
    sendSuccess(res, { progress });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/onboarding/step
 * Update current onboarding step
 */
export const updateStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = updateOnboardingStepSchema.parse(req.body);
    const result = await onboardingService.updateOnboardingStep(
      req.user!.id,
      validated.step as OnboardingStepNumber
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STEP DATA
// ============================================================================

/**
 * POST /api/onboarding/profile
 * Save profile data (Step 1)
 */
export const saveProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = onboardingProfileSchema.parse(req.body);
    const result = await onboardingService.saveProfileData(req.user!.id, validated);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/company
 * Save company data (Step 2)
 */
export const saveCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = onboardingCompanySchema.parse(req.body);
    const result = await onboardingService.saveCompanyData(req.user!.id, validated);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/property
 * Save property data (Step 3)
 */
export const saveProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = onboardingPropertySchema.parse(req.body);
    const result = await onboardingService.savePropertyData(req.user!.id, validated);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// COMPLETION & SKIP
// ============================================================================

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete
 */
export const complete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await onboardingService.completeOnboarding(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/skip
 * Skip all remaining onboarding steps
 */
export const skipAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await onboardingService.skipOnboarding(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/skip-step
 * Skip the current step and move to next
 */
export const skipStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = skipStepSchema.parse(req.body);
    const result = await onboardingService.skipStep(
      req.user!.id,
      validated.current_step as OnboardingStepNumber
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PLAN SELECTION
// ============================================================================

/**
 * POST /api/onboarding/set-plan
 * Set the selected plan for the user (called during signup)
 */
export const setSelectedPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = setSelectedPlanSchema.parse(req.body);
    await onboardingService.setSelectedPlan(
      req.user!.id,
      validated.plan_id,
      validated.billing_interval
    );
    sendSuccess(res, { success: true, message: 'Plan selected' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/activate-free-plan
 * Activate a free plan subscription for the user
 */
export const activateFreePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { plan_id } = req.body;

    if (!plan_id) {
      sendSuccess(res, { success: false, message: 'Plan ID required' }, 400);
      return;
    }

    // Verify it's a free plan
    const isFree = await onboardingService.isPlanFree(plan_id);
    if (!isFree) {
      sendSuccess(res, { success: false, message: 'Plan is not free' }, 400);
      return;
    }

    const result = await onboardingService.createFreeSubscription(req.user!.id, plan_id);

    sendSuccess(res, {
      success: true,
      created: result.created,
      alreadyExists: result.alreadyExists,
      message: result.created
        ? 'Free plan activated successfully'
        : 'You already have an active subscription',
      subscription: result.subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/onboarding/check-plan/:planId
 * Check if a plan is free
 */
export const checkPlanFree = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId } = req.params;
    const isFree = await onboardingService.isPlanFree(planId);
    sendSuccess(res, { is_free: isFree });
  } catch (error) {
    next(error);
  }
};
