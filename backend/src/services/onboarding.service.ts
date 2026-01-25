/**
 * Onboarding Service
 *
 * Handles the multi-step onboarding wizard logic
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { createUserSubscription, getSubscriptionType, getUserSubscription } from './billing.service';
import { createCompany } from './company.service';
import {
  ONBOARDING_STEPS,
  OnboardingProgress,
  OnboardingStepNumber,
  OnboardingProfileRequest,
  OnboardingCompanyRequest,
  OnboardingPropertyRequest,
  OnboardingStepResponse,
  OnboardingCompleteResponse,
  BillingInterval,
} from '../types/onboarding.types';

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Get user's onboarding progress
 */
export const getOnboardingProgress = async (userId: string): Promise<OnboardingProgress> => {
  const supabase = getAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      onboarding_completed_at,
      onboarding_step,
      selected_plan_id,
      selected_billing_interval,
      full_name,
      phone
    `)
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Check if profile is completed (has full_name)
  const profileCompleted = !!user.full_name && user.full_name.trim() !== '';

  // Check if company is completed
  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const companyCompleted = (companyCount || 0) > 0;

  // Check if property is completed
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId);

  const propertyCompleted = (propertyCount || 0) > 0;

  return {
    step: user.onboarding_step || ONBOARDING_STEPS.NOT_STARTED,
    completed_at: user.onboarding_completed_at,
    profile_completed: profileCompleted,
    company_completed: companyCompleted,
    property_completed: propertyCompleted,
    selected_plan_id: user.selected_plan_id,
    selected_billing_interval: user.selected_billing_interval,
  };
};

/**
 * Update user's current onboarding step
 */
export const updateOnboardingStep = async (
  userId: string,
  step: OnboardingStepNumber
): Promise<OnboardingStepResponse> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update onboarding step');
  }

  return {
    success: true,
    step,
    message: `Onboarding step updated to ${step}`,
  };
};

/**
 * Set the user's selected plan (called during signup)
 */
export const setSelectedPlan = async (
  userId: string,
  planId: string,
  billingInterval: BillingInterval
): Promise<void> => {
  const supabase = getAdminClient();

  // Validate plan exists
  await getSubscriptionType(planId);

  const { error } = await supabase
    .from('users')
    .update({
      selected_plan_id: planId,
      selected_billing_interval: billingInterval,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to set selected plan');
  }
};

// ============================================================================
// STEP DATA SAVING
// ============================================================================

/**
 * Save profile data (Step 1)
 */
export const saveProfileData = async (
  userId: string,
  data: OnboardingProfileRequest
): Promise<OnboardingStepResponse> => {
  const supabase = getAdminClient();

  const updateData: Record<string, unknown> = {
    full_name: data.full_name.trim(),
    updated_at: new Date().toISOString(),
  };

  if (data.phone !== undefined) {
    updateData.phone = data.phone?.trim() || null;
  }
  if (data.avatar_url !== undefined) {
    updateData.avatar_url = data.avatar_url || null;
  }
  if (data.bio !== undefined) {
    updateData.bio = data.bio?.trim() || null;
  }

  // Update to step 2 (company)
  updateData.onboarding_step = ONBOARDING_STEPS.COMPANY;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Failed to save profile data:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to save profile data: ${error.message}`);
  }

  return {
    success: true,
    step: ONBOARDING_STEPS.COMPANY,
    message: 'Profile saved successfully',
  };
};

/**
 * Save company data (Step 2)
 */
