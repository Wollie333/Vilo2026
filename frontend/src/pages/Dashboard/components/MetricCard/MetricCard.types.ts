import { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: number | string;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  href?: string;
  className?: string;
}
