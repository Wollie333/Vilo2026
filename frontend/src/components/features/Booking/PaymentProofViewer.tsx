/**
 * PaymentProofViewer Component
 *
 * Displays uploaded payment proof with option to view full-screen
 */

import React, { useState } from 'react';
import type { PaymentProofViewerProps } from './PaymentProofViewer.types';

// Icons
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

const ZoomInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
    />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
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

export const PaymentProofViewer: React.FC<PaymentProofViewerProps> = ({
  proofUrl,
  fileName,
  uploadedAt,
  isVerified = false,
  verifiedAt,
  verifiedBy,
  rejectionReason,
  allowFullScreen = true,
  className = '',
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Determine if it's a PDF or image
  const isPDF = proofUrl.toLowerCase().includes('.pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = !isPDF;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle download
  const handleDownload = () => {
    window.open(proofUrl, '_blank');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Payment Proof
        </h3>

        {isVerified && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
            <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Verified
            </span>
          </div>
        )}

        {rejectionReason && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
            <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">
              Rejected
            </span>
          </div>
        )}
      </div>

      {/* Upload info */}
      {uploadedAt && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span>Uploaded: {formatTimestamp(uploadedAt)}</span>
          {fileName && <span className="ml-2">• {fileName}</span>}
        </div>
      )}

      {/* Verification info */}
      {isVerified && verifiedAt && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span>Verified: {formatTimestamp(verifiedAt)}</span>
          {verifiedBy && <span className="ml-2">by {verifiedBy}</span>}
        </div>
      )}

      {/* Rejection reason */}
      {rejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
            Rejection Reason
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300">
            {rejectionReason}
          </p>
        </div>
      )}

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-dark-card">
        {isImage ? (
          <div className="relative group">
            <img
              src={proofUrl}
              alt="Payment proof"
              className="w-full h-auto max-h-96 object-contain cursor-pointer"
              onClick={() => allowFullScreen && setIsLightboxOpen(true)}
            />
            {allowFullScreen && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-medium shadow-lg flex items-center gap-2"
                >
                  <ZoomInIcon className="w-5 h-5" />
                  View Full Size
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <DocumentIcon className="w-16 h-16 text-red-600 dark:text-red-400 mb-4" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {fileName || 'Payment Proof Document'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              PDF Document
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Open PDF
            </button>
          </div>
        )}

        {/* Download button for images */}
        {isImage && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Download Image
            </button>
          </div>
        )}
      </div>

      {/* Lightbox for full-screen viewing */}
      {isLightboxOpen && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <img
            src={proofUrl}
            alt="Payment proof - full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
