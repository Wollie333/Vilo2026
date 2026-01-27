/**
 * WhatsApp Settings Page
 * Configure WhatsApp Business API credentials and templates for each company
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, Spinner, Button, Input, Select, Alert } from '@/components/ui';
import { companyService, companyWhatsAppConfigService } from '@/services';
import { WhatsAppTemplatesPage } from './WhatsAppTemplatesPage';
import type { Company } from '@/types/company.types';
import type {
  CompanyWhatsAppConfig,
  WhatsAppCredentialsInput,
  TestConnectionResult,
} from '@/types/company-whatsapp-config.types';

export const WhatsAppSettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL hash
  const getActiveTabFromHash = (): 'templates' | 'integration' => {
    const hash = location.hash.replace('#', '');
    return hash === 'integration' ? 'integration' : 'templates';
  };

  const [activeTab, setActiveTab] = useState<'templates' | 'integration'>(() => getActiveTabFromHash());

  // Update tab when hash changes
  useEffect(() => {
    const newTab = getActiveTabFromHash();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.hash, activeTab]);

  // Update URL hash when tab changes
  const handleTabChange = (tab: 'templates' | 'integration') => {
    navigate(`${location.pathname}#${tab}`, { replace: true });
    setActiveTab(tab);
  };
  // Company selection
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Config state
  const [config, setConfig] = useState<CompanyWhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  // Form state
  const [credentials, setCredentials] = useState<WhatsAppCredentialsInput>({
    phone_number_id: '',
    access_token: '',
    webhook_secret: '',
    environment: 'test',
    api_version: 'v18.0',
    is_active: false,
  });

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load config when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      loadConfig();
    }
  }, [selectedCompanyId]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companyService.getMyCompanies();
      const data = response.companies || [];
      setCompanies(data);

      // Select first company by default
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      setShowForm(false);
      const data = await companyWhatsAppConfigService.getCompanyWhatsAppConfig(selectedCompanyId);
      setConfig(data);

      // Reset form if no config
      if (!data) {
        setCredentials({
          phone_number_id: '',
          access_token: '',
          webhook_secret: '',
          environment: 'test',
          api_version: 'v18.0',
          is_active: false,
        });
      }
    } catch (error) {
      console.error('Failed to load WhatsApp config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof WhatsAppCredentialsInput, value: any) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await companyWhatsAppConfigService.testConnection(selectedCompanyId);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await companyWhatsAppConfigService.upsertCompanyWhatsAppConfig(selectedCompanyId, credentials);
      await loadConfig();
      setShowForm(false);
      setHasChanges(false);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save WhatsApp config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    try {
      await companyWhatsAppConfigService.toggleConfig(selectedCompanyId, isActive);
      await loadConfig();
    } catch (error) {
      console.error('Failed to toggle WhatsApp config:', error);
    }
  };

  const handleSetupClick = () => {
    setShowForm(true);
    setTestResult(null);
  };

  const handleEditClick = () => {
    setShowForm(true);
    setTestResult(null);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setHasChanges(false);
    setTestResult(null);
  };

  // Loading state
  if (loadingCompanies) {
    return (
      <AuthenticatedLayout
        title="WhatsApp"
        subtitle="Configure WhatsApp Business API integration and message templates"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="WhatsApp"
      subtitle="Configure WhatsApp Business API integration and message templates"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'templates' | 'integration')} className="w-full" variant="underline">
          <TabsList variant="underline">
            <TabsTrigger value="templates" variant="underline">Templates</TabsTrigger>
            <TabsTrigger value="integration" variant="underline">API Integration</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <WhatsAppTemplatesPage />
          </TabsContent>

          {/* API Integration Tab */}
          <TabsContent value="integration">
            <div className="space-y-6">
              {/* Company Selector */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Company</h3>
                </Card.Header>
                <Card.Body>
                  <Select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    options={companies.map((c) => ({
                      value: c.id,
                      label: c.display_name || c.name,
                    }))}
                  />
                </Card.Body>
              </Card>

              {/* Loading State */}
              {loading ? (
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <>
                  {/* Status Overview */}
                  {config && !showForm && (
                    <Card>
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WhatsApp Configuration</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Current WhatsApp Business API integration status
                            </p>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                            <input
                              type="checkbox"
                              checked={config.is_active}
                              onChange={(e) => handleToggleActive(e.target.checked)}
                              className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                          </label>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Verification Status
                            </label>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  config.verification_status === 'verified'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : config.verification_status === 'failed'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {config.verification_status === 'verified'
                                  ? '✓ Verified'
                                  : config.verification_status === 'failed'
                                    ? '✗ Failed'
                                    : '⋯ Unverified'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Environment
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {config.environment === 'production' ? 'Production' : 'Test'}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Phone Number ID
                            </label>
                            <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                              {config.phone_number_id_masked}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              API Version
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {config.api_version}
                            </p>
                          </div>

                          {config.last_verified_at && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Last Verified
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {new Date(config.last_verified_at).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {config.verification_error && (
                            <div className="md:col-span-2">
                              <Alert variant="error">
                                <p className="text-sm">{config.verification_error}</p>
                              </Alert>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                          <Button variant="outline" onClick={handleEditClick}>
                            Edit Configuration
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Configuration Form */}
                  {showForm && (
                    <Card>
                      <Card.Header>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {config ? 'Edit WhatsApp Configuration' : 'Setup WhatsApp Integration'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Enter your WhatsApp Business API credentials from Meta Developer Console
                        </p>
                      </Card.Header>
                      <Card.Body>
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                          <div className="space-y-4">
                            <Input
                              label="Phone Number ID"
                              placeholder="123456789012345"
                              value={credentials.phone_number_id}
                              onChange={(e) => handleFieldChange('phone_number_id', e.target.value)}
                              helperText="From WhatsApp Business API > API Setup"
                              required
                            />

                            <Input
                              label="Access Token"
                              type="password"
                              placeholder="EAAxxxxxxxxxxxxx"
                              value={credentials.access_token}
                              onChange={(e) => handleFieldChange('access_token', e.target.value)}
                              helperText="Temporary or permanent access token from Meta"
                              autoComplete="off"
                              required
                            />

                            <Input
                              label="Webhook Secret (Optional)"
                              type="password"
                              placeholder="Your webhook verification secret"
                              value={credentials.webhook_secret || ''}
                              onChange={(e) => handleFieldChange('webhook_secret', e.target.value)}
                              autoComplete="off"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select
                                label="Environment"
                                value={credentials.environment}
                                onChange={(e) =>
                                  handleFieldChange('environment', e.target.value as 'test' | 'production')
                                }
                                options={[
                                  { value: 'test', label: 'Test (Development)' },
                                  { value: 'production', label: 'Production (Live)' },
                                ]}
                              />

                              <Input
                                label="API Version"
                                placeholder="v18.0"
                                value={credentials.api_version || ''}
                                onChange={(e) => handleFieldChange('api_version', e.target.value)}
                              />
                            </div>

                            {/* Test Result */}
                            {testResult && (
                              <Alert variant={testResult.success ? 'success' : 'error'}>
                                <p className="text-sm font-medium">
                                  {testResult.success ? '✓ Connection successful!' : '✗ Connection failed'}
                                </p>
                                {testResult.error && <p className="text-sm mt-1">{testResult.error}</p>}
                                {testResult.phone_display_name && (
                                  <p className="text-sm mt-1">Phone: {testResult.phone_display_name}</p>
                                )}
                              </Alert>
                            )}
                          </div>

                          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                            <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving || testing}>
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleTestConnection}
                              disabled={testing || saving || !credentials.phone_number_id || !credentials.access_token}
                              isLoading={testing}
                            >
                              Test Connection
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={saving || !testResult?.success}
                              isLoading={saving}
                            >
                              Save Configuration
                            </Button>
                          </div>
                        </form>
                      </Card.Body>
                    </Card>
                  )}

                  {/* No Configuration State */}
                  {!config && !showForm && (
                    <Card>
                      <Card.Body>
                        <div className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-border mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            WhatsApp Not Configured
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Set up your WhatsApp Business API credentials to enable WhatsApp messaging for this company
                          </p>
                          <Button variant="primary" onClick={handleSetupClick}>
                            Setup WhatsApp Integration
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};
