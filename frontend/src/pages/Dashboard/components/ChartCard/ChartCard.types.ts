import { ReactNode } from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
  actions?: ReactNode;
  className?: string;
}
