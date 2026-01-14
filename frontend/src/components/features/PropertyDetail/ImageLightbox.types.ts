/**
 * ImageLightbox Types
 */

export interface ImageLightboxProps {
  images: Array<{ url: string; caption?: string }>;
  initialIndex?: number;
  onClose: () => void;
}
