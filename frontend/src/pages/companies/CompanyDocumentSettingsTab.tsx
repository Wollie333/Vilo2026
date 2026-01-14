import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Input, Textarea, Button, Select, ImageUpload } from '@/components/ui';
import { companyService } from '@/services/company.service';
import type {
  InvoiceSettings,
  UpdateInvoiceSettingsData,
} from '@/types/invoice.types';
import type { CompanyWithPropertyCount } from '@/types/company.types';

export const CompanyDocumentSettingsTab: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyWithPropertyCount | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isUsingGlobal, setIsUsingGlobal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateInvoiceSettingsData>({
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    vat_number: '',
    registration_number: '',
    footer_text: '',
    invoice_prefix: '',
    currency: 'ZAR',
    bank_name: '',
    bank_account_number: '',
    bank_branch_code: '',
    bank_account_type: '',
    bank_account_holder: '',
    payment_terms: '',
  });

  // Load settings on mount
  useEffect(() => {
    if (!companyId) return;
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch both company and invoice settings in parallel
      const [companyData, settingsResponse] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getCompanyInvoiceSettings(companyId)
      ]);

      setCompany(companyData);
      setIsUsingGlobal(settingsResponse.is_using_global_fallback);

      if (settingsResponse.settings) {
        setSettings(settingsResponse.settings);
        setFormData({
          company_name: settingsResponse.settings.company_name || '',
          company_address: settingsResponse.settings.company_address || '',
          company_email: settingsResponse.settings.company_email || '',
          company_phone: settingsResponse.settings.company_phone || '',
          vat_number: settingsResponse.settings.vat_number || '',
          registration_number: settingsResponse.settings.registration_number || '',
          footer_text: settingsResponse.settings.footer_text || '',
          invoice_prefix: settingsResponse.settings.invoice_prefix || '',
          currency: settingsResponse.settings.currency || 'ZAR',
          bank_name: settingsResponse.settings.bank_name || '',
          bank_account_number: settingsResponse.settings.bank_account_number || '',
          bank_branch_code: settingsResponse.settings.bank_branch_code || '',
          bank_account_type: settingsResponse.settings.bank_account_type || '',
          bank_account_holder: settingsResponse.settings.bank_account_holder || '',
          payment_terms: settingsResponse.settings.payment_terms || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof UpdateInvoiceSettingsData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleCreateCustomSettings = async () => {
    if (!companyId || !company) return;

    try {
      setIsSaving(true);
      setError(null);

      // Build address from company address fields
      const addressParts = [
        company.address_street,
        company.address_city,
        company.address_state,
        company.address_postal_code,
        company.address_country
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      // Create settings with company data auto-filled
      const result = await companyService.updateCompanyInvoiceSettings(companyId, {
        company_name: company.name,
        company_address: fullAddress,
        company_email: company.contact_email,
        company_phone: company.contact_phone,
        vat_number: company.vat_number,
        registration_number: company.registration_number,
        currency: company.default_currency || 'ZAR',
        invoice_prefix: 'INV',
      });

      setSettings(result);
      setIsUsingGlobal(false);
      setSuccessMessage('Custom settings created with company details');
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!companyId) return;

    try {
      setIsSaving(true);
      setError(null);

      const result = await companyService.updateCompanyInvoiceSettings(companyId, formData);

      setSettings(result);
      setIsUsingGlobal(false);
      setHasChanges(false);
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_email: settings.company_email || '',
        company_phone: settings.company_phone || '',
        vat_number: settings.vat_number || '',
        registration_number: settings.registration_number || '',
        footer_text: settings.footer_text || '',
        invoice_prefix: settings.invoice_prefix || '',
        currency: settings.currency || 'ZAR',
        bank_name: settings.bank_name || '',
        bank_account_number: settings.bank_account_number || '',
        bank_branch_code: settings.bank_branch_code || '',
        bank_account_type: settings.bank_account_type || '',
        bank_account_holder: settings.bank_account_holder || '',
        payment_terms: settings.payment_terms || '',
      });
    }
    setHasChanges(false);
    setSuccessMessage(null);
  };

  const handleLogoUpload = async (file: File): Promise<void> => {
    if (!companyId) return;

    try {
      setIsUploadingLogo(true);
      setError(null);

      const logoUrl = await companyService.uploadCompanyInvoiceLogo(companyId, file);

      setFormData((prev) => ({ ...prev, logo_url: logoUrl }));
      setSuccessMessage('Logo uploaded successfully');
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
      throw err; // Re-throw so ImageUpload component can handle it
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDelete = async (): Promise<void> => {
    if (!companyId) return;

    try {
      setError(null);
      await companyService.deleteCompanyInvoiceLogo(companyId);

      setFormData((prev) => ({ ...prev, logo_url: null }));
      setSuccessMessage('Logo deleted successfully');
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
      throw err; // Re-throw so ImageUpload component can handle it
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-dark-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="p-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </Card>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="p-6">
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </Card>
      )}

      {/* Fallback Banner */}
      {isUsingGlobal && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Using Global Admin Settings
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  This company is currently using the global SaaS admin invoice settings. Click the
                  button to customize settings specifically for this company.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCustomSettings}
                isLoading={isSaving}
                className="ml-4"
              >
                Customize for this Company
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Section 1: Company Information on Invoices (Read-Only) */}
      {company && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Company Information on Invoices
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              The following company details will appear on your invoices. To edit these, navigate to the respective tabs above.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Company Name</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{company.name}</p>
                <a href="#info" className="text-xs text-primary hover:underline">Edit in Company Info →</a>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact Email</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{company.contact_email || 'Not set'}</p>
                <a href="#info" className="text-xs text-primary hover:underline">Edit in Company Info →</a>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact Phone</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{company.contact_phone || 'Not set'}</p>
                <a href="#info" className="text-xs text-primary hover:underline">Edit in Company Info →</a>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {[
                    company.address_street,
                    company.address_city,
                    company.address_state,
                    company.address_postal_code
                  ].filter(Boolean).join(', ') || 'Not set'}
                </p>
                <a href="#address" className="text-xs text-primary hover:underline">Edit in Address →</a>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">VAT Number</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{company.vat_number || 'Not set'}</p>
                <a href="#legal" className="text-xs text-primary hover:underline">Edit in Legal Info →</a>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Registration Number</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{company.registration_number || 'Not set'}</p>
                <a href="#legal" className="text-xs text-primary hover:underline">Edit in Legal Info →</a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Section 2: Logo & Branding */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Logo & Branding
          </h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
            Customize your invoice branding with a logo and custom footer text.
          </p>

          <ImageUpload
            label="Invoice Logo"
            value={settings?.logo_url || null}
            onUpload={handleLogoUpload}
            onDelete={handleLogoDelete}
            loading={isUploadingLogo}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            helperText="Upload a logo to display on invoices (max 5MB)"
            showDelete={true}
          />

          <Textarea
            label="Footer Text"
            value={formData.footer_text || ''}
            onChange={(e) => handleFieldChange('footer_text', e.target.value)}
            placeholder="Thank you for your business!"
            rows={2}
            helperText="Text displayed at the bottom of invoices"
          />
        </div>
      </Card>

      {/* Section 3: Invoice Numbering */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Invoice Numbering
          </h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
            Configure how invoice numbers are generated for this company.
          </p>

          <Input
            label="Invoice Prefix"
            value={formData.invoice_prefix || ''}
            onChange={(e) =>
              handleFieldChange(
                'invoice_prefix',
                e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
              )
            }
            placeholder="INV"
            maxLength={10}
            helperText="2-10 uppercase alphanumeric characters (e.g., INV, ACME)"
          />

          {settings && (
            <div className="bg-gray-50 dark:bg-dark-surface-elevated p-4 rounded-md">
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
                <span className="font-medium">Next invoice number:</span>{' '}
                {formData.invoice_prefix || 'INV'}-202601-
                {String(settings.next_invoice_number).padStart(4, '0')}
              </p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> Changing the prefix will affect all future invoices
              generated for this company.
            </p>
          </div>
        </div>
      </Card>

      {/* Section 4: Bank Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bank Details (EFT Payments)
          </h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
            Provide your bank details for customers to make EFT payments.
          </p>

          <Input
            label="Bank Name"
            value={formData.bank_name || ''}
            onChange={(e) => handleFieldChange('bank_name', e.target.value)}
            placeholder="Standard Bank"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Number"
              value={formData.bank_account_number || ''}
              onChange={(e) => handleFieldChange('bank_account_number', e.target.value)}
              placeholder="123456789"
            />

            <Input
              label="Branch Code"
              value={formData.bank_branch_code || ''}
              onChange={(e) => handleFieldChange('bank_branch_code', e.target.value)}
              placeholder="051001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Account Type"
              value={formData.bank_account_type || ''}
              onChange={(e) => handleFieldChange('bank_account_type', e.target.value)}
              placeholder="Select Account Type"
              options={[
                { value: 'CURRENT', label: 'Current Account' },
                { value: 'SAVINGS', label: 'Savings Account' },
                { value: 'CHEQUE', label: 'Cheque Account' }
              ]}
            />

            <Input
              label="Account Holder"
              value={formData.bank_account_holder || ''}
              onChange={(e) => handleFieldChange('bank_account_holder', e.target.value)}
              placeholder="Acme Properties (Pty) Ltd"
            />
          </div>
        </div>
      </Card>

      {/* Section 5: Payment Terms */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Terms
          </h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
            Specify when payment is due and any additional payment instructions.
          </p>

          <Textarea
            label="Payment Terms"
            value={formData.payment_terms || ''}
            onChange={(e) => handleFieldChange('payment_terms', e.target.value)}
            placeholder="Payment due within 30 days of invoice date. Please use the invoice number as reference for EFT payments."
            rows={4}
            helperText="Instructions displayed on invoices regarding payment deadlines and methods"
          />
        </div>
      </Card>

      {/* Save/Cancel Buttons */}
      {!isUsingGlobal && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
          <Button variant="outline" onClick={handleCancel} disabled={!hasChanges || isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};
