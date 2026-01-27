/**
 * GuestPaymentStep Component
 *
 * Step 3: Collect guest information, create account, and process payment
 */

import React, { useState, useEffect } from 'react';
import { Input, Button, PasswordStrengthIndicator } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PolicyModal } from '@/components/features';
import { HiOutlineDownload, HiPrinter } from 'react-icons/hi';
import * as platformLegalService from '@/services/platform-legal.service';
import { formatPlainTextToHtml } from '@/utils/formatPlainTextToHtml';
import type { GuestDetails, PaymentProvider } from '@/types/booking-wizard.types';
import type { AvailablePaymentMethod } from '@/types/checkout.types';
import type { PlatformLegalDocument } from '@/types/platform-legal.types';

interface GuestPaymentStepProps {
  guestDetails: GuestDetails;
  paymentMethod: PaymentProvider | null;
  onGuestDetailsChange: (field: keyof GuestDetails, value: any) => void;
  onPaymentMethodChange: (method: PaymentProvider) => void;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromoCode: () => void;
  promoCodeStatus?: { type: 'success' | 'error' | 'applying'; message: string } | null;
  errors?: Record<string, string>;
  // Property policy data
  propertyTerms?: string | null;
  propertyCancellationPolicy?: { name: string; description: string; tiers: Array<{ days: number; refund: number }> } | null;
  propertyName?: string;
  propertyId?: string;
  // Available payment methods (from API)
  availablePaymentMethods?: AvailablePaymentMethod[];
}

