import React, { useRef, useState } from 'react';
import { Spinner } from '../Spinner';
import type { GalleryUploadProps } from './GalleryUpload.types';
import type { GalleryImage } from '@/types/property.types';

// Icons
const PlusIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-white'}`}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

export const GalleryUpload: React.FC<GalleryUploadProps> = ({
  images,
  featuredImageUrl,
  onImagesChange,
  onFeaturedChange,
  onUpload,
  maxImages = 10,
  disabled = false,
  isUploading = false,
  onFeaturedSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUpload = images.length < maxImages && !disabled && !isUploading && !uploadProgress;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate and filter files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
      } else if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 5MB)`);
      } else {
        validFiles.push(file);
      }
    }

    // Check max limit
    const remainingSlots = maxImages - images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      errors.push(`Only ${remainingSlots} more image(s) can be added`);
    }

    if (filesToUpload.length === 0) {
      if (errors.length > 0) {
        setError(errors.join('. '));
      }
      return;
    }

    setError(errors.length > 0 ? errors.join('. ') : null);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    let completedCount = 0;

    // Upload files concurrently
    const uploadPromises = filesToUpload.map(async (file, index) => {
      try {
        const imageUrl = await onUpload(file);
        completedCount++;
        setUploadProgress({ current: completedCount, total: filesToUpload.length });
        return {
          url: imageUrl,
          caption: '',
          order: images.length + index,
        } as GalleryImage;
      } catch {
        completedCount++;
        setUploadProgress({ current: completedCount, total: filesToUpload.length });
        return null; // Failed upload
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((img): img is GalleryImage => img !== null);

      if (successfulUploads.length > 0) {
        // Reorder based on actual upload completion
        const reorderedImages: GalleryImage[] = successfulUploads.map((img, i) => ({
          url: img.url,
          caption: img.caption,
          order: images.length + i,
        }));

        const updatedImages = [...images, ...reorderedImages];
        onImagesChange(updatedImages);

        // If these are the first images, set first one as featured
        if (images.length === 0 && !featuredImageUrl && reorderedImages.length > 0) {
          onFeaturedChange(reorderedImages[0].url);
        }
      }

      const failedCount = filesToUpload.length - successfulUploads.length;
      if (failedCount > 0) {
        setError(`${failedCount} image(s) failed to upload`);
      }
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = (index: number) => {
    const imageToDelete = images[index];
    const updatedImages = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));

    onImagesChange(updatedImages);

    // If the deleted image was featured, clear featured or set to first remaining image
    if (imageToDelete.url === featuredImageUrl) {
      onFeaturedChange(updatedImages.length > 0 ? updatedImages[0].url : null);
    }
  };

  const handleSetFeatured = async (url: string) => {
    // Don't re-save if already featured
    if (url === featuredImageUrl) return;

    onFeaturedChange(url);

    // Auto-save if callback provided
    if (onFeaturedSave) {
      try {
        await onFeaturedSave(url);
      } catch {
        setError('Failed to save featured image');
      }
    }
  };

  const handleUploadClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Existing images */}
        {images.map((image, index) => {
          const isFeatured = image.url === featuredImageUrl;

          return (
            <div
              key={image.url}
              className={`relative aspect-square rounded-lg overflow-hidden group ${
                isFeatured
                  ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-dark-bg'
                  : ''
              }`}
            >
              <img
                src={image.url}
                alt={image.caption || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Set as featured button */}
                <button
                  type="button"
                  onClick={() => handleSetFeatured(image.url)}
                  className={`p-2 rounded-full transition-colors ${
                    isFeatured
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={isFeatured ? 'Featured image' : 'Set as featured'}
                  disabled={disabled}
                >
                  <StarIcon filled={isFeatured} />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  title="Delete image"
                  disabled={disabled}
                >
                  <TrashIcon />
                </button>
              </div>

              {/* Featured badge */}
              {isFeatured && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
                  Featured
                </div>
              )}
            </div>
          );
        })}

        {/* Uploading placeholder with progress */}
        {uploadProgress && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-2">
            <Spinner size="md" />
            <span className="text-sm font-medium text-primary">
              {uploadProgress.current}/{uploadProgress.total}
            </span>
          </div>
        )}

        {/* Upload button */}
        {canUpload && !uploadProgress && (
          <button
            type="button"
            onClick={handleUploadClick}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-border transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <PlusIcon />
            <span className="text-sm">Upload</span>
          </button>
        )}
      </div>

      {/* Hidden file input - supports multiple selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canUpload}
        multiple
      />

      {/* Helper text */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <ImageIcon />
          <span>
            {images.length}/{maxImages} images
          </span>
        </div>
        <span>Click the star to set featured image</span>
      </div>
    </div>
  );
};
