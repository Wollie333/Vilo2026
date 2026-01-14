/**
 * BookingProgressSidebar Component
 *
 * Dark sidebar with progress steps for the booking wizard.
 * Matches the onboarding design pattern.
 */

import React from 'react';
import { LogoIcon } from '@/components/ui/Logo';
import type { BookingProgressSidebarProps, BookingStepConfig } from '../CreateBookingPage.types';

// ============================================================================
// Icons
// ============================================================================

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ClipboardCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    />
  </svg>
);

// ============================================================================
// Step Configuration
// ============================================================================

const BOOKING_STEPS: BookingStepConfig[] = [
  {
    key: 'property-dates',
    number: 0,
    icon: BuildingIcon,
    label: 'Select Property',
    description: 'Choose property and dates',
  },
  {
    key: 'rooms',
    number: 1,
    icon: BedIcon,
    label: 'Select Rooms',
    description: 'Pick rooms for guests',
  },
  {
    key: 'addons',
    number: 2,
    icon: GiftIcon,
    label: 'Add-ons',
    description: 'Optional extras',
  },
  {
    key: 'guest-info',
    number: 3,
    icon: UserIcon,
    label: 'Guest Details',
    description: 'Enter guest information',
  },
  {
    key: 'review',
    number: 4,
    icon: ClipboardCheckIcon,
    label: 'Review & Confirm',
    description: 'Confirm booking details',
  },
];

// ============================================================================
// Progress Step Component
// ============================================================================

const ProgressStep: React.FC<{
  step: BookingStepConfig;
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
            ${
              isCompleted
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
          {step.label}
        </h4>
        <p className={`text-sm ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
          {step.description}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BookingProgressSidebar: React.FC<BookingProgressSidebarProps> = ({
  currentStep,
  onCancelClick,
}) => {
  return (
    <div className="lg:w-[320px] xl:w-[360px] bg-gray-950 p-6 lg:p-8 flex flex-col relative overflow-hidden flex-shrink-0">
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

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create Booking</h1>
          <p className="text-gray-400">Add a new booking in a few simple steps.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex-1">
          <div className="space-y-0">
            {BOOKING_STEPS.map((step, index) => (
              <ProgressStep
                key={step.key}
                step={step}
                isCompleted={currentStep > step.number}
                isCurrent={currentStep === step.number}
                isLast={index === BOOKING_STEPS.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-auto pt-6">
          <button
            onClick={onCancelClick}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Cancel booking</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingProgressSidebar;
