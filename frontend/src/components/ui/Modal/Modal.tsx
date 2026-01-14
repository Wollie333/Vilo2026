import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps } from './Modal.types';

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

const CloseIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  showCloseButton = true,
  className = '',
}) => {
  // Check if custom background is applied (e.g., bg-primary)
  const hasColoredBg = className.includes('bg-');

  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b ${hasColoredBg ? 'border-transparent' : 'border-gray-200 dark:border-dark-border'} ${className}`}>
      <h2 className={`text-sm font-semibold ${hasColoredBg ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {children}
      </h2>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-md transition-colors ${
            hasColoredBg
              ? 'text-white/80 hover:text-white hover:bg-white/10'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-cardHover'
          }`}
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => (
  <div className={`px-5 py-3 ${className}`}>{children}</div>
);

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => (
  <div
    className={`px-5 py-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg rounded-b-md ${className}`}
  >
    {children}
  </div>
);

export const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
} = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
  headerClassName,
}) => {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        onClick={handleOverlayClick}
      />

      {/* Modal container */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        {/* Modal panel */}
        <div
          className={`
            relative w-full ${sizeStyles[size]}
            bg-white dark:bg-dark-card
            rounded-md shadow-lg
            transform transition-all
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <ModalHeader onClose={onClose} showCloseButton={showCloseButton} className={headerClassName}>
              <span id="modal-title">{title}</span>
            </ModalHeader>
          )}

          <ModalBody>{children}</ModalBody>

          {footer && <ModalFooter>{footer}</ModalFooter>}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
