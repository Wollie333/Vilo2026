import type { PropertyWithCompany } from '@/types/property.types';

export interface ListingPreviewCardProps {
  property: Partial<PropertyWithCompany> | null;
  loading?: boolean;
  className?: string;
}
