/**
 * PaymentProofUpload Component
 *
 * Handles payment proof file uploads for EFT bookings.
 * Supports PDF, JPG, PNG, and WebP files up to 5MB.
 */

import React, { useRef, useState } from 'react';
import { supabase } from '@/config/supabase';
import { bookingService } from '@/services';
import type { PaymentProofUploadProps, UploadedFileInfo } from './PaymentProofUpload.types';

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Icons
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

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

export const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({
  bookingId,
  onUploadSuccess,
  onUploadError,
  className = '',
  disabled = false,
  showInstructions = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return 'Invalid file type. Only PDF, JPG, PNG, and WebP files are allowed.';
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must not exceed ${formatFileSize(MAX_FILE_SIZE)}.`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    setError(null);
    setUploadSuccess(false);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (onUploadError) {
        onUploadError(validationError);
      }
      return;
    }

    // Create preview for images
    let preview: string | null = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    // Set selected file
    setSelectedFile({
      file,
      preview,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
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

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    setError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Upload file to Supabase Storage
      const fileName = `${bookingId}/${Date.now()}_${selectedFile.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, selectedFile.file, {
          contentType: selectedFile.file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(50);

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL');
      }

      setUploadProgress(75);

      // 3. Record upload in booking
      const uploadResponse = await bookingService.uploadPaymentProof(bookingId, {
        file_url: urlData.publicUrl,
        file_name: selectedFile.file.name,
        file_size: selectedFile.file.size,
        mime_type: selectedFile.file.type,
      });

      setUploadProgress(100);
      setUploadSuccess(true);

      // Callback
      if (onUploadSuccess) {
        onUploadSuccess({
          file_url: uploadResponse.payment_proof_url,
          file_name: selectedFile.file.name,
          payment_status: uploadResponse.payment_status,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload payment proof';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isPDF = selectedFile?.type === 'application/pdf';
  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      {showInstructions && !uploadSuccess && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Upload Payment Proof
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Accepted formats: PDF, JPG, PNG, WebP</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Upload your bank transfer receipt or payment screenshot</li>
            <li>• Your payment will be verified by the property owner</li>
          </ul>
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
              Payment proof uploaded successfully!
            </h4>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your payment is now awaiting verification by the property owner. You will be notified once it's verified.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-900 dark:text-red-100">Upload failed</h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!uploadSuccess && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {!selectedFile ? (
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8
                transition-all cursor-pointer
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800'}
                ${isUploading ? 'pointer-events-none' : ''}
              `}
              role="button"
              tabIndex={0}
              aria-label="Upload payment proof"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, JPG, PNG, or WebP (max 5MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {isImage && selectedFile.preview ? (
                    <img
                      src={selectedFile.preview}
                      alt="Payment proof preview"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : isPDF ? (
                    <div className="w-24 h-24 flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <DocumentIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <DocumentIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>

                  {/* Progress bar */}
                  {isUploading && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {!isUploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    type="button"
                    aria-label="Remove file"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Upload button */}
              {!isUploading && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleUpload}
                    disabled={disabled}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Upload Payment Proof
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
