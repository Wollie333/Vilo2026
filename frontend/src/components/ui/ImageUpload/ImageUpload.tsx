/**
 * ImageUpload Component
 *
 * A reusable image upload component with preview, loading state, and delete functionality.
 */

import React, { useRef, useState } from 'react';
import { Spinner } from '../Spinner';
import type { ImageUploadProps, ImageUploadSize, ImageUploadShape } from './ImageUpload.types';

// Size configurations
const sizeStyles: Record<ImageUploadSize, { container: string; icon: string }> = {
  sm: { container: 'h-20 w-20', icon: 'w-6 h-6' },
  md: { container: 'h-32 w-32', icon: 'w-8 h-8' },
  lg: { container: 'h-40 w-40', icon: 'w-10 h-10' },
  xl: { container: 'h-48 w-48', icon: 'w-12 h-12' },
};

// Rectangle size configurations (for featured images)
const rectangleSizeStyles: Record<ImageUploadSize, { container: string; icon: string }> = {
  sm: { container: 'h-24 w-40', icon: 'w-6 h-6' },
  md: { container: 'h-32 w-56', icon: 'w-8 h-8' },
  lg: { container: 'h-40 w-72', icon: 'w-10 h-10' },
  xl: { container: 'h-48 w-full max-w-md', icon: 'w-12 h-12' },
};

// Shape configurations
const shapeStyles: Record<ImageUploadShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-lg',
  rectangle: 'rounded-lg',
};

// Camera icon
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Upload icon
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

// Trash icon
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onUpload,
  onDelete,
  shape = 'square',
  size = 'md',
  placeholder,
  helperText,
  label,
  disabled = false,
  loading = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = 'image/*',
  className = '',
  showDelete = true,
  alt = 'Uploaded image',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isLoading = loading || isUploading;
  const hasImage = Boolean(value);

  // Get size styles based on shape
  const getSizeStyles = () => {
    if (shape === 'rectangle') {
      return rectangleSizeStyles[size];
    }
    return sizeStyles[size];
  };

  const currentSizeStyles = getSizeStyles();

  const handleClick = () => {
    if (!disabled && !isLoading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);

    // Reset input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      setError(`Image must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || disabled || isLoading) return;

    setIsUploading(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden
          ${currentSizeStyles.container}
          ${shapeStyles[shape]}
          ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2'
          }
          ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${
            hasImage
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600'
          }
          transition-all focus:outline-none
          group
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={hasImage ? 'Change image' : 'Upload image'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Image preview */}
        {hasImage && !isLoading && (
          <>
            <img
              src={value!}
              alt={alt}
              className={`w-full h-full object-cover ${shapeStyles[shape]}`}
            />
            {/* Hover overlay */}
            <div
              className={`
                absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40
                ${shapeStyles[shape]}
                transition-all flex items-center justify-center
              `}
            >
              <CameraIcon className={`${currentSizeStyles.icon} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          </>
        )}

        {/* Empty state */}
        {!hasImage && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <UploadIcon className={`${currentSizeStyles.icon} text-gray-400 dark:text-gray-500 mb-2`} />
            {placeholder && (
              <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {placeholder}
              </span>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
            <Spinner size="md" />
          </div>
        )}

        {/* Delete button */}
        {hasImage && showDelete && onDelete && !isLoading && !disabled && (
          <button
            onClick={handleDelete}
            className={`
              absolute top-1 right-1
              p-1.5 rounded-full
              bg-red-500 hover:bg-red-600
              text-white shadow-lg
              opacity-0 group-hover:opacity-100
              transition-all
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            `}
            type="button"
            aria-label="Delete image"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Helper text or error */}
      {(helperText || error) && (
        <p className={`text-xs ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