export const saveCompanyData = async (
  userId: string,
  data: OnboardingCompanyRequest
): Promise<OnboardingStepResponse> => {
  const supabase = getAdminClient();

  console.log('=== [ONBOARDING_SERVICE] saveCompanyData called ===');
  console.log('[ONBOARDING_SERVICE] User ID:', userId);
  console.log('[ONBOARDING_SERVICE] Company data:', JSON.stringify(data, null, 2));

  // Check if user already has a company
  console.log('[ONBOARDING_SERVICE] Checking for existing companies...');
  const { data: existingCompanies, error: checkError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (checkError) {
    console.error('[ONBOARDING_SERVICE] Error checking existing companies:', checkError);
    throw new AppError('INTERNAL_ERROR', `Failed to check existing companies: ${checkError.message}`);
  }

  console.log('[ONBOARDING_SERVICE] Existing companies found:', existingCompanies?.length || 0);

  let companyId: string;

  if (existingCompanies && existingCompanies.length > 0) {
    // Update existing company
    companyId = existingCompanies[0].id;
    console.log('[ONBOARDING_SERVICE] Updating existing company:', companyId);

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        name: data.name,
        display_name: data.name,
        contact_email: data.email || null,
        contact_phone: data.phone || null,
        website: data.website || null,
        default_currency: data.default_currency || 'USD',
        address_street: data.address_street || null,
        address_city: data.address_city || null,
        address_state: data.address_state || null,
        address_postal_code: data.address_postal_code || null,
        address_country: data.address_country || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('[ONBOARDING_SERVICE] Failed to update company:', updateError);
      throw new AppError('INTERNAL_ERROR', `Failed to update company: ${updateError.message}`);
    }

    console.log('[ONBOARDING_SERVICE] Company updated successfully');
  } else {
    // Create new company using the existing company service
    console.log('[ONBOARDING_SERVICE] Creating new company via createCompany service...');
    try {
      const createdCompany = await createCompany(userId, {
        name: data.name,
        display_name: data.name,
        contact_email: data.email,
        contact_phone: data.phone,
        website: data.website,
        default_currency: data.default_currency || 'USD',
        address_street: data.address_street,
        address_city: data.address_city,
        address_state: data.address_state,
        address_postal_code: data.address_postal_code,
        address_country: data.address_country,
      });
      companyId = createdCompany.id;
      console.log('[ONBOARDING_SERVICE] Company created successfully:', companyId);
    } catch (error) {
      console.error('[ONBOARDING_SERVICE] Failed to create company:', error);
      throw error;
    }
  }

  // Update to step 3 (property)
  const { error } = await supabase
    .from('users')
    .update({
      onboarding_step: ONBOARDING_STEPS.PROPERTY,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update onboarding step');
  }

  return {
    success: true,
    step: ONBOARDING_STEPS.PROPERTY,
    message: 'Company saved successfully',
    companyId, // Return company ID for image upload
  };
};

/**
 * Helper: Generate a URL-friendly slug from a name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
};

/**
 * Helper: Generate a unique slug by appending a number if needed
 */
const generateUniquePropertySlug = async (name: string): Promise<string> => {
  const supabase = getAdminClient();
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      // Fallback: append timestamp
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
};

/**
 * Save property data (Step 3)
 */
export const savePropertyData = async (
  userId: string,
  data: OnboardingPropertyRequest
): Promise<OnboardingStepResponse> => {
  const supabase = getAdminClient();

  console.log('=== [ONBOARDING_SERVICE] savePropertyData called ===');
  console.log('[ONBOARDING_SERVICE] User ID:', userId);
  console.log('[ONBOARDING_SERVICE] Property data:', JSON.stringify(data, null, 2));

  // Get user's first company (if any) to link property
  console.log('[ONBOARDING_SERVICE] Fetching user company...');
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (companyError) {
    console.error('[ONBOARDING_SERVICE] Error fetching company:', companyError);
  }

  const companyId = companies?.[0]?.id || null;
  console.log('[ONBOARDING_SERVICE] Company ID:', companyId || 'none');

  // Check if user already has a property (check by company since owner_id is temporarily null)
  console.log('[ONBOARDING_SERVICE] Checking for existing properties...');
  const { data: existingProperties, error: checkError } = await supabase
    .from('properties')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);

  if (checkError) {
    console.error('[ONBOARDING_SERVICE] Error checking existing properties:', checkError);
    throw new AppError('INTERNAL_ERROR', `Failed to check existing properties: ${checkError.message}`);
  }

  console.log('[ONBOARDING_SERVICE] Existing properties found:', existingProperties?.length || 0);

  let propertyId: string;

  if (existingProperties && existingProperties.length > 0) {
    // Update existing property
    propertyId = existingProperties[0].id;
    console.log('[ONBOARDING_SERVICE] Updating existing property:', propertyId);

    const { error: updateError } = await supabase
      .from('properties')
      .update({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        property_type: data.property_type || 'house',
        // Contact information
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        website: data.website?.trim() || null,
        // Address fields
        address_street: data.address_street?.trim() || null,
        address_city: data.address_city?.trim() || null,
        address_state: data.address_state?.trim() || null,
        address_postal_code: data.address_postal_code?.trim() || null,
        address_country: data.address_country?.trim() || null,
        // Hierarchical location fields
        country_id: data.country_id ?? null,
        province_id: data.province_id ?? null,
        city_id: data.city_id ?? null,
        location_lat: data.location_lat ?? null,
        location_lng: data.location_lng ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('[ONBOARDING_SERVICE] Failed to update property:', updateError);
      throw new AppError('INTERNAL_ERROR', `Failed to update property: ${updateError.message}`);
    }

    console.log('[ONBOARDING_SERVICE] Property updated successfully');
  } else {
    // Create new property with slug
    console.log('[ONBOARDING_SERVICE] Creating new property...');
    console.log('[ONBOARDING_SERVICE] Generating unique slug from name:', data.name);

    const slug = await generateUniquePropertySlug(data.name);
    console.log('[ONBOARDING_SERVICE] Generated slug:', slug);

    const propertyData = {
      owner_id: userId,
      company_id: companyId,
      name: data.name.trim(),
      slug: slug,
      description: data.description?.trim() || null,
      property_type: data.property_type || 'house',
      // Contact information
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      website: data.website?.trim() || null,
      // Address fields
      address_street: data.address_street?.trim() || null,
      address_city: data.address_city?.trim() || null,
      address_state: data.address_state?.trim() || null,
      address_postal_code: data.address_postal_code?.trim() || null,
      address_country: data.address_country?.trim() || null,
      // Hierarchical location fields
      country_id: data.country_id ?? null,
      province_id: data.province_id ?? null,
      city_id: data.city_id ?? null,
      location_lat: data.location_lat ?? null,
      location_lng: data.location_lng ?? null,
    };

    console.log('[ONBOARDING_SERVICE] Property data to insert:', JSON.stringify(propertyData, null, 2));

    const { data: createdProperty, error: propertyError } = await supabase
      .from('properties')
      .insert(propertyData)
      .select('id')
      .single();

    if (propertyError || !createdProperty) {
      console.error('[ONBOARDING_SERVICE] Failed to create property:', propertyError);
      console.error('[ONBOARDING_SERVICE] Error code:', propertyError?.code);
      console.error('[ONBOARDING_SERVICE] Error details:', propertyError?.details);
      console.error('[ONBOARDING_SERVICE] Error message:', propertyError?.message);
      throw new AppError('INTERNAL_ERROR', `Failed to create property: ${propertyError?.message || 'Unknown error'}`);
    }

    propertyId = createdProperty.id;
    console.log('[ONBOARDING_SERVICE] Property created successfully with ID:', propertyId);
  }

  // Update to step 4 (complete)
  const { error } = await supabase
    .from('users')
    .update({
      onboarding_step: ONBOARDING_STEPS.COMPLETE,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update onboarding step');
  }

  return {
    success: true,
    step: ONBOARDING_STEPS.COMPLETE,
    message: 'Property saved successfully',
    propertyId, // Return property ID for image upload
  };
};

// ============================================================================
// COMPLETION & SKIP
// ============================================================================

/**
 * Complete onboarding
 */
export const completeOnboarding = async (
  userId: string
): Promise<OnboardingCompleteResponse> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: ONBOARDING_STEPS.COMPLETE,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to complete onboarding');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'user.updated',
    entity_type: 'user',
    entity_id: userId,
    new_data: { onboarding_completed: true },
  });

  return {
    success: true,
    message: 'Onboarding completed successfully',
    redirect_to: '/manage/dashboard',
  };
};

