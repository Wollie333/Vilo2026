/**
 * PausedAccountModal Component
 *
 * Non-dismissible modal shown when a user's subscription is paused
 * Requires user to either pay their subscription or contact support
 */

import React from 'react';
import { Modal, Button } from '@/components/ui';
import type { PausedAccountModalProps } from './PausedAccountModal.types';

export const PausedAccountModal: React.FC<PausedAccountModalProps> = ({
  isOpen,
  pauseReason,
  pausedByAdmin,
  onPaySubscription,
  onContactSupport,
}) => {
  // Non-dismissible: empty onClose handler prevents closing
  const handleClose = () => {
    // Intentionally empty - modal cannot be closed without action
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <Modal.Body>
        <div className="py-4">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-500"
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
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
            Your Account is Paused
          </h2>

          {/* Message */}
          <div className="text-center space-y-3 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your subscription has been paused and your account is in read-only mode.
            </p>

            {pauseReason && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{pauseReason}</p>
              </div>
            )}

            {pausedByAdmin && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paused by: {pausedByAdmin.full_name}
              </p>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              To continue using all features, please reactivate your subscription or contact support for assistance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={onPaySubscription}
              className="w-full"
            >
              Pay Subscription
            </Button>
            <Button
              variant="outline"
              onClick={onContactSupport}
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
