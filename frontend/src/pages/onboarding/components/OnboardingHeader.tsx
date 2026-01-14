/**
 * OnboardingHeader Component
 *
 * Displays the onboarding progress indicator and navigation
 */

import React from 'react';
import { Button } from '@/components/ui';
import { ONBOARDING_STEPS, ONBOARDING_STEP_LABELS, OnboardingStepNumber } from '@/types/onboarding.types';

interface OnboardingHeaderProps {
  currentStep: OnboardingStepNumber;
  onSkipAll: () => void;
  onLogout: () => void;
}

const steps: { key: keyof typeof ONBOARDING_STEP_LABELS; number: OnboardingStepNumber }[] = [
  { key: 'profile', number: ONBOARDING_STEPS.PROFILE },
  { key: 'company', number: ONBOARDING_STEPS.COMPANY },
  { key: 'property', number: ONBOARDING_STEPS.PROPERTY },
  { key: 'complete', number: ONBOARDING_STEPS.COMPLETE },
];

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  onSkipAll,
  onLogout,
}) => {
  return (
    <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with logo and actions */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Vilo</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {currentStep < ONBOARDING_STEPS.COMPLETE && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkipAll}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Skip All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="py-6">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <React.Fragment key={step.key}>
                  {/* Step circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-200 font-medium
                        ${isCompleted
                          ? 'bg-primary text-white'
                          : isCurrent
                            ? 'bg-primary text-white ring-4 ring-primary/20'
                            : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`
                        mt-2 text-sm font-medium
                        ${isCurrent
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      `}
                    >
                      {ONBOARDING_STEP_LABELS[step.key]}
                    </span>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-16 sm:w-24 h-0.5 mx-2 -mt-6
                        ${currentStep > step.number
                          ? 'bg-primary'
                          : 'bg-gray-200 dark:bg-dark-border'
                        }
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default OnboardingHeader;
