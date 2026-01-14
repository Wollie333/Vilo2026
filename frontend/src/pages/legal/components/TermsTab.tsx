/**
 * TermsTab
 *
 * Terms and Conditions editor tab.
 * Allows admins to edit the terms of service text.
 */

import React from 'react';
import { Card, Alert } from '@/components/ui';

const DocumentTextIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const TermsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Terms & Conditions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the terms of service for your platform
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card variant="bordered">
        <Card.Body className="py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Terms Editor Coming Soon
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              This feature will allow you to create and manage your platform's terms and conditions,
              privacy policy, and other legal documents.
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Info Alert */}
      <Alert variant="info">
        <p className="text-sm">
          <strong>Note:</strong> Until this feature is available, you can manage your legal documents
          through your website's content management system or contact support for assistance.
        </p>
      </Alert>
    </div>
  );
};
