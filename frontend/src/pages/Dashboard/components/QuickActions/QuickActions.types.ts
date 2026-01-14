import { QuickAction } from '../../Dashboard.types';

export interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 1 | 2 | 3 | 4;
  variant?: 'compact' | 'full';
  title?: string;
  className?: string;
}
