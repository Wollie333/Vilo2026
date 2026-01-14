/**
 * WizardFooter Component
 *
 * Navigation buttons for booking wizard (Back / Continue)
 */

import React from 'react';
import { Button } from '@/components/ui';
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi';

interface WizardFooterProps {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  isLoading?: boolean;
  showBack?: boolean;
  continueDisabled?: boolean;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  isLoading = false,
  showBack = true,
  continueDisabled = false,
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-dark-border">
      {/* Back Button */}
      {showBack && onBack ? (
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back
        </Button>
      ) : (
        <div></div>
      )}

      {/* Continue Button */}
      <Button
        variant="primary"
        onClick={onContinue}
        disabled={continueDisabled || isLoading}
        isLoading={isLoading}
        className="flex items-center gap-2 px-8"
      >
        {continueLabel}
        {!isLoading && <HiArrowRight className="w-5 h-5" />}
      </Button>
    </div>
  );
};
