/**
 * PropertyHeader Types
 */

export interface PropertyHeaderProps {
  name: string;
  listingTitle: string | null;
  propertyType: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  overallRating: number | null;
  reviewCount: number;
  categories: string[];
}