export const GuestPaymentStep: React.FC<GuestPaymentStepProps> = ({
  guestDetails,
  paymentMethod,
  onGuestDetailsChange,
  onPaymentMethodChange,
  promoCode,
  onPromoCodeChange,
  onApplyPromoCode,
  promoCodeStatus,
  errors = {},
  propertyTerms,
  propertyCancellationPolicy,
  propertyName,
  propertyId,
  availablePaymentMethods = [],
}) => {
  // Property legal document modals
  const [showPropertyTermsModal, setShowPropertyTermsModal] = useState(false);
  const [showCancellationPolicyModal, setShowCancellationPolicyModal] = useState(false);

  // Platform legal document modals
  const [showPlatformTermsModal, setShowPlatformTermsModal] = useState(false);
  const [showPlatformPrivacyModal, setShowPlatformPrivacyModal] = useState(false);

  // Platform legal documents state
  const [platformTerms, setPlatformTerms] = useState<PlatformLegalDocument | null>(null);
  const [platformPrivacy, setPlatformPrivacy] = useState<PlatformLegalDocument | null>(null);
  const [loadingPlatformDocs, setLoadingPlatformDocs] = useState(true);

  // Load platform legal documents on mount
  useEffect(() => {
    console.log('🔍 [GuestPaymentStep] Component mounted - Props received:', {
      propertyName,
      propertyId,
      hasPropertyTerms: !!propertyTerms,
      propertyTermsLength: propertyTerms?.length,
      hasPropertyCancellationPolicy: !!propertyCancellationPolicy,
      propertyCancellationPolicyType: typeof propertyCancellationPolicy,
      propertyCancellationPolicyValue: propertyCancellationPolicy,
      propertyCancellationPolicyJSON: JSON.stringify(propertyCancellationPolicy, null, 2)
    });

    const loadPlatformDocs = async () => {
      try {
        const [terms, privacy] = await Promise.all([
          platformLegalService.getActiveDocumentByType('terms_of_service'),
          platformLegalService.getActiveDocumentByType('privacy_policy'),
        ]);
        setPlatformTerms(terms);
        setPlatformPrivacy(privacy);
      } catch (error) {
        console.error('[GuestPaymentStep] Failed to load platform legal documents:', error);
      } finally {
        setLoadingPlatformDocs(false);
      }
    };

    loadPlatformDocs();
  }, [propertyName, propertyId, propertyTerms, propertyCancellationPolicy]);

  // Get payment method label
  const getPaymentMethodLabel = (provider: PaymentProvider): string => {
    const labels: Record<PaymentProvider, string> = {
      paystack: 'Card Payment',
      paypal: 'PayPal Account',
      eft: 'Bank Transfer',
      book_via_chat: 'Coordinate payment via chat',
    };
    return labels[provider] || provider;
  };

  // Chat icon for book via chat option
  const ChatBookingIcon = () => (
    <svg className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  // Print platform legal document
  const handlePrintPlatformDoc = (document: PlatformLegalDocument) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedContent = formatPlainTextToHtml(document.content);

    const printContent = `
      <html>
        <head>
          <title>${document.title} - Vilo Platform</title>
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
            hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 2rem 0;
            }
          </style>
        </head>
        <body>
          <h1>${document.title}</h1>
          <p><strong>Platform:</strong> Vilo</p>
          <p><strong>Version:</strong> ${document.version}</p>
          ${document.effective_date ? `<p><strong>Effective Date:</strong> ${new Date(document.effective_date).toLocaleDateString()}</p>` : ''}
          <hr>
          ${formattedContent}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Download platform legal document as PDF
  const handleDownloadPlatformDocPDF = (document: PlatformLegalDocument) => {
    // Use print-to-PDF functionality (browser native)
    handlePrintPlatformDoc(document);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Guest Details & Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll create your account and send you an email to set your password. You can then access your booking portal.
        </p>
      </div>

      {/* Guest Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={guestDetails.firstName}
            onChange={(e) => onGuestDetailsChange('firstName', e.target.value)}
            error={errors.firstName}
            required
            fullWidth
          />
          <Input
            label="Last Name"
            value={guestDetails.lastName}
            onChange={(e) => onGuestDetailsChange('lastName', e.target.value)}
            error={errors.lastName}
            required
            fullWidth
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Email"
            type="email"
            value={guestDetails.email}
            onChange={(e) => onGuestDetailsChange('email', e.target.value)}
            error={errors.email}
            required
            fullWidth
            autoComplete="email"
            inputMode="email"
            placeholder="john@example.com"
          />
          <PhoneInput
            label="Phone Number"
            value={guestDetails.phone}
            onChange={(value) => onGuestDetailsChange('phone', value)}
            error={errors.phone}
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={guestDetails.specialRequests || ''}
            onChange={(e) => onGuestDetailsChange('specialRequests', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-card text-gray-900 dark:text-white"
            placeholder="Any special requests or requirements..."
          />
        </div>
      </div>

      {/* Legal Agreements */}
      <div className="space-y-4">
        {/* Property Terms Agreement */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="propertyTerms"
              checked={guestDetails.termsAccepted}
              onChange={(e) => onGuestDetailsChange('termsAccepted', e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="propertyTerms" className="text-sm text-gray-700 dark:text-gray-300">
              I agree to {propertyName ? `${propertyName}'s` : 'the property'}{' '}
              {propertyTerms && propertyName && propertyId ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPropertyTermsModal(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Terms & Conditions
                </button>
              ) : (
                <span className="text-gray-500">Terms & Conditions</span>
              )}
              {' and '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🔘 [GuestPaymentStep] Cancellation Policy clicked!', {
                    hasData: !!propertyCancellationPolicy,
                    data: propertyCancellationPolicy
                  });
                  setShowCancellationPolicyModal(true);
                }}
                className="text-primary hover:underline font-medium"
              >
                Cancellation Policy
              </button>
              . <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600 mt-2">{errors.termsAccepted}</p>
          )}
        </div>

        {/* Platform Terms Agreement */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="platformTerms"
              checked={guestDetails.platformTermsAccepted || false}
              onChange={(e) => onGuestDetailsChange('platformTermsAccepted', e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="platformTerms" className="text-sm text-gray-700 dark:text-gray-300">
              I agree to Vilo's{' '}
              {platformTerms ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPlatformTermsModal(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Terms of Service
                </button>
              ) : (
                <span className="text-gray-500">Terms of Service</span>
              )}
              {' and '}
              {platformPrivacy ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPlatformPrivacyModal(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              ) : (
                <span className="text-gray-500">Privacy Policy</span>
              )}
              , and understand that an account will be created for me to access my booking portal.{' '}
              <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.platformTermsAccepted && (
            <p className="text-sm text-red-600 mt-2">{errors.platformTermsAccepted}</p>
          )}
        </div>
      </div>

      {/* Promo Code */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Promo Code (Optional)
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
              fullWidth
              disabled={promoCodeStatus?.type === 'success'}
            />
          </div>
          <Button
            onClick={onApplyPromoCode}
            variant="outline"
            disabled={!promoCode.trim() || promoCodeStatus?.type === 'success' || promoCodeStatus?.type === 'applying'}
            isLoading={promoCodeStatus?.type === 'applying'}
          >
            Apply
          </Button>
        </div>
        {promoCodeStatus && (
          <div className={`mt-2 text-sm ${
            promoCodeStatus.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : promoCodeStatus.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {promoCodeStatus.message}
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Method
        </h3>
        {availablePaymentMethods.length > 0 ? (
          <div className={`grid grid-cols-1 gap-4 ${
            availablePaymentMethods.length === 1 ? 'md:grid-cols-1' :
            availablePaymentMethods.length === 2 ? 'md:grid-cols-2' :
            'md:grid-cols-3'
          }`}>
            {availablePaymentMethods.map((method) => (
              <button
                key={method.provider}
                onClick={() => onPaymentMethodChange(method.provider)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === method.provider
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  {method.provider === 'book_via_chat' && <ChatBookingIcon />}
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {method.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getPaymentMethodLabel(method.provider)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No payment methods available. Please contact the property owner.
            </p>
          </div>
        )}
        {errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-2">{errors.paymentMethod}</p>
        )}
      </div>

      {/* Policy Modals */}
      {/* Property Terms Modal */}
      {propertyTerms && propertyName && propertyId && (
        <PolicyModal
          isOpen={showPropertyTermsModal}
          onClose={() => setShowPropertyTermsModal(false)}
          policyHtml={propertyTerms}
          policyType="terms"
          propertyName={propertyName}
          propertyId={propertyId}
        />
      )}

      {/* Cancellation Policy Modal - ALWAYS RENDER */}
      <PolicyModal
        isOpen={showCancellationPolicyModal}
        onClose={() => setShowCancellationPolicyModal(false)}
        policyType="cancellation"
        propertyName={propertyName || 'Property'}
        propertyId={propertyId || ''}
        cancellationPolicyData={propertyCancellationPolicy || undefined}
        showDownload={true}
      />

      {/* Platform Terms of Service Modal */}
      {platformTerms && (
        <div
          className={`fixed inset-0 z-50 ${showPlatformTermsModal ? 'block' : 'hidden'}`}
          onClick={() => setShowPlatformTermsModal(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {platformTerms.title}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPlatformDocPDF(platformTerms)}
                      title="Download as PDF"
                    >
                      <HiOutlineDownload className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintPlatformDoc(platformTerms)}
                      title="Print"
                    >
                      <HiPrinter className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div
                  className="policy-content prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg rounded-lg"
                  dangerouslySetInnerHTML={{ __html: formatPlainTextToHtml(platformTerms.content) }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#1f2937'
                  }}
                />
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" onClick={() => setShowPlatformTermsModal(false)}>
                    Close
                  </Button>
                </div>
                <style>{`
                  .policy-content h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #047857;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #047857;
                  }
                  .policy-content h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #047857;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                  }
                  .policy-content h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #065f46;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                  }
                  .policy-content p {
                    margin-bottom: 1.25rem;
                    line-height: 1.8;
                  }
                  .policy-content ul, .policy-content ol {
                    margin-bottom: 1.5rem;
                    padding-left: 2rem;
                  }
                  .policy-content li {
                    margin-bottom: 0.75rem;
                    line-height: 1.8;
                  }
                  .policy-content strong {
                    font-weight: 600;
                    color: #065f46;
                  }
                  .dark .policy-content h1,
                  .dark .policy-content h2 {
                    color: #10b981;
                  }
                  .dark .policy-content h3,
                  .dark .policy-content strong {
                    color: #34d399;
                  }
                  .dark .policy-content {
                    color: #e5e7eb;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Privacy Policy Modal */}
      {platformPrivacy && (
        <div
          className={`fixed inset-0 z-50 ${showPlatformPrivacyModal ? 'block' : 'hidden'}`}
          onClick={() => setShowPlatformPrivacyModal(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {platformPrivacy.title}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPlatformDocPDF(platformPrivacy)}
                      title="Download as PDF"
                    >
                      <HiOutlineDownload className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintPlatformDoc(platformPrivacy)}
                      title="Print"
                    >
                      <HiPrinter className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div
                  className="policy-content prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg rounded-lg"
                  dangerouslySetInnerHTML={{ __html: formatPlainTextToHtml(platformPrivacy.content) }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#1f2937'
                  }}
                />
                <div className="mt-4 flex justify-end">
                  <Button variant="primary" onClick={() => setShowPlatformPrivacyModal(false)}>
                    Close
                  </Button>
                </div>
                <style>{`
                  .policy-content h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #047857;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #047857;
                  }
                  .policy-content h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #047857;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                  }
                  .policy-content h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #065f46;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                  }
                  .policy-content p {
                    margin-bottom: 1.25rem;
                    line-height: 1.8;
                  }
                  .policy-content ul, .policy-content ol {
                    margin-bottom: 1.5rem;
                    padding-left: 2rem;
                  }
                  .policy-content li {
                    margin-bottom: 0.75rem;
                    line-height: 1.8;
                  }
                  .policy-content strong {
                    font-weight: 600;
                    color: #065f46;
                  }
                  .dark .policy-content h1,
                  .dark .policy-content h2 {
                    color: #10b981;
                  }
                  .dark .policy-content h3,
                  .dark .policy-content strong {
                    color: #34d399;
                  }
                  .dark .policy-content {
                    color: #e5e7eb;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
