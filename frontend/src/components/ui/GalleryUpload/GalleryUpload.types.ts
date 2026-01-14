import type { GalleryImage } from '@/types/property.types';

export interface GalleryUploadProps {
  /** Array of gallery images */
  images: GalleryImage[];
  /** Currently featured image URL */
  featuredImageUrl: string | null;
  /** Callback when images array changes */
  onImagesChange: (images: GalleryImage[]) => void;
  /** Callback when featured image changes */
  onFeaturedChange: (url: string | null) => void;
  /** Function to upload a file, returns the URL */
  onUpload: (file: File) => Promise<string>;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether an upload is in progress */
  isUploading?: boolean;
  /** Callback to auto-save when featured image changes */
  onFeaturedSave?: (url: string) => Promise<void>;
}
