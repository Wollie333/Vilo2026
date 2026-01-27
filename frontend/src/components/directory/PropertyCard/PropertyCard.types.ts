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
  /** Custom click handler - overrides default navigation to public page */
  onCardClick?: (property: PublicPropertySummary) => void;
}
