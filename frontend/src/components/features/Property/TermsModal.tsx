/**
 * TermsModal Component
 * Reusable modal for displaying property Terms & Conditions
 * Used in: Property listing, Booking wizards
 */

import React from 'react';
import { Modal, Button } from '@/components/ui';
import { HiOutlineDownload } from 'react-icons/hi';

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termsHtml: string;
  propertyName: string;
  propertyId: string;
  showDownload?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  termsHtml,
  propertyName,
  propertyId,
  showDownload = true,
}) => {
  const handleDownloadPDF = () => {
    // Open PDF in new tab (will trigger download)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.open(`${apiUrl}/api/properties/${propertyId}/terms/pdf`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Terms & Conditions - ${propertyName}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Terms Content */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border"
          dangerouslySetInnerHTML={{ __html: termsHtml }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <HiOutlineDownload className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
