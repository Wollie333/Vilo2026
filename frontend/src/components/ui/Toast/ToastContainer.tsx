/**
 * Toast Container Component
 * FEATURE-03: Notification System
 *
 * Container that positions and stacks multiple toasts.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import type { ToastContainerProps, ToastData } from './Toast.types';
import type { ToastPosition } from '@/types/notification.types';

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

interface ToastContainerInternalProps extends ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerInternalProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
  maxToasts = 5,
}) => {
  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  // Determine stack direction based on position
  const isTop = position.startsWith('top');
  const stackClasses = isTop ? 'flex-col' : 'flex-col-reverse';

  const container = (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className={`
        fixed z-50 pointer-events-none
        ${positionStyles[position]}
      `}
    >
      <div className={`flex ${stackClasses} gap-3`}>
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            position={position}
          />
        ))}
      </div>
    </div>
  );

  // Render in portal to ensure toasts appear above everything
  return createPortal(container, document.body);
};

export default ToastContainer;
