/**
 * SkipModal Component
 *
 * Confirmation dialog for skipping all onboarding steps
 */

import React from 'react';
import { Button, Modal } from '@/components/ui';

interface SkipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SkipModal: React.FC<SkipModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Skip Onboarding?"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to skip the onboarding process? You can always complete your profile, add companies, and properties later from your settings.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Incomplete profile
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Some features may be limited until you complete your profile setup.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Continue Setup
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Skip Anyway
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SkipModal;
