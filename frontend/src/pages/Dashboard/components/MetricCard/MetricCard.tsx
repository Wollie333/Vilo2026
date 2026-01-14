import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { MetricCardProps } from './MetricCard.types';

const variantStyles = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconText: 'text-gray-600 dark:text-gray-400',
  },
  primary: {
    iconBg: 'bg-primary/10 dark:bg-primary/20',
    iconText: 'text-primary',
  },
  success: {
    iconBg: 'bg-success-light dark:bg-success/20',
    iconText: 'text-success dark:text-success',
  },
  warning: {
    iconBg: 'bg-warning-light dark:bg-warning/20',
    iconText: 'text-warning dark:text-warning',
  },
  error: {
    iconBg: 'bg-error-light dark:bg-error/20',
    iconText: 'text-error dark:text-error',
  },
  info: {
    iconBg: 'bg-info-light dark:bg-info/20',
    iconText: 'text-info dark:text-info',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  variant = 'default',
  href,
  className = '',
}) => {
  const styles = variantStyles[variant];

  const content = (
    <Card variant="bordered" className={`h-full ${className}`}>
      <Card.Body className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs font-medium ${
                    change.isPositive
                      ? 'text-success dark:text-success'
                      : 'text-error dark:text-error'
                  }`}
                >
                  {change.isPositive ? '+' : ''}
                  {change.value}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {change.period}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${styles.iconBg}`}
            >
              <span className={styles.iconText}>{icon}</span>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