/**
 * Skip remaining onboarding steps
 */
export const skipOnboarding = async (
  userId: string
): Promise<OnboardingCompleteResponse> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: ONBOARDING_STEPS.COMPLETE,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to skip onboarding');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'user.updated',
    entity_type: 'user',
    entity_id: userId,
    new_data: { onboarding_skipped: true },
  });

  return {
    success: true,
    message: 'Onboarding skipped',
    redirect_to: '/manage/dashboard',
  };
};

/**
 * Skip a single step
 */
export const skipStep = async (
  userId: string,
  currentStep: OnboardingStepNumber
): Promise<OnboardingStepResponse> => {
  let nextStep: OnboardingStepNumber;

  switch (currentStep) {
    case ONBOARDING_STEPS.PROFILE:
      nextStep = ONBOARDING_STEPS.COMPANY;
      break;
    case ONBOARDING_STEPS.COMPANY:
      nextStep = ONBOARDING_STEPS.PROPERTY;
      break;
    case ONBOARDING_STEPS.PROPERTY:
      nextStep = ONBOARDING_STEPS.COMPLETE;
      break;
    default:
      nextStep = ONBOARDING_STEPS.COMPLETE;
  }

  return updateOnboardingStep(userId, nextStep);
};

// ============================================================================
// FREE SUBSCRIPTION
// ============================================================================

/**
 * Create a free subscription for a user
 * Called when user signs up with a free plan
 */
export const createFreeSubscription = async (
  userId: string,
  planId: string,
  actorId?: string
): Promise<{ created: boolean; alreadyExists: boolean; subscription: any }> => {
  // Check if user already has a subscription
  const existingSubscription = await getUserSubscription(userId);
  if (existingSubscription) {
    // Check if it's the same plan
    if (existingSubscription.subscription_type_id === planId) {
      // Already has this exact plan - idempotent success
      return {
        created: false,
        alreadyExists: true,
        subscription: existingSubscription,
      };
    }

    // Different plan - this is an error
    throw new AppError(
      'CONFLICT',
      'User already has a different subscription. Cancel current subscription first.'
    );
  }

  // Get the plan to verify it's free
  const plan = await getSubscriptionType(planId);
  const price = plan.pricing?.monthly || 0;
  const annualPrice = plan.pricing?.annual || 0;

  if (price > 0 || annualPrice > 0) {
    throw new AppError('VALIDATION_ERROR', 'Cannot create free subscription for paid plan');
  }

  // Create the subscription
  const subscription = await createUserSubscription(
    {
      user_id: userId,
      subscription_type_id: planId,
      status: 'active',
      trial_ends_at: plan.trial_period_days
        ? new Date(Date.now() + plan.trial_period_days * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    },
    actorId || userId
  );

  return {
    created: true,
    alreadyExists: false,
    subscription,
  };
};

/**
 * Check if a plan is free
 */
export const isPlanFree = async (planId: string): Promise<boolean> => {
  const plan = await getSubscriptionType(planId);
  const monthlyPrice = plan.pricing?.monthly || 0;
  const annualPrice = plan.pricing?.annual || 0;
  return monthlyPrice === 0 && annualPrice === 0;
};
