/**
 * PolicyModal Component
 * Reusable modal for displaying property policies (Terms, Privacy, Refund, Cancellation)
 * Used in: Property listing, Booking wizards, Checkout flows
 */

import React from 'react';
import { Modal, Button } from '@/components/ui';
import { HiOutlineDownload, HiPrinter } from 'react-icons/hi';
import { formatPlainTextToHtml } from '@/utils/formatPlainTextToHtml';

export type PolicyType = 'terms' | 'privacy' | 'refund' | 'cancellation';

export interface CancellationPolicyData {
  id: string;
  name: string;
  description: string | null;
  tiers: Array<{ days: number; refund: number }>;
}

export interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyHtml?: string;
  policyType: PolicyType;
  propertyName: string;
  propertyId: string;
  showDownload?: boolean;
  // For cancellation policy
  cancellationPolicyData?: CancellationPolicyData;
}

const POLICY_TITLES: Record<PolicyType, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  refund: 'Refund Policy',
  cancellation: 'Cancellation Policy',
};

const POLICY_ENDPOINTS: Record<PolicyType, string> = {
  terms: 'terms',
  privacy: 'privacy-policy',
  refund: 'refund-policy',
  cancellation: 'cancellation-policy',
};

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  policyHtml,
  policyType,
  propertyName,
  propertyId,
  showDownload = true,
  cancellationPolicyData,
}) => {
  // Debug logging for cancellation policy data
  React.useEffect(() => {
    if (isOpen && policyType === 'cancellation') {
      console.log('📄 [PolicyModal] Cancellation Policy Modal Opened:', {
        isOpen,
        policyType,
        hasCancellationPolicyData: !!cancellationPolicyData,
        cancellationPolicyData,
        hasDescription: !!cancellationPolicyData?.description,
        hasTiers: !!cancellationPolicyData?.tiers,
        tiersIsArray: Array.isArray(cancellationPolicyData?.tiers),
        tiersCount: cancellationPolicyData?.tiers?.length || 0,
        tiers: cancellationPolicyData?.tiers,
      });
    }
  }, [isOpen, policyType, cancellationPolicyData]);

  const handleDownloadPDF = () => {
    // Open PDF in new tab (will trigger download)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const endpoint = POLICY_ENDPOINTS[policyType];
    window.open(`${apiUrl}/api/properties/${propertyId}/${endpoint}/pdf`, '_blank');
  };

  const handlePrint = () => {
    // Create print-friendly content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let printContent = '';

    if (policyType === 'cancellation' && cancellationPolicyData) {
      // Format cancellation policy for printing
      printContent = `
        <html>
          <head>
            <title>${cancellationPolicyData.name} - ${propertyName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { color: #047857; font-size: 28px; margin-bottom: 20px; }
              h2 { color: #047857; font-size: 22px; margin-top: 30px; margin-bottom: 15px; }
              .description { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .tier { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
              .refund-100 { background: #ecfdf5; border-color: #10b981; }
              .refund-50 { background: #fef9c3; border-color: #eab308; }
              .refund-0 { background: #fee2e2; border-color: #ef4444; }
              .note { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>${cancellationPolicyData.name}</h1>
            <p><strong>Property:</strong> ${propertyName}</p>
            ${cancellationPolicyData.description ? `<div class="description">${cancellationPolicyData.description}</div>` : ''}
            <h2>Refund Schedule</h2>
            ${cancellationPolicyData.tiers.sort((a, b) => b.days - a.days).map(tier => `
              <div class="tier refund-${tier.refund === 100 ? '100' : tier.refund >= 50 ? '50' : '0'}">
                <span>${tier.days === 0 ? 'Same day cancellation' : `Cancel ${tier.days}+ days before check-in`}</span>
                <strong>${tier.refund}% refund</strong>
              </div>
            `).join('')}
            <div class="note">
              <strong>Note:</strong> Refund percentages are calculated based on the number of days before your check-in date that you cancel. All refunds are processed within 5-10 business days.
            </div>
          </body>
        </html>
      `;
    } else {
      // Format HTML policy for printing with enhanced styling
      printContent = `
        <html>
          <head>
            <title>${POLICY_TITLES[policyType]} - ${propertyName}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 40px;
                line-height: 1.8;
                color: #1f2937;
                font-size: 16px;
              }
              h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #047857;
                margin-top: 0;
                margin-bottom: 1.5rem;
                padding-bottom: 0.75rem;
                border-bottom: 3px solid #047857;
                line-height: 1.3;
              }
              h2 {
                font-size: 1.5rem;
                font-weight: 600;
                color: #047857;
                margin-top: 2.5rem;
                margin-bottom: 1rem;
                line-height: 1.4;
              }
              h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #065f46;
                margin-top: 2rem;
                margin-bottom: 0.75rem;
                line-height: 1.4;
              }
              h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: #065f46;
                margin-top: 1.5rem;
                margin-bottom: 0.5rem;
              }
              p {
                margin-bottom: 1.25rem;
                line-height: 1.8;
              }
              ul, ol {
                margin-bottom: 1.5rem;
                padding-left: 2rem;
                line-height: 1.8;
              }
              li {
                margin-bottom: 0.75rem;
              }
              strong, b {
                font-weight: 700;
                color: #065f46;
              }
              em, i {
                font-style: italic;
                color: #4b5563;
              }
              a {
                color: #047857;
                text-decoration: underline;
                font-weight: 500;
              }
              blockquote {
                border-left: 4px solid #047857;
                padding-left: 1.5rem;
                margin: 1.5rem 0;
                font-style: italic;
                color: #4b5563;
                background: #f9fafb;
                padding: 1rem 1.5rem;
                border-radius: 0.375rem;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
                font-size: 0.95rem;
              }
              th, td {
                border: 1px solid #e5e7eb;
                padding: 0.75rem 1rem;
                text-align: left;
              }
              th {
                background: #f9fafb;
                font-weight: 600;
                color: #047857;
              }
              hr {
                border: none;
                border-top: 2px solid #e5e7eb;
                margin: 2rem 0;
              }
              code {
                background: #f3f4f6;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-family: monospace;
                font-size: 0.9em;
              }
              pre {
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 0.375rem;
                overflow-x: auto;
                margin: 1.5rem 0;
              }
            </style>
          </head>
          <body>
            <h1>${POLICY_TITLES[policyType]}</h1>
            <p><strong>Property:</strong> ${propertyName}</p>
            <hr>
            ${formattedPolicyHtml}
          </body>
        </html>
      `;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const title = policyType === 'cancellation' && cancellationPolicyData
    ? `${cancellationPolicyData.name} - ${propertyName}`
    : `${POLICY_TITLES[policyType]} - ${propertyName}`;

  // Format plain text to HTML if needed
  const formattedPolicyHtml = formatPlainTextToHtml(policyHtml);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="3xl"
    >
      <div className="space-y-4">
        {/* Policy Content */}
        {policyType === 'cancellation' ? (
          cancellationPolicyData ? (
          // Cancellation Policy Content
          <div className="space-y-4">
            {cancellationPolicyData.description && (
              <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
                <p className="text-gray-700 dark:text-gray-300">{cancellationPolicyData.description}</p>
              </div>
            )}

            {/* Refund Schedule */}
            {cancellationPolicyData.tiers && cancellationPolicyData.tiers.length > 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Refund Schedule
                </h3>
                <div className="space-y-3">
                  {cancellationPolicyData.tiers
                    .sort((a, b) => b.days - a.days)
                    .map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {tier.days === 0 ? 'Same day cancellation' : `Cancel ${tier.days}+ days before check-in`}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg font-bold text-lg ${
                          tier.refund === 100
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : tier.refund >= 50
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {tier.refund}% refund
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            ) : (
              // No tiers defined
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-700 dark:text-yellow-400">
                  This cancellation policy does not have a refund schedule defined. Please contact the property owner for cancellation terms.
                </p>
              </div>
            )}

            {/* Additional Info */}
            {cancellationPolicyData.tiers && cancellationPolicyData.tiers.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Refund percentages are calculated based on the number of days before your check-in date that you cancel. All refunds are processed within 5-10 business days.
                </p>
              </div>
            )}
          </div>
          ) : (
            // No Cancellation Policy Data - Fallback Message
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                No Cancellation Policy Assigned
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                This property does not currently have a cancellation policy assigned. Please contact the property owner for information about cancellation terms.
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Property Owner:</strong> Please assign a cancellation policy to this property in your property settings to inform guests about refund terms.
                </p>
              </div>
            </div>
          )
        ) : (
          // HTML Policy Content (Terms, Privacy, Refund) - Enhanced Styling
          <div className="max-h-[60vh] overflow-y-auto p-8 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border shadow-inner">
            <style>{`
              .policy-content {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 16px;
                line-height: 1.8;
                color: #1f2937;
              }
              .policy-content h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #047857;
                margin-top: 0;
                margin-bottom: 1.5rem;
                padding-bottom: 0.75rem;
                border-bottom: 3px solid #047857;
                line-height: 1.3;
              }
              .policy-content h2 {
                font-size: 1.5rem;
                font-weight: 600;
                color: #047857;
                margin-top: 2.5rem;
                margin-bottom: 1rem;
                line-height: 1.4;
              }
              .policy-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #065f46;
                margin-top: 2rem;
                margin-bottom: 0.75rem;
                line-height: 1.4;
              }
              .policy-content h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: #065f46;
                margin-top: 1.5rem;
                margin-bottom: 0.5rem;
              }
              .policy-content p {
                margin-bottom: 1.25rem;
                line-height: 1.8;
              }
              .policy-content ul, .policy-content ol {
                margin-bottom: 1.5rem;
                padding-left: 2rem;
                line-height: 1.8;
              }
              .policy-content li {
                margin-bottom: 0.75rem;
              }
              .policy-content strong, .policy-content b {
                font-weight: 700;
                color: #065f46;
              }
              .policy-content em, .policy-content i {
                font-style: italic;
                color: #4b5563;
              }
              .policy-content a {
                color: #047857;
                text-decoration: underline;
                font-weight: 500;
              }
              .policy-content a:hover {
                color: #065f46;
              }
              .policy-content blockquote {
                border-left: 4px solid #047857;
                padding-left: 1.5rem;
                margin: 1.5rem 0;
                font-style: italic;
                color: #4b5563;
                background: #f9fafb;
                padding: 1rem 1.5rem;
                border-radius: 0.375rem;
              }
              .policy-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
                font-size: 0.95rem;
              }
              .policy-content th, .policy-content td {
                border: 1px solid #e5e7eb;
                padding: 0.75rem 1rem;
                text-align: left;
              }
              .policy-content th {
                background: #f9fafb;
                font-weight: 600;
                color: #047857;
              }
              .policy-content hr {
                border: none;
                border-top: 2px solid #e5e7eb;
                margin: 2rem 0;
              }
              .policy-content code {
                background: #f3f4f6;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-family: monospace;
                font-size: 0.9em;
              }
              .policy-content pre {
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 0.375rem;
                overflow-x: auto;
                margin: 1.5rem 0;
              }

              /* Dark mode styles */
              .dark .policy-content {
                color: #e5e7eb;
              }
              .dark .policy-content h1,
              .dark .policy-content h2 {
                color: #10b981;
              }
              .dark .policy-content h3,
              .dark .policy-content h4 {
                color: #34d399;
              }
              .dark .policy-content strong,
              .dark .policy-content b {
                color: #34d399;
              }
              .dark .policy-content em,
              .dark .policy-content i {
                color: #9ca3af;
              }
              .dark .policy-content a {
                color: #10b981;
              }
              .dark .policy-content a:hover {
                color: #34d399;
              }
              .dark .policy-content blockquote {
                background: #1f2937;
                border-left-color: #10b981;
                color: #9ca3af;
              }
              .dark .policy-content th {
                background: #1f2937;
                color: #10b981;
              }
              .dark .policy-content td {
                border-color: #374151;
              }
              .dark .policy-content code,
              .dark .policy-content pre {
                background: #1f2937;
              }
            `}</style>
            <div
              className="policy-content"
              dangerouslySetInnerHTML={{ __html: formattedPolicyHtml }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2">
            {/* Print Button - Available for ALL policy types */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <HiPrinter className="w-4 h-4 mr-2" />
              Print
            </Button>

            {/* PDF Download - Only for Terms, Privacy, Refund (not Cancellation) */}
            {showDownload && policyType !== 'cancellation' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
              >
                <HiOutlineDownload className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>

          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
