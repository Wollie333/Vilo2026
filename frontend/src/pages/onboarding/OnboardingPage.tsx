/**
 * OnboardingPage Component
 *
 * Main container for the multi-step onboarding wizard
 * Design matched with checkout page - two-column split layout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from '@/components/ui';
import { LogoIcon } from '@/components/ui/Logo';
import { useAuth } from '@/hooks';
import { onboardingService, companyService, propertyService } from '@/services';
import { ProfileStep } from './steps/ProfileStep';
import { CompanyStep } from './steps/CompanyStep';
import { PropertyStep } from './steps/PropertyStep';
import { CompleteStep } from './steps/CompleteStep';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
  OnboardingStepNumber,
  OnboardingProgress,
  OnboardingProfileData,
  OnboardingCompanyData,
  OnboardingPropertyData,
} from '@/types/onboarding.types';

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Step configuration
const STEP_CONFIG = [
  { key: 'profile' as const, number: ONBOARDING_STEPS.PROFILE, icon: UserIcon, description: 'Tell us about yourself' },
  { key: 'company' as const, number: ONBOARDING_STEPS.COMPANY, icon: BuildingIcon, description: 'Set up your business' },
  { key: 'property' as const, number: ONBOARDING_STEPS.PROPERTY, icon: HomeIcon, description: 'Add your first property' },
  { key: 'complete' as const, number: ONBOARDING_STEPS.COMPLETE, icon: RocketIcon, description: 'Ready to go!' },
];

// Progress Step Component
const ProgressStep: React.FC<{
  step: typeof STEP_CONFIG[0];
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}> = ({ step, isCompleted, isCurrent, isLast }) => {
  const Icon = step.icon;

  return (
    <div className="flex items-start gap-4">
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
            ${isCompleted
              ? 'bg-primary text-white'
              : isCurrent
                ? 'bg-primary text-white ring-4 ring-primary/30'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }
          `}
        >
          {isCompleted ? <CheckIcon /> : <Icon />}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div
            className={`w-0.5 h-12 mt-2 transition-all duration-300 ${
              isCompleted ? 'bg-primary' : 'bg-gray-700'
            }`}
          />
        )}
      </div>

      {/* Step content */}
      <div className="pt-1.5">
        <h4
          className={`font-medium transition-colors ${
            isCurrent ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'
          }`}
        >
          {ONBOARDING_STEP_LABELS[step.key]}
        </h4>
        <p className={`text-sm ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
          {step.description}
        </p>
      </div>
    </div>
  );
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, clearInitializing } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStepNumber>(ONBOARDING_STEPS.PROFILE);
  const [, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial data for edit mode - pre-populate forms with existing data
  const [profileInitialData, setProfileInitialData] = useState<OnboardingProfileData | undefined>(undefined);
  const [companyInitialData, setCompanyInitialData] = useState<OnboardingCompanyData | undefined>(undefined);
  const [propertyInitialData, setPropertyInitialData] = useState<OnboardingPropertyData | undefined>(undefined);

  // Load onboarding progress and existing data on mount
  useEffect(() => {
    // Clear initialization state when onboarding loads
    clearInitializing();

    const loadProgressAndData = async () => {
      try {
        setIsLoading(true);

        // Load onboarding progress
        const progressData = await onboardingService.getProgress();
        setProgress(progressData);

        // Set initial step based on progress (only on mount)
        // Use the step from progress data, or default to PROFILE
        if (progressData && progressData.current_step) {
          setCurrentStep(progressData.current_step as OnboardingStepNumber);
        } else {
          setCurrentStep(ONBOARDING_STEPS.PROFILE);
        }

        // Load existing profile data from user context
        if (user) {
          setProfileInitialData({
            full_name: user.full_name || '',
            phone: user.phone || '',
            bio: (user as any).bio || '',
          });
        }

        // Load existing company data
        try {
          const companiesResponse = await companyService.getMyCompanies({ limit: 1 });
          if (companiesResponse.companies && companiesResponse.companies.length > 0) {
            const company = companiesResponse.companies[0];
            setCompanyInitialData({
              name: company.name || '',
              email: company.contact_email || '',
              phone: company.contact_phone || '',
              website: company.website || '',
              default_currency: company.default_currency || 'USD',
              logo_url: company.logo_url || undefined,
              address_street: company.address_street || '',
              address_city: company.address_city || '',
              address_state: company.address_state || '',
              address_postal_code: company.address_postal_code || '',
              address_country: company.address_country || '',
            });
          }
        } catch {
          // No existing company, that's fine
        }

        // Load existing property data
        try {
          const propertiesResponse = await propertyService.getMyProperties({ limit: 1 });
          if (propertiesResponse.properties && propertiesResponse.properties.length > 0) {
            const property = propertiesResponse.properties[0];
            // Note: property_type is stored in settings if needed, defaulting to 'house'
            const propertyType = (property.settings as any)?.property_type || 'house';
            setPropertyInitialData({
              name: property.name || '',
              description: property.description || '',
              property_type: propertyType,
              phone: property.phone || '',
              email: property.email || '',
              website: property.website || '',
              logo_url: property.logo_url || undefined,
              featured_image_url: property.featured_image_url || undefined,
              address_street: property.address_street || '',
              address_city: property.address_city || '',
              address_state: property.address_state || '',
              address_postal_code: property.address_postal_code || '',
              address_country: property.address_country || '',
            });
          }
        } catch {
          // No existing property, that's fine
        }

      } catch (err) {
        setError('Failed to load onboarding progress');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when user changes

  // Update profile data when user becomes available or changes
  useEffect(() => {
    if (user) {
      setProfileInitialData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        bio: (user as any).bio || '',
      });
    }
  }, [user]);

  // Handlers
  const handleSkipStep = async () => {
    try {
      setIsSubmitting(true);
      const result = await onboardingService.skipStep(currentStep);
      setCurrentStep(result.step);

      // If we've reached complete step, mark as complete
      if (result.step === ONBOARDING_STEPS.COMPLETE) {
        await onboardingService.complete();
      }
    } catch (err) {
      setError('Failed to skip step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > ONBOARDING_STEPS.PROFILE) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStepNumber);
    }
  };

  const handleProfileSubmit = async (data: OnboardingProfileData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await onboardingService.saveProfile(data);
      setCurrentStep(result.step);
      // Refresh user to get updated profile
      await refreshUser();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanySubmit = async (data: OnboardingCompanyData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await onboardingService.saveCompany(data);
      setCurrentStep(result.step);
      return result; // Return result so CompanyStep can access companyId
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropertySubmit = async (data: OnboardingPropertyData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await onboardingService.saveProperty(data);
      setCurrentStep(result.step);

      // Mark onboarding as complete
      if (result.step === ONBOARDING_STEPS.COMPLETE) {
        await onboardingService.complete();
        // Refresh user context so onboarding_completed_at is updated
        await refreshUser();
      }
      return result; // Return result so PropertyStep can access propertyId
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = async () => {
    try {
      // Show loading screen
      setIsDashboardLoading(true);

      // Complete onboarding (sets onboarding_completed_at in database)
      await onboardingService.complete();

      // CRITICAL: Refresh user context to get updated onboarding_completed_at
      // Without this, ProtectedRoute will still see null and redirect back to onboarding
      await refreshUser();

      // Now navigate - ProtectedRoute will see completed onboarding
      navigate('/manage/dashboard');
    } catch (err) {
      // Even on error, try to navigate (user might have already completed)
      await refreshUser();
      navigate('/manage/dashboard');
    } finally {
      // Loading state will be unmounted when navigating, but set false for safety
      setIsDashboardLoading(false);
    }
  };

  // Show dashboard loading state (when navigating to dashboard after completion)
  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state (when loading onboarding data)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.PROFILE:
        return (
          <ProfileStep
            onSubmit={handleProfileSubmit}
            onSkip={handleSkipStep}
            isLoading={isSubmitting}
            initialData={profileInitialData}
          />
        );

      case ONBOARDING_STEPS.COMPANY:
        return (
          <CompanyStep
            onSubmit={handleCompanySubmit}
            onSkip={handleSkipStep}
            onBack={handleBack}
            isLoading={isSubmitting}
            initialData={companyInitialData}
          />
        );

      case ONBOARDING_STEPS.PROPERTY:
        return (
          <PropertyStep
            onSubmit={handlePropertySubmit}
            onSkip={handleSkipStep}
            onBack={handleBack}
            isLoading={isSubmitting}
            initialData={propertyInitialData}
          />
        );

      case ONBOARDING_STEPS.COMPLETE:
        return (
          <CompleteStep
            userName={user?.full_name || ''}
            onGoToDashboard={handleGoToDashboard}
            onBack={handleBack}
          />
        );

      default:
        return (
          <ProfileStep
            onSubmit={handleProfileSubmit}
            onSkip={handleSkipStep}
            isLoading={isSubmitting}
            initialData={profileInitialData}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Dark Theme with Progress - STICKY */}
      <div className="lg:w-[400px] xl:w-[480px] bg-gray-950 p-6 lg:p-10 flex flex-col relative overflow-hidden flex-shrink-0 lg:h-screen lg:sticky lg:top-0">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with Logo */}
          <div className="flex items-center gap-3 mb-10">
            <LogoIcon size="lg" variant="glossy-slow" />
            <span className="text-2xl font-bold text-white">Vilo</span>
          </div>

          {/* Welcome Message */}
          <div className="mb-10">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Welcome to Vilo
            </h1>
            <p className="text-gray-400">
              Let's get you set up in just a few steps.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex-1">
            <div className="space-y-0">
              {STEP_CONFIG.map((step, index) => (
                <ProgressStep
                  key={step.key}
                  step={step}
                  isCompleted={currentStep > step.number}
                  isCurrent={currentStep === step.number}
                  isLast={index === STEP_CONFIG.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Content - SCROLLABLE */}
      <div className="flex-1 bg-white dark:bg-dark-card overflow-y-auto">
        <div className="p-6 lg:p-10 xl:p-16">
          <div className="max-w-xl w-full mx-auto">
            {/* Error Alert */}
            {error && (
              <Alert
                variant="error"
                className="mb-6"
                dismissible
                onDismiss={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Step Content */}
            <div>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
