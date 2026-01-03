import React from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import type { ConfirmDialogProps, ConfirmDialogVariant } from './ConfirmDialog.types';

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: React.ReactNode; iconBg: string; buttonClass: string }
> = {
  danger: {
    icon: (
      <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    iconBg: 'bg-error-light dark:bg-error/20',
    buttonClass: 'bg-error hover:bg-error-dark focus:ring-error',
  },
  warning: {
    icon: (
      <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    iconBg: 'bg-warning-light dark:bg-warning/20',
    buttonClass: 'bg-warning hover:bg-warning-dark focus:ring-warning',
  },
  info: {
    icon: (
      <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    iconBg: 'bg-info-light dark:bg-info/20',
    buttonClass: 'bg-info hover:bg-info-dark focus:ring-info',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnOverlayClick={!isLoading}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            className={config.buttonClass}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
