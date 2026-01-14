/**
 * PaymentProofBadge Component
 *
 * Displays payment proof verification status with appropriate icon and color
 */

import React from 'react';
import type { PaymentProofBadgeProps } from './PaymentProofBadge.types';

// Icons
const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const statusConfig = {
  pending: {
    icon: ClockIcon,
    label: 'Pending Verification',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
  },
  verified: {
    icon: CheckCircleIcon,
    label: 'Verified',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
  rejected: {
    icon: XCircleIcon,
    label: 'Rejected',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  none: {
    icon: () => null,
    label: 'No Proof',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-700',
  },
};

export const PaymentProofBadge: React.FC<PaymentProofBadgeProps> = ({
  status,
  compact = false,
  uploadedAt,
  verifiedAt,
  rejectionReason,
  className = '',
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === 'none') {
    return null;
  }

  if (compact) {
    // Compact mode - icon only with tooltip
    return (
      <div
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.bg} ${config.text} ${className}`}
        title={config.label}
      >
        <Icon />
      </div>
    );
  }

  // Full badge with label
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon />
      <span>{config.label}</span>
      {uploadedAt && !verifiedAt && (
        <span className="text-[10px] opacity-75">
          {new Date(uploadedAt).toLocaleDateString()}
        </span>
      )}
      {verifiedAt && (
        <span className="text-[10px] opacity-75">
          {new Date(verifiedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

export default PaymentProofBadge;
