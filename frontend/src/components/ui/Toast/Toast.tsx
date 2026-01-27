/**
 * Toast Component
 * FEATURE-03: Notification System
 *
 * Individual toast notification with auto-dismiss, pause on hover, and actions.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ToastProps } from './Toast.types';
import type { ToastPosition } from '@/types/notification.types';

const variantStyles = {
  info: {
    container: 'bg-info text-white',
    icon: 'text-white',
  },
  success: {
    container: 'bg-success text-white',
    icon: 'text-white',
  },
  warning: {
    container: 'bg-warning text-white',
    icon: 'text-white',
  },
  error: {
    container: 'bg-error text-white',
    icon: 'text-white',
  },
};

const InfoIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const defaultIcons = {
  info: <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

const getAnimationClass = (position: ToastPosition, isExiting: boolean): string => {
  if (isExiting) {
    if (position.includes('right')) return 'animate-toast-out-right';
    if (position.includes('left')) return 'animate-toast-out-left';
    return 'animate-toast-out-right';
  }

  if (position.includes('right')) return 'animate-toast-in-right';
  if (position.includes('left')) return 'animate-toast-in-left';
  if (position.startsWith('top')) return 'animate-toast-in-top';
  return 'animate-toast-in-bottom';
};

export const Toast: React.FC<ToastProps> = ({
  toast,
  onDismiss,
  position = 'top-right',
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(toast.duration || 5000);
  const startTimeRef = useRef<number>(Date.now());

  const { variant = 'info', title, message, dismissible = true, action } = toast;
  const styles = variantStyles[variant];
  const icon = defaultIcons[variant];

  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    // Wait for exit animation
    setTimeout(() => {
      toast.onDismiss?.();
      onDismiss(toast.id);
    }, 200);
  }, [isExiting, onDismiss, toast]);

  const startTimer = useCallback(() => {
    if (remainingTimeRef.current <= 0) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingTimeRef.current);
  }, [handleDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      // Calculate remaining time
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.duration, startTimer]);

  useEffect(() => {
    if (isPaused) {
      pauseTimer();
    } else if (toast.duration && toast.duration > 0) {
      startTimer();
    }
  }, [isPaused, pauseTimer, startTimer, toast.duration]);

  const handleMouseEnter = () => {
    if (toast.duration && toast.duration > 0) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (toast.duration && toast.duration > 0) {
      setIsPaused(false);
    }
  };

  const handleActionClick = () => {
    action?.onClick();
    handleDismiss();
  };

  const animationClass = getAnimationClass(position, isExiting);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        pointer-events-auto w-80 max-w-sm rounded-lg shadow-lg overflow-hidden
        ${styles.container}
        ${animationClass}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icon}</div>

          <div className="ml-3 flex-1 pt-0.5">
            <p className="text-sm font-medium">{title}</p>
            {message && (
              <p className="mt-1 text-sm opacity-90">{message}</p>
            )}
            {action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="text-sm font-medium underline hover:opacity-80 focus:outline-none"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {dismissible && (
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && !isPaused && !isExiting && (
        <div className="h-1 bg-white/30">
          <div
            className="h-full bg-white/50 transition-none"
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// Add CSS for the shrink animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
if (!document.querySelector('style[data-toast-animation]')) {
  style.setAttribute('data-toast-animation', 'true');
  document.head.appendChild(style);
}

export default Toast;
