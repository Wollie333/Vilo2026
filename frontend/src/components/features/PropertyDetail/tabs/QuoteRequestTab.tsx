/**
 * Quote Request Tab Component
 *
 * Tab component for public property page that allows guests to request custom quotes
 * Wraps QuoteRequestForm and handles success state
 */

import React, { useState } from 'react';
import { QuoteRequestForm } from '../../QuoteRequest/QuoteRequestForm';
import type { QuoteRequestTabProps } from './QuoteRequestTab.types';
import type { QuoteRequestWithDetails } from '@/types/quote-request.types';
import { CheckCircle, MessageCircle, Mail } from 'lucide-react';

export const QuoteRequestTab: React.FC<QuoteRequestTabProps> = ({
  propertyId,
  propertyName,
  propertyCurrency,
  propertyImage,
}) => {
  console.log('[QuoteRequestTab] Rendering tab for property:', propertyId);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequestWithDetails | null>(null);

  const handleSuccess = (quote: QuoteRequestWithDetails) => {
    console.log('[QuoteRequestTab] Quote submitted successfully:', quote.id);
    setSubmittedQuote(quote);
    setIsSubmitted(true);

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitAnother = () => {
    console.log('[QuoteRequestTab] Resetting form for another quote');
    setIsSubmitted(false);
    setSubmittedQuote(null);
  };

  // Success screen - shown after quote is submitted
  if (isSubmitted && submittedQuote) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-8 border border-gray-200 dark:border-dark-border">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-3">
              Quote Request Submitted!
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-text-secondary mb-2">
              Thank you for your interest in {propertyName}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
              Reference: <span className="font-mono font-semibold">{submittedQuote.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
              What happens next?
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Check Your Email
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    We've sent a confirmation to <span className="font-semibold">{submittedQuote.guest_email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Property Owner Notified
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    The property owner will review your request and respond within 24-48 hours
                  </p>
                </div>
              </div>

              {submittedQuote.conversation && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-200">
                      Chat Available
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      A conversation has been started - check your email for access
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Summary */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
              Your Quote Request Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Guest Name</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {submittedQuote.guest_name}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Email</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {submittedQuote.guest_email}
                </p>
              </div>

              {submittedQuote.preferred_check_in && (
                <div>
                  <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Check-in</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {new Date(submittedQuote.preferred_check_in).toLocaleDateString()}
                  </p>
                </div>
              )}

              {submittedQuote.preferred_check_out && (
                <div>
                  <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Check-out</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {new Date(submittedQuote.preferred_check_out).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Guests</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {submittedQuote.adults_count} adults
                  {submittedQuote.children_count > 0 && `, ${submittedQuote.children_count} children`}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Group Type</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary capitalize">
                  {submittedQuote.group_type.replace('_', ' ')}
                </p>
              </div>

              {(submittedQuote.budget_min || submittedQuote.budget_max) && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 dark:text-dark-text-tertiary mb-1">Budget Range</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {submittedQuote.currency} {submittedQuote.budget_min?.toLocaleString() || '0'} - {submittedQuote.budget_max?.toLocaleString() || 'No max'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.hash = 'overview'}
              className="px-6 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors font-medium"
            >
              Back to Property Details
            </button>
            <button
              onClick={handleSubmitAnother}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Submit Another Quote
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
              Need help? Contact us at{' '}
              <a href="mailto:support@vilo.com" className="text-primary hover:underline">
                support@vilo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quote request form - shown initially
  return (
    <div className="py-8">
      <QuoteRequestForm
        propertyId={propertyId}
        propertyName={propertyName}
        propertyCurrency={propertyCurrency}
        propertyImage={propertyImage}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
