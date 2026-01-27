/**
 * BookingLinkButton Component
 *
 * Displays a link icon that opens a modal with options to either
 * visit the booking page or copy the booking link to clipboard.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import type { BookingLinkButtonProps } from './BookingLinkButton.types';

export const BookingLinkButton: React.FC<BookingLinkButtonProps> = ({
  propertySlug,
  propertyName,
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Generate booking URL
  const bookingUrl = `${window.location.origin}/accommodation/${propertySlug}/book`;
  const quoteUrl = `${window.location.origin}/accommodation/${propertySlug}#quote`;

  // Handle opening modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy booking link:', err);
    }
  };

  // Handle navigation to booking page
  const handleGoToBookingPage = () => {
    setIsModalOpen(false);
    navigate(`/accommodation/${propertySlug}/book`);
  };

  // Handle navigation to quote page
  const handleGoToQuotePage = () => {
    setIsModalOpen(false);
    navigate(`/accommodation/${propertySlug}#quote`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenModal();
    }
  };

  return (
    <>
      <div className="relative hidden md:flex">
        <button
          onClick={handleOpenModal}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={handleKeyDown}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
          aria-label="Booking page options"
          role="button"
          tabIndex={0}
        >
          {/* Link Icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>

          {/* Tooltip */}
          {isHovered && (
            <span className="absolute top-full mt-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Booking page
            </span>
          )}
        </button>
      </div>

      {/* Booking Options Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Property Links - ${propertyName}`}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose how you'd like to access the booking or quote page for {propertyName}
          </p>

          {/* Option 1: Go to Booking Page */}
          <button
            onClick={handleGoToBookingPage}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 dark:border-dark-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Go to Booking Page
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Open the booking page in this browser to preview or test the booking flow
              </p>
            </div>
          </button>

          {/* Option 2: Go to Quote Page */}
          <button
            onClick={handleGoToQuotePage}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 dark:border-dark-border rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
          >
            <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Go to Quote Page
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Open the quote request form for guests who want custom pricing
              </p>
            </div>
          </button>

          {/* Option 3: Copy Link */}
          <button
            onClick={handleCopyLink}
            disabled={showCopied}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 dark:border-dark-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
          >
            <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              {showCopied ? (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {showCopied ? 'Link Copied!' : 'Copy Booking Link'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {showCopied
                  ? 'The booking link has been copied to your clipboard'
                  : 'Copy the booking page URL to share with customers or use elsewhere'}
              </p>
            </div>
          </button>

          {/* URL Display */}
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking URL:</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {bookingUrl}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quote Page URL:</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {quoteUrl}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
