import React from 'react';

export interface AmountDisplayProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  isCredit?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const currencySymbols: Record<string, string> = {
  ZAR: 'R',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'ZAR',
  showSign = false,
  isCredit = false,
  size = 'md',
  className = '',
}) => {
  // Format amount with thousand separators
  const formatAmount = (value: number): string => {
    const absValue = Math.abs(value);
    return absValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Get currency symbol
  const currencySymbol = currencySymbols[currency.toUpperCase()] || currency;

  // Determine if amount is negative
  const isNegative = amount < 0 || isCredit;

  // Determine color class
  const getColorClass = (): string => {
    if (isNegative) {
      return 'text-error dark:text-error';
    }
    if (showSign && amount > 0) {
      return 'text-success dark:text-success';
    }
    return 'text-gray-900 dark:text-gray-100';
  };

  // Format sign
  const getSign = (): string => {
    if (!showSign && !isCredit) return '';
    if (isNegative) return '-';
    if (showSign && amount > 0) return '+';
    return '';
  };

  return (
    <span
      className={`
        inline-flex items-baseline font-medium tabular-nums
        ${sizeStyles[size]}
        ${getColorClass()}
        ${className}
      `}
    >
      {getSign()}
      {currencySymbol}
      {formatAmount(amount)}
    </span>
  );
};
