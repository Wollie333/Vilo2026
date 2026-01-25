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

// Step labels for UI
export const ONBOARDING_STEP_LABELS: Record<OnboardingStepName, string> = {
  profile: 'Profile',
  company: 'Company',
  property: 'Property',
  complete: 'Complete',
};

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Profile step data
 */
export interface OnboardingProfileData {
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
}

/**
 * Company step data
 */
export interface OnboardingCompanyData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  default_currency?: string;
  logo_url?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
}

/**
 * Property step data
 */
export interface OnboardingPropertyData {
  name: string;
  description?: string;
  property_type?: string;
  // Contact information
  phone?: string;
  email?: string;
  website?: string;
  // Images
  logo_url?: string;
  featured_image_url?: string;
  // Address fields
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  // Hierarchical location fields for listing
  country_id?: number;
  province_id?: number;
  city_id?: number;
  location_lat?: number;
  location_lng?: number;
}

/**
 * Set selected plan request
 */
export interface SetSelectedPlanData {
  plan_id: string;
  billing_interval: BillingInterval;
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

/**
 * Check plan free response
 */
export interface CheckPlanFreeResponse {
  is_free: boolean;
}

/**
 * Activate free plan response
 */
export interface ActivateFreePlanResponse {
  success: boolean;
  created: boolean;
  alreadyExists?: boolean;
  message: string;
  subscription: any;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Onboarding context state
 */
export interface OnboardingContextState {
  currentStep: OnboardingStepNumber;
  progress: OnboardingProgress | null;
  isLoading: boolean;
  error: string | null;
  selectedPlanId: string | null;
  billingInterval: BillingInterval;
}

/**
 * Onboarding context actions
 */
export interface OnboardingContextActions {
  loadProgress: () => Promise<void>;
  goToStep: (step: OnboardingStepNumber) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveProfile: (data: OnboardingProfileData) => Promise<void>;
  saveCompany: (data: OnboardingCompanyData) => Promise<void>;
  saveProperty: (data: OnboardingPropertyData) => Promise<void>;
  skipStep: () => Promise<void>;
  skipAll: () => Promise<void>;
  complete: () => Promise<void>;
  setSelectedPlan: (planId: string, interval: BillingInterval) => void;
}

export type OnboardingContextValue = OnboardingContextState & OnboardingContextActions;
