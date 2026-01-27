/**
 * LimitDisplay Component Types
 *
 * Display subscription limit usage with progress bar
 */

import type { LimitKey } from '@/utils/subscription-limits';

export interface LimitDisplayProps {
  /** The limit key being displayed */
  limitKey: LimitKey;
  /** Current usage */
  used: number;
  /** Maximum limit (null/-1/0 = unlimited) */
  limit: number | null | undefined;
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Show progress bar */
  showProgress?: boolean;
  /** Show warning message if near/at limit */
  showWarning?: boolean;
  /** Custom className */
  className?: string;
}
