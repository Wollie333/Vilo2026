import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../Card';

export type StatCardVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: StatCardVariant;
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

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'primary',
  link,
  linkText,
  trend,
  className = '',
}) => {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
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
          <div className={`p-3 rounded-full ${iconBgStyles[variant]}`}>{icon}</div>
        </div>
      </div>
    </Card>
  );
};
