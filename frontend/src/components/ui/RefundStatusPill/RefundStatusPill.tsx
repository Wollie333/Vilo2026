import React from 'react';
import { HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineCheckCircle } from 'react-icons/hi';
import type { RefundRequest } from '@/types/refund.types';

export interface RefundStatusPillProps {
  refundStatus?: 'none' | 'partial' | 'full';
  activeRefunds?: RefundRequest[];
  onClick?: () => void;
}

export const RefundStatusPill: React.FC<RefundStatusPillProps> = ({
  refundStatus,
  activeRefunds,
  onClick,
}) => {
  // Don't render if no refund status or status is 'none'
  if (!refundStatus || refundStatus === 'none') {
    return null;
  }

  // Check if there are any active refunds
  const hasActiveRefund = activeRefunds?.some((r) =>
    ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
  );

  // Determine pill configuration based on status
  const getPillConfig = () => {
    if (hasActiveRefund) {
      return {
        color: 'orange',
        text: 'Refund Pending',
        icon: HiOutlineClock,
        bgClass: 'bg-orange-100 dark:bg-orange-900/20',
        textClass: 'text-orange-700 dark:text-orange-400',
        borderClass: 'border-orange-300 dark:border-orange-700',
      };
    }

    if (refundStatus === 'full') {
      return {
        color: 'green',
        text: 'Refunded',
        icon: HiOutlineCheckCircle,
        bgClass: 'bg-green-100 dark:bg-green-900/20',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-300 dark:border-green-700',
      };
    }

    // Partial refund
    return {
      color: 'yellow',
      text: 'Partially Refunded',
      icon: HiOutlineCurrencyDollar,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
      textClass: 'text-yellow-700 dark:text-yellow-400',
      borderClass: 'border-yellow-300 dark:border-yellow-700',
    };
  };

  const config = getPillConfig();
  const Icon = config.icon;

  const pillClasses = `
    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
    border transition-all
    ${config.bgClass}
    ${config.textClass}
    ${config.borderClass}
    ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
  `.trim();

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={pillClasses}
      type="button"
    >
      <Icon className="w-4 h-4" />
      <span>{config.text}</span>
    </button>
  );
};
