/**
 * Onboarding Service
 *
 * API calls for the multi-step onboarding wizard
 */

import { api } from './api.service';
import type {
  OnboardingProgress,
  OnboardingStepResponse,
  OnboardingCompleteResponse,
  OnboardingProfileData,
  OnboardingCompanyData,
  OnboardingPropertyData,
  SetSelectedPlanData,
  CheckPlanFreeResponse,
  ActivateFreePlanResponse,
  OnboardingStepNumber,
} from '@/types/onboarding.types';

const BASE_URL = '/onboarding';

// ============================================================================
// PROGRESS
// ============================================================================

/**
 * Get user's onboarding progress
 */
export const getProgress = async (): Promise<OnboardingProgress> => {
  const response = await api.get<{ progress: OnboardingProgress }>(`${BASE_URL}/progress`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get onboarding progress');
  }
  return response.data.progress;
};

/**
 * Update current onboarding step
 */
export const updateStep = async (step: OnboardingStepNumber): Promise<OnboardingStepResponse> => {
  const response = await api.patch<OnboardingStepResponse>(`${BASE_URL}/step`, { step });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to update onboarding step');
  }
  return response.data;
};

// ============================================================================
// STEP DATA
// ============================================================================

/**
 * Save profile data (Step 1)
 */
export const saveProfile = async (data: OnboardingProfileData): Promise<OnboardingStepResponse> => {
  const response = await api.post<OnboardingStepResponse>(`${BASE_URL}/profile`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to save profile');
  }
  return response.data;
};

/**
 * Save company data (Step 2)
 */
export const saveCompany = async (data: OnboardingCompanyData): Promise<OnboardingStepResponse> => {
  const response = await api.post<OnboardingStepResponse>(`${BASE_URL}/company`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create company');
  }
  return response.data;
};

/**
 * Save property data (Step 3)
 */
export const saveProperty = async (data: OnboardingPropertyData): Promise<OnboardingStepResponse> => {
  const response = await api.post<OnboardingStepResponse>(`${BASE_URL}/property`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create property');
  }
  return response.data;
};

// ============================================================================
// COMPLETION & SKIP
// ============================================================================

/**
 * Mark onboarding as complete
 */
export const complete = async (): Promise<OnboardingCompleteResponse> => {
  const response = await api.post<OnboardingCompleteResponse>(`${BASE_URL}/complete`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to complete onboarding');
  }
  return response.data;
};

/**
 * Skip all remaining onboarding steps
 */
export const skipAll = async (): Promise<OnboardingCompleteResponse> => {
  const response = await api.post<OnboardingCompleteResponse>(`${BASE_URL}/skip`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to skip onboarding');
  }
  return response.data;
};

/**
 * Skip current step and move to next
 */
export const skipStep = async (currentStep: OnboardingStepNumber): Promise<OnboardingStepResponse> => {
  const response = await api.post<OnboardingStepResponse>(`${BASE_URL}/skip-step`, {
    current_step: currentStep,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to skip step');
  }
  return response.data;
};

// ============================================================================
// PLAN SELECTION
// ============================================================================

/**
 * Set the selected plan for the user
 */
export const setSelectedPlan = async (data: SetSelectedPlanData): Promise<void> => {
  const response = await api.post(`${BASE_URL}/set-plan`, data);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to set selected plan');
  }
};

/**
 * Activate a free plan subscription
 */
export const activateFreePlan = async (planId: string): Promise<ActivateFreePlanResponse> => {
  const response = await api.post<ActivateFreePlanResponse>(`${BASE_URL}/activate-free-plan`, { plan_id: planId });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to activate free plan');
  }
  return response.data;
};

/**
 * Check if a plan is free
 */
export const checkPlanFree = async (planId: string): Promise<boolean> => {
  const response = await api.get<CheckPlanFreeResponse>(`${BASE_URL}/check-plan/${planId}`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to check plan');
  }
  return response.data.is_free;
};

// Export as default object for convenient importing
export const onboardingService = {
  getProgress,
  updateStep,
  saveProfile,
  saveCompany,
  saveProperty,
  complete,
  skipAll,
  skipStep,
  setSelectedPlan,
  activateFreePlan,
  checkPlanFree,
};

export default onboardingService;
