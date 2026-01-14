/**
 * PropertyCard Component Types
 */

import type { PublicPropertySummary } from '@/types';

export interface PropertyCardProps {
  property: PublicPropertySummary;
  compact?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (propertyId: string) => void;
  className?: string;
}
