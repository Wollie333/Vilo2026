/**
 * OnboardingFooter Component
 *
 * Navigation buttons for onboarding wizard steps
 * Uses CTAButton for prominent continue action (matching checkout page styling)
 */

import React from 'react';
import { Button, CTAButton } from '@/components/ui';

// Arrow icon for CTA button
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

interface OnboardingFooterProps {
  onSkip: () => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  showBack?: boolean;
  skipLabel?: string;
  continueLabel?: string;
}

export const OnboardingFooter: React.FC<OnboardingFooterProps> = ({
  onSkip,
  onContinue,
  onBack,
  isLoading = false,
  showBack = false,
  skipLabel = 'Skip this step',
  continueLabel = 'Continue',
}) => {
  return (
    <div className="flex flex-col gap-4 pt-6 border-t border-gray-200 dark:border-dark-border">
      {/* Primary CTA - Full width on mobile */}
      <CTAButton
        onClick={onContinue}
        loading={isLoading}
        loadingText="Saving..."
        icon={<ArrowRightIcon />}
        iconPosition="right"
        variant="primary"
        fullWidth
        id="onboarding-continue-btn"
        dataAttributes={{
          'tracking-id': 'onboarding_continue',
          'tracking-category': 'onboarding',
        }}
      >
        {continueLabel}
      </CTAButton>

      {/* Secondary actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          {skipLabel}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingFooter;
