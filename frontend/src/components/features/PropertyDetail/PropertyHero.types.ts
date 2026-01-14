/**
 * PropertyHero Types
 */

export interface PropertyHeroProps {
  images: Array<{ url: string; caption?: string; order?: number }>;
  featuredImage: string | null;
  propertyName: string;
  onViewAllPhotos: () => void;
  onShare?: () => void;
  onWishlistToggle?: () => void;
  isInWishlist?: boolean;
}
