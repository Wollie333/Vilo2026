/**
 * InvoiceSettingsTab Component
 *
 * Admin configuration for invoice business details.
 */

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Spinner, Alert, Textarea, ImageUpload } from '@/components/ui';
import { invoiceService } from '@/services';
import type { InvoiceSettings, UpdateInvoiceSettingsData } from '@/types/invoice.types';

// Icons
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BankIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export const InvoiceSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateInvoiceSettingsData>({
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    vat_number: '',
    registration_number: '',
    footer_text: '',
    invoice_prefix: '',
    currency: '',
    bank_name: '',
    bank_account_number: '',
    bank_branch_code: '',
    bank_account_type: '',
    bank_account_holder: '',
    payment_terms: '',
  });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await invoiceService.getSettings();
        setSettings(data);
        setLogoUrl(data.logo_url);
        setFormData({
          company_name: data.company_name || '',
          company_address: data.company_address || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          vat_number: data.vat_number || '',
          registration_number: data.registration_number || '',
          footer_text: data.footer_text || '',
          invoice_prefix: data.invoice_prefix || '',
          currency: data.currency || '',
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_branch_code: data.bank_branch_code || '',
          bank_account_type: data.bank_account_type || '',
          bank_account_holder: data.bank_account_holder || '',
          payment_terms: data.payment_terms || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear success message when user makes changes
    setSuccess(null);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Filter out empty strings, convert to null
      const dataToSave: UpdateInvoiceSettingsData = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined && value !== '') {
          (dataToSave as Record<string, string | null>)[key] = value;
        } else if (value === '') {
          (dataToSave as Record<string, string | null>)[key] = null;
        }
      }

      const updated = await invoiceService.updateSettings(dataToSave);
      setSettings(updated);
      setSuccess('Invoice settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      setError(null);
      const url = await invoiceService.uploadLogo(file);
      setLogoUrl(url);
      setSuccess('Logo uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
      throw err;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle logo delete
  const handleLogoDelete = async () => {
    try {
      setIsUploadingLogo(true);
      setError(null);
      await invoiceService.deleteLogo();
      setLogoUrl(null);
      setSuccess('Logo removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
      throw err;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure the business details that appear on generated invoices.
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Company Details Card */}
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <BuildingIcon />
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company Details</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <Input
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Input
                  name="company_email"
                  type="email"
                  value={formData.company_email || ''}
                  onChange={handleChange}
                  placeholder="billing@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <Input
                name="company_phone"
                value={formData.company_phone || ''}
                onChange={handleChange}
                placeholder="+27 12 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                VAT Number
              </label>
              <Input
                name="vat_number"
                value={formData.vat_number || ''}
                onChange={handleChange}
                placeholder="VAT registration number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registration Number
              </label>
              <Input
                name="registration_number"
                value={formData.registration_number || ''}
                onChange={handleChange}
                placeholder="Company registration number"
              />
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                value={logoUrl}
                onUpload={handleLogoUpload}
                onDelete={handleLogoDelete}
                shape="rectangle"
                size="lg"
                label="Company Logo"
                placeholder="Upload your company logo"
                helperText="Recommended: PNG or SVG with transparent background, max 2MB"
                loading={isUploadingLogo}
                maxSize={2 * 1024 * 1024}
                alt="Company logo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Address
              </label>
              <Textarea
                name="company_address"
                value={formData.company_address || ''}
                onChange={handleChange}
                placeholder="Full company address"
                rows={3}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Invoice Format Card */}
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <DocumentIcon />
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Invoice Format</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Prefix
              </label>
              <Input
                name="invoice_prefix"
                value={formData.invoice_prefix}
                onChange={handleChange}
                placeholder="INV"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: {formData.invoice_prefix || 'INV'}-202601-0001
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <Input
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                placeholder="ZAR"
                maxLength={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-letter currency code (e.g., ZAR, USD, EUR)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Footer Text
              </label>
              <Textarea
                name="footer_text"
                value={formData.footer_text || ''}
                onChange={handleChange}
                placeholder="Thank you for your business!"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                This text appears at the bottom of each invoice
              </p>
            </div>
          </div>

          {/* Next Invoice Number Info */}
          {settings && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Next Invoice Number:</span>{' '}
                {settings.invoice_prefix}-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(settings.next_invoice_number).padStart(4, '0')}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Bank Details Card */}
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <BankIcon />
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bank Details for EFT Payments</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Optional: These details will appear on invoices and receipts
          </p>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </label>
              <Input
                name="bank_name"
                value={formData.bank_name || ''}
                onChange={handleChange}
                placeholder="Standard Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number
              </label>
              <Input
                name="bank_account_number"
                value={formData.bank_account_number || ''}
                onChange={handleChange}
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch Code
              </label>
              <Input
                name="bank_branch_code"
                value={formData.bank_branch_code || ''}
                onChange={handleChange}
                placeholder="051-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type
              </label>
              <Input
                name="bank_account_type"
                value={formData.bank_account_type || ''}
                onChange={handleChange}
                placeholder="Current Account"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Holder Name
              </label>
              <Input
                name="bank_account_holder"
                value={formData.bank_account_holder || ''}
                onChange={handleChange}
                placeholder="Company Name (PTY) LTD"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms
              </label>
              <Textarea
                name="payment_terms"
                value={formData.payment_terms || ''}
                onChange={handleChange}
                placeholder="Payment due within 30 days of invoice date"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                These terms will appear on invoices
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Spinner size="sm" />
          ) : (
            <SaveIcon />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
