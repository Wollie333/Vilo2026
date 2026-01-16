/**
 * TermsTab Component
 * WYSIWYG editor for property-specific Terms & Conditions
 */

import React, { useState, useEffect, useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';
import './TermsTab.css';
import { Card, Button, Alert, Spinner } from '@/components/ui';
import { propertyService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { Property } from '@/types';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = React.lazy(() => import('react-quill'));

export const TermsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [isEditorReady, setIsEditorReady] = useState(false);

  // State
  const [property, setProperty] = useState<Property | null>(null);
  const [termsContent, setTermsContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load property and terms on mount
  useEffect(() => {
    loadPropertyTerms();
    setIsEditorReady(true);
  }, []);

  const loadPropertyTerms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's properties
      const response = await propertyService.getMyProperties({});

      if (!response.properties || response.properties.length === 0) {
        setError('No properties found. Please create a property first.');
        return;
      }

      // Use first property (or you could add property selector later)
      const firstProperty = response.properties[0];
      setProperty(firstProperty);

      // Set terms content or default template
      setTermsContent(firstProperty.terms_and_conditions || getDefaultTemplate());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorChange = (content: string) => {
    setTermsContent(content);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!property) {
      setError('No property selected');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      console.log('🔍 Saving terms to property:', property.id);
      console.log('  - Content length:', termsContent.length, 'characters');
      console.log('  - Content preview:', termsContent.substring(0, 100) + '...');
      console.log('  - Payload:', {
        terms_and_conditions: termsContent.substring(0, 100) + '...'
      });

      await propertyService.updateProperty(property.id, {
        terms_and_conditions: termsContent,
      });

      console.log('✅ Terms saved successfully');

      setSuccess(true);
      setHasChanges(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Failed to save terms:', err);
      setError(err instanceof Error ? err.message : 'Failed to save terms');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (property) {
      setTermsContent(property.terms_and_conditions || getDefaultTemplate());
      setHasChanges(false);
      setSuccess(false);
      setError(null);
    }
  };

  const getDefaultTemplate = () => `
    <h2>Terms & Conditions</h2>
    <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

    <h3>1. Acceptance of Terms</h3>
    <p>By booking accommodation at our property, you agree to these terms and conditions in full. If you disagree with any part of these terms, you must not make a booking.</p>

    <h3>2. Booking and Payment</h3>
    <ul>
      <li>All bookings require full payment or a deposit as specified at the time of booking</li>
      <li>Prices are subject to change until your booking is confirmed</li>
      <li>Payment must be received in full before your arrival</li>
      <li>We accept payment via the methods specified on our booking page</li>
    </ul>

    <h3>3. Cancellation Policy</h3>
    <p>Please refer to our cancellation policy for details on refunds and cancellation fees. The cancellation policy applicable to your booking will be displayed during the booking process.</p>

    <h3>4. Guest Responsibilities</h3>
    <ul>
      <li>Guests must treat the property with respect and care</li>
      <li>Any damages caused during your stay may result in additional charges</li>
      <li>The maximum occupancy must not be exceeded</li>
      <li>Guests must comply with all house rules provided</li>
      <li>Smoking and pets are only allowed if explicitly permitted</li>
    </ul>

    <h3>5. Check-in and Check-out</h3>
    <ul>
      <li>Check-in and check-out times must be strictly observed</li>
      <li>Late check-out may be available upon request and may incur additional charges</li>
      <li>Early check-in is subject to availability</li>
    </ul>

    <h3>6. Liability</h3>
    <p>The property owner is not liable for:</p>
    <ul>
      <li>Loss or damage to personal belongings</li>
      <li>Personal injury unless caused by negligence</li>
      <li>Interruption of services beyond our control (power outages, etc.)</li>
    </ul>

    <h3>7. Privacy</h3>
    <p>We respect your privacy and handle your personal information in accordance with applicable data protection laws. Your information will only be used for booking purposes and will not be shared with third parties without your consent.</p>

    <h3>8. Changes to Terms</h3>
    <p>We reserve the right to update these terms and conditions at any time. Changes will be effective immediately upon posting. Continued use of our booking services following any changes constitutes acceptance of those changes.</p>

    <h3>9. Contact Information</h3>
    <p>If you have any questions about these Terms & Conditions, please contact us through the details provided on our property listing.</p>

    <hr>
    <p><em>Please customize these terms to match your property's specific requirements and local legal regulations. We recommend consulting with a legal professional to ensure compliance.</em></p>
  `;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // No property state
  if (!property) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          No properties found. Please create a property first to manage terms and conditions.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Terms & Conditions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage terms for <strong>{property.name}</strong> bookings
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          Terms & Conditions saved successfully!
        </Alert>
      )}

      {/* Info Alert */}
      <Alert variant="info">
        <p className="text-sm">
          <strong>Note:</strong> These terms will be displayed to guests during the booking process
          and on your property listing page. Make sure they comply with local regulations and clearly
          outline your policies. Consider consulting with a legal professional.
        </p>
      </Alert>

      {/* Editor Card */}
      <Card variant="bordered">
        <Card.Body className="p-0">
          <div className="quill-wrapper">
            {isEditorReady ? (
              <React.Suspense fallback={<div className="p-8 text-center">Loading editor...</div>}>
                <ReactQuill
                  theme="snow"
                  value={termsContent}
                  onChange={handleEditorChange}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ align: [] }],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                  formats={[
                    'header',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'list',
                    'bullet',
                    'indent',
                    'align',
                    'link',
                  ]}
                  style={{ minHeight: '600px' }}
                />
              </React.Suspense>
            ) : (
              <div className="p-8 text-center">
                <Spinner size="lg" />
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          How guests will see your terms:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>During booking: Checkbox with "Terms & Conditions" link that opens a popup</li>
          <li>On property listing: Link below cancellation policy in the Overview tab</li>
          <li>PDF download: Guests can download terms as a PDF document</li>
        </ul>
      </div>
    </div>
  );
};
