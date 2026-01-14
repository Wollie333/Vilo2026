/**
 * Onboarding Routes
 *
 * API endpoints for the multi-step onboarding wizard
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as onboardingController from '../controllers/onboarding.controller';

const router = Router();

// All onboarding routes require authentication
router.use(authenticate);

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * @route   GET /api/onboarding/progress
 * @desc    Get user's onboarding progress
 * @access  Private
 */
router.get('/progress', onboardingController.getProgress);

/**
 * @route   PATCH /api/onboarding/step
 * @desc    Update current onboarding step
 * @access  Private
 */
router.patch('/step', onboardingController.updateStep);

// ============================================================================
// STEP DATA ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/onboarding/profile
 * @desc    Save profile data (Step 1)
 * @access  Private
 */
router.post('/profile', onboardingController.saveProfile);

/**
 * @route   POST /api/onboarding/company
 * @desc    Save company data (Step 2)
 * @access  Private
 */
router.post('/company', onboardingController.saveCompany);

/**
 * @route   POST /api/onboarding/property
 * @desc    Save property data (Step 3)
 * @access  Private
 */
router.post('/property', onboardingController.saveProperty);

// ============================================================================
// COMPLETION & SKIP
// ============================================================================

/**
 * @route   POST /api/onboarding/complete
 * @desc    Mark onboarding as complete
 * @access  Private
 */
router.post('/complete', onboardingController.complete);

/**
 * @route   POST /api/onboarding/skip
 * @desc    Skip all remaining onboarding steps
 * @access  Private
 */
router.post('/skip', onboardingController.skipAll);

/**
 * @route   POST /api/onboarding/skip-step
 * @desc    Skip the current step and move to next
 * @access  Private
 */
router.post('/skip-step', onboardingController.skipStep);

// ============================================================================
// PLAN SELECTION
// ============================================================================

/**
 * @route   POST /api/onboarding/set-plan
 * @desc    Set the selected plan for the user
 * @access  Private
 */
router.post('/set-plan', onboardingController.setSelectedPlan);

/**
 * @route   POST /api/onboarding/activate-free-plan
 * @desc    Activate a free plan subscription
 * @access  Private
 */
router.post('/activate-free-plan', onboardingController.activateFreePlan);

/**
 * @route   GET /api/onboarding/check-plan/:planId
 * @desc    Check if a plan is free
 * @access  Private
 */
router.get('/check-plan/:planId', onboardingController.checkPlanFree);

export default router;
