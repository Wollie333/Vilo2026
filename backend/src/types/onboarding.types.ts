/**
 * Onboarding Types
 *
 * Type definitions for the multi-step onboarding wizard
 */

// Onboarding step numbers
export const ONBOARDING_STEPS = {
  NOT_STARTED: 0,
  PROFILE: 1,
  COMPANY: 2,
  PROPERTY: 3,
  COMPLETE: 4,
} as const;

export type OnboardingStepNumber = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

// Step names for display
export type OnboardingStepName = 'profile' | 'company' | 'property' | 'complete';

// Billing interval options
export type BillingInterval = 'monthly' | 'annual';

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Minimal signup request (email + password only)
 */
export interface MinimalSignUpRequest {
  email: string;
  password: string;
  selected_plan_id?: string;
  selected_billing_interval?: BillingInterval;
}

/**
 * Update onboarding step
 */
export interface UpdateOnboardingStepRequest {
  step: OnboardingStepNumber;
}

/**
 * Profile step data
 */
export interface OnboardingProfileRequest {
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

/**
 * Company step data
 */
export interface OnboardingCompanyRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
}

/**
 * Property step data
 */
export interface OnboardingPropertyRequest {
  name: string;
  description?: string | null;
  property_type?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Onboarding progress response
 */
export interface OnboardingProgress {
  step: OnboardingStepNumber;
  completed_at: string | null;
  profile_completed: boolean;
  company_completed: boolean;
  property_completed: boolean;
  selected_plan_id: string | null;
  selected_billing_interval: BillingInterval | null;
}

/**
 * Onboarding step completion response
 */
export interface OnboardingStepResponse {
  success: boolean;
  step: OnboardingStepNumber;
  message: string;
}

/**
 * Onboarding complete response
 */
export interface OnboardingCompleteResponse {
  success: boolean;
  message: string;
  redirect_to: string;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * User onboarding fields (subset of users table)
 */
export interface UserOnboardingFields {
  onboarding_completed_at: string | null;
  onboarding_step: OnboardingStepNumber;
  selected_plan_id: string | null;
  selected_billing_interval: BillingInterval | null;
}
