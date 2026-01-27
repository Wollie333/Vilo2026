/**
 * Preview Modal Component
 *
 * Displays a preview of the rendered email template with variables replaced by example values.
 */

import React from 'react';
import { Modal, Button } from '@/components/ui';
import { HiOutlineX } from 'react-icons/hi';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  htmlBody: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, subject, htmlBody }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Email Preview
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <HiOutlineX className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Subject Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject Line
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {subject}
            </p>
          </div>
        </div>

        {/* HTML Body Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Body
          </label>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            {/* Email Frame */}
            <div className="bg-white dark:bg-gray-900 p-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border-l-4 border-blue-500">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This is a preview using example variable values. Actual emails will use real data when sent.
          </p>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Close Preview
        </Button>
      </div>
    </Modal>
  );
};
