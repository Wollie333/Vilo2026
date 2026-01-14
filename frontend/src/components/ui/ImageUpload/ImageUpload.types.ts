/**
 * ImageUpload Component Types
 */

export type ImageUploadShape = 'circle' | 'square' | 'rectangle';
export type ImageUploadSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ImageUploadProps {
  /** Current image URL */
  value?: string | null;
  /** Callback when image is uploaded */
  onUpload: (file: File) => Promise<void>;
  /** Callback when image is deleted */
  onDelete?: () => Promise<void>;
  /** Shape of the upload area */
  shape?: ImageUploadShape;
  /** Size of the upload area */
  size?: ImageUploadSize;
  /** Placeholder text when no image */
  placeholder?: string;
  /** Helper text shown below the upload area */
  helperText?: string;
  /** Label for the upload area */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Accepted file types (default: image/*) */
  accept?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show delete button */
  showDelete?: boolean;
  /** Alt text for the image */
  alt?: string;
}
