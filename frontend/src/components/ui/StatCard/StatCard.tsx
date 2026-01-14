import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../Card';

export type StatCardVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
export type StatCardSize = 'sm' | 'md' | 'lg';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: StatCardVariant;
  size?: StatCardSize;
  link?: string;
  linkText?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const iconBgStyles: Record<StatCardVariant, string> = {
  primary: 'bg-primary text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  error: 'bg-error text-white',
  info: 'bg-info text-white',
  default: 'bg-gray-500 text-white',
};

const iconContainerPaddingStyles: Record<StatCardSize, string> = {
  sm: 'p-2',      // 8px padding
  md: 'p-2.5',    // 10px padding
  lg: 'p-3',      // 12px padding
};

const cardPaddingStyles: Record<StatCardSize, string> = {
  sm: 'p-4',      // 16px
  md: 'p-5',      // 20px
  lg: 'p-6',      // 24px
};

const valueFontSizeStyles: Record<StatCardSize, string> = {
  sm: 'text-2xl',   // Smaller for compact cards
  md: 'text-2xl',   // Balanced size
  lg: 'text-3xl',   // Current large size
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'primary',
  size = 'md',
  link,
  linkText,
  trend,
  className = '',
}) => {
  // Clone the icon element and add size classes
  const sizedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        className: size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6',
      } as any)
    : icon;

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className={cardPaddingStyles[size]}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className={`${valueFontSizeStyles[size]} font-bold text-gray-900 dark:text-white mt-1`}>
              {value}
            </p>
            {trend && (
              <div className="flex items-center mt-2">
                <span
                  className={`text-sm font-medium ${
                    trend.isPositive ? 'text-success' : 'text-error'
                  }`}
                >
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
              </div>
            )}
            {link && linkText && (
              <Link
                to={link}
                className="text-sm text-primary hover:text-primary-dark mt-2 inline-block"
              >
                {linkText} &rarr;
              </Link>
            )}
          </div>
          <div className={`${iconContainerPaddingStyles[size]} rounded-full ${iconBgStyles[variant]}`}>
            {sizedIcon}
          </div>
        </div>
      </div>
    </Card>
  );
};
