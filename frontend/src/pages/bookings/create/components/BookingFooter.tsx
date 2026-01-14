/**
 * BookingFooter Component
 *
 * Navigation footer for the booking wizard steps.
 * Uses CTAButton for primary action.
 */

import React from 'react';
import { Button } from '@/components/ui';
import { CTAButton } from '@/components/ui/CTAButton';
import type { BookingFooterProps } from '../CreateBookingPage.types';

// ============================================================================
// Icons
// ============================================================================

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export const BookingFooter: React.FC<BookingFooterProps> = ({
  onCancel,
  onContinue,
  onBack,
  isLoading = false,
  showBack = false,
  cancelLabel = 'Cancel',
  continueLabel = 'Continue',
  continueDisabled = false,
  isFinalStep = false,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-8 mt-8 border-t border-gray-200 dark:border-dark-border">
      {/* Primary Action */}
      <CTAButton
        onClick={onContinue}
        loading={isLoading}
        loadingText={isFinalStep ? 'Creating...' : 'Loading...'}
        icon={isFinalStep ? <CheckIcon className="w-5 h-5" /> : <ArrowRightIcon className="w-5 h-5" />}
        iconPosition="right"
        variant="primary"
        fullWidth
        disabled={continueDisabled || isLoading}
        id="booking-continue-btn"
        dataAttributes={{
          'tracking-id': 'booking_continue',
          'tracking-category': 'booking',
        }}
      >
        {continueLabel}
      </CTAButton>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between">
        <div>
          {showBack && onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
};

export default BookingFooter;
