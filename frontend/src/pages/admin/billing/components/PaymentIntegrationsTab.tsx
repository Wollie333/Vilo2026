import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Switch, Spinner } from '@/components/ui';
import { paymentService } from '@/services';
import { useToast } from '@/context/NotificationContext';
import type {
  PaymentIntegration,
  PaymentProvider,
  PaystackConfig,
  PayPalConfig,
  EFTConfig,
  WebhookURLs,
  PaymentEnvironment,
} from '@/types/payment.types';

// Provider logos
const PaystackLogo = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#00C3F7"/>
    <path d="M16 8H8v2h8V8zm0 3H8v2h8v-2zm-3 3H8v2h5v-2z" fill="white"/>
  </svg>
);

const PayPalLogo = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.641.641 0 01.633-.54h6.396c2.698 0 4.596.674 5.641 2.003.49.624.83 1.328.996 2.087.176.803.176 1.764-.004 2.93l-.023.14v.397l.307.174c.464.253.844.582 1.123.976.296.418.493.924.582 1.494.092.589.076 1.277-.05 2.046-.146.899-.41 1.685-.785 2.336-.352.612-.803 1.125-1.341 1.528a5.24 5.24 0 01-1.733.875c-.62.176-1.306.264-2.05.264h-.487a1.282 1.282 0 00-1.267 1.082l-.03.168-.5 3.17-.024.123a.641.641 0 01-.633.539H7.076z" fill="#253B80"/>
    <path d="M19.234 7.93c-.014.094-.03.189-.047.285-.647 3.32-2.855 4.466-5.68 4.466H12.02a.698.698 0 00-.69.59l-.766 4.854-.217 1.375a.367.367 0 00.362.424h2.544c.302 0 .559-.22.607-.517l.025-.13.482-3.05.031-.168a.612.612 0 01.605-.517h.38c2.47 0 4.402-1.003 4.968-3.905.236-1.213.114-2.227-.51-2.939a2.446 2.446 0 00-.607-.468z" fill="#179BD7"/>
    <path d="M18.436 7.597a4.868 4.868 0 00-.595-.132 7.537 7.537 0 00-1.2-.087h-3.638a.607.607 0 00-.6.517l-.775 4.908-.022.145a.698.698 0 01.69-.59h1.485c2.825 0 5.033-1.147 5.68-4.466.019-.098.036-.194.048-.285a3.238 3.238 0 00-1.073-.01z" fill="#222D65"/>
  </svg>
);

const BankIcon = () => (
  <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
  </svg>
);

// Icons
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface PaymentIntegrationsTabProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function PaymentIntegrationsTab({ isLoading: externalLoading }: PaymentIntegrationsTabProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [webhookUrls, setWebhookUrls] = useState<WebhookURLs | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<PaymentProvider | null>(null);
  const [saving, setSaving] = useState<PaymentProvider | null>(null);
  const [testing, setTesting] = useState<PaymentProvider | null>(null);

  // Form state for each provider
  const [paystackForm, setPaystackForm] = useState<PaystackConfig & { environment: PaymentEnvironment }>({
    public_key: '',
    secret_key: '',
    environment: 'test',
  });

  const [paypalForm, setPaypalForm] = useState<PayPalConfig & { environment: PaymentEnvironment }>({
    client_id: '',
    client_secret: '',
    environment: 'test',
  });

  const [eftForm, setEftForm] = useState<EFTConfig>({
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder: '',
    reference_prefix: '',
    instructions: '',
  });

  // Load integrations
  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await paymentService.listIntegrations();
      setIntegrations(response.integrations);
      setWebhookUrls(response.webhookUrls);

      // Initialize form state from loaded data
      response.integrations.forEach(integration => {
        const config = integration.config as Record<string, unknown>;
        switch (integration.provider) {
          case 'paystack':
            setPaystackForm({
              public_key: (config.public_key as string) || '',
              secret_key: (config.secret_key as string) || '',
              environment: integration.environment,
            });
            break;
          case 'paypal':
            setPaypalForm({
              client_id: (config.client_id as string) || '',
              client_secret: (config.client_secret as string) || '',
              environment: integration.environment,
            });
            break;
          case 'eft':
            setEftForm({
              bank_name: (config.bank_name as string) || '',
              account_number: (config.account_number as string) || '',
              branch_code: (config.branch_code as string) || '',
              account_holder: (config.account_holder as string) || '',
              reference_prefix: (config.reference_prefix as string) || '',
              instructions: (config.instructions as string) || '',
            });
            break;
        }
      });
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to load payment integrations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  // Get integration by provider
  const getIntegration = (provider: PaymentProvider): PaymentIntegration | undefined => {
    return integrations.find(i => i.provider === provider);
  };

  // Save integration
  const handleSave = async (provider: PaymentProvider) => {
    try {
      setSaving(provider);
      let config: Record<string, unknown>;
      let environment: PaymentEnvironment;

      switch (provider) {
        case 'paystack':
          config = { public_key: paystackForm.public_key, secret_key: paystackForm.secret_key };
          environment = paystackForm.environment;
          break;
        case 'paypal':
          config = { client_id: paypalForm.client_id, client_secret: paypalForm.client_secret };
          environment = paypalForm.environment;
          break;
        case 'eft':
          config = { ...eftForm };
          environment = 'live'; // EFT is always "live"
          break;
        default:
          return;
      }

      await paymentService.updateIntegration(provider, { config, environment });
      toast({ variant: 'success', title: 'Configuration saved successfully' });
      await loadIntegrations();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to save configuration' });
    } finally {
      setSaving(null);
    }
  };

  // Test connection
  const handleTestConnection = async (provider: PaymentProvider) => {
    try {
      setTesting(provider);
      const response = await paymentService.testConnection(provider);

      if (response.result.success) {
        toast({ variant: 'success', title: response.result.message });
      } else {
        toast({ variant: 'error', title: response.result.message });
      }
      await loadIntegrations();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to test connection' });
    } finally {
      setTesting(null);
    }
  };

  // Toggle enabled
  const handleToggleEnabled = async (provider: PaymentProvider, enabled: boolean) => {
    try {
      await paymentService.updateIntegration(provider, { is_enabled: enabled });
      toast({ variant: 'success', title: enabled ? 'Integration enabled' : 'Integration disabled' });
      await loadIntegrations();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to update integration' });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ variant: 'info', title: 'Copied to clipboard' });
  };

  if (loading || externalLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Helper function to get status badge variant
  const getStatusBadge = (integration: PaymentIntegration | undefined) => {
    if (!integration) return <Badge variant="default">Not Configured</Badge>;
    if (integration.verification_status === 'failed') return <Badge variant="error">Error</Badge>;
    if (integration.is_enabled) return <Badge variant="success">Connected</Badge>;
    return <Badge variant="warning">Disabled</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Integrations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure payment providers to accept payments from customers
          </p>
        </div>
      </div>

      {/* Payment Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Paystack Card */}
        <Card
          variant={expandedProvider === 'paystack' ? 'highlight' : 'feature'}
          interactive
          className="cursor-pointer"
          onClick={() => setExpandedProvider(expandedProvider === 'paystack' ? null : 'paystack')}
        >
          <Card.Body>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#00C3F7]/10">
                <PaystackLogo />
              </div>
              {getStatusBadge(getIntegration('paystack'))}
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Paystack
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Accept payments via cards, bank transfers, and mobile money across Africa.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <SettingsIcon />
                <span>Configure</span>
              </div>
              <ChevronDownIcon isOpen={expandedProvider === 'paystack'} />
            </div>
          </Card.Body>
        </Card>

        {/* PayPal Card */}
        <Card
          variant={expandedProvider === 'paypal' ? 'highlight' : 'feature'}
          interactive
          className="cursor-pointer"
          onClick={() => setExpandedProvider(expandedProvider === 'paypal' ? null : 'paypal')}
        >
          <Card.Body>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#253B80]/10">
                <PayPalLogo />
              </div>
              {getStatusBadge(getIntegration('paypal'))}
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              PayPal
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Accept payments globally via PayPal accounts and credit/debit cards.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <SettingsIcon />
                <span>Configure</span>
              </div>
              <ChevronDownIcon isOpen={expandedProvider === 'paypal'} />
            </div>
          </Card.Body>
        </Card>

        {/* EFT Card */}
        <Card
          variant={expandedProvider === 'eft' ? 'highlight' : 'feature'}
          interactive
          className="cursor-pointer"
          onClick={() => setExpandedProvider(expandedProvider === 'eft' ? null : 'eft')}
        >
          <Card.Body>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                <BankIcon />
              </div>
              {getStatusBadge(getIntegration('eft'))}
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              EFT (Bank Transfer)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Accept manual bank transfers with reference tracking.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <SettingsIcon />
                <span>Configure</span>
              </div>
              <ChevronDownIcon isOpen={expandedProvider === 'eft'} />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Configuration Panel */}
      {expandedProvider && (
        <Card variant="bordered" className="animate-in slide-in-from-top-2 duration-200">
          <Card.Header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {expandedProvider === 'paystack' && <PaystackLogo />}
              {expandedProvider === 'paypal' && <PayPalLogo />}
              {expandedProvider === 'eft' && <BankIcon />}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {expandedProvider === 'paystack' && 'Paystack Configuration'}
                  {expandedProvider === 'paypal' && 'PayPal Configuration'}
                  {expandedProvider === 'eft' && 'EFT Configuration'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {expandedProvider === 'paystack' && 'Configure your Paystack API credentials'}
                  {expandedProvider === 'paypal' && 'Configure your PayPal API credentials'}
                  {expandedProvider === 'eft' && 'Configure your bank account details'}
                </p>
              </div>
            </div>
            <Switch
              checked={getIntegration(expandedProvider)?.is_enabled || false}
              onCheckedChange={(checked) => handleToggleEnabled(expandedProvider, checked)}
            />
          </Card.Header>
          <Card.Body>
            {/* Paystack Form */}
            {expandedProvider === 'paystack' && (
              <div className="space-y-6">
                {/* Environment Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <Card
                    variant={paystackForm.environment === 'test' ? 'highlight' : 'bordered'}
                    interactive
                    padding="md"
                    onClick={() => setPaystackForm({ ...paystackForm, environment: 'test' })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paystackForm.environment === 'test' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {paystackForm.environment === 'test' && <CheckCircleIcon />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Test Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">For development</p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    variant={paystackForm.environment === 'live' ? 'highlight' : 'bordered'}
                    interactive
                    padding="md"
                    onClick={() => setPaystackForm({ ...paystackForm, environment: 'live' })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paystackForm.environment === 'live' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {paystackForm.environment === 'live' && <CheckCircleIcon />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Live Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">For production</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* API Keys */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Public Key"
                    placeholder="pk_test_xxxxxxxx or pk_live_xxxxxxxx"
                    value={paystackForm.public_key || ''}
                    onChange={(e) => setPaystackForm({ ...paystackForm, public_key: e.target.value })}
                  />
                  <Input
                    label="Secret Key"
                    type="password"
                    placeholder="sk_test_xxxxxxxx or sk_live_xxxxxxxx"
                    value={paystackForm.secret_key || ''}
                    onChange={(e) => setPaystackForm({ ...paystackForm, secret_key: e.target.value })}
                  />
                </div>

                {/* Webhook URL */}
                {webhookUrls && (
                  <Card variant="gradient" padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Webhook URL
                        </p>
                        <code className="block px-3 py-2 bg-white dark:bg-dark-card rounded text-xs font-mono text-gray-600 dark:text-gray-400 truncate border border-gray-200 dark:border-dark-border">
                          {webhookUrls.paystack}
                        </code>
                        <p className="mt-1.5 text-xs text-gray-500">Add this URL to your Paystack dashboard webhook settings</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(webhookUrls.paystack);
                        }}
                      >
                        <CopyIcon />
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* PayPal Form */}
            {expandedProvider === 'paypal' && (
              <div className="space-y-6">
                {/* Environment Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <Card
                    variant={paypalForm.environment === 'test' ? 'highlight' : 'bordered'}
                    interactive
                    padding="md"
                    onClick={() => setPaypalForm({ ...paypalForm, environment: 'test' })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paypalForm.environment === 'test' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {paypalForm.environment === 'test' && <CheckCircleIcon />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Sandbox</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">For development</p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    variant={paypalForm.environment === 'live' ? 'highlight' : 'bordered'}
                    interactive
                    padding="md"
                    onClick={() => setPaypalForm({ ...paypalForm, environment: 'live' })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paypalForm.environment === 'live' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {paypalForm.environment === 'live' && <CheckCircleIcon />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Live Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">For production</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* API Credentials */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Client ID"
                    placeholder="Your PayPal Client ID"
                    value={paypalForm.client_id || ''}
                    onChange={(e) => setPaypalForm({ ...paypalForm, client_id: e.target.value })}
                  />
                  <Input
                    label="Client Secret"
                    type="password"
                    placeholder="Your PayPal Client Secret"
                    value={paypalForm.client_secret || ''}
                    onChange={(e) => setPaypalForm({ ...paypalForm, client_secret: e.target.value })}
                  />
                </div>

                {/* Webhook URL */}
                {webhookUrls && (
                  <Card variant="gradient" padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Webhook URL
                        </p>
                        <code className="block px-3 py-2 bg-white dark:bg-dark-card rounded text-xs font-mono text-gray-600 dark:text-gray-400 truncate border border-gray-200 dark:border-dark-border">
                          {webhookUrls.paypal}
                        </code>
                        <p className="mt-1.5 text-xs text-gray-500">Add this URL to your PayPal developer dashboard</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(webhookUrls.paypal);
                        }}
                      >
                        <CopyIcon />
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* EFT Form */}
            {expandedProvider === 'eft' && (
              <div className="space-y-6">
                {/* Bank Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Bank Name"
                    placeholder="e.g., First National Bank"
                    value={eftForm.bank_name || ''}
                    onChange={(e) => setEftForm({ ...eftForm, bank_name: e.target.value })}
                  />
                  <Input
                    label="Branch Code"
                    placeholder="e.g., 250655"
                    value={eftForm.branch_code || ''}
                    onChange={(e) => setEftForm({ ...eftForm, branch_code: e.target.value })}
                  />
                  <Input
                    label="Account Number"
                    placeholder="e.g., 62123456789"
                    value={eftForm.account_number || ''}
                    onChange={(e) => setEftForm({ ...eftForm, account_number: e.target.value })}
                  />
                  <Input
                    label="Account Holder Name"
                    placeholder="e.g., Vilo Rentals (Pty) Ltd"
                    value={eftForm.account_holder || ''}
                    onChange={(e) => setEftForm({ ...eftForm, account_holder: e.target.value })}
                  />
                </div>

                <Input
                  label="Reference Prefix"
                  placeholder="e.g., VILO"
                  value={eftForm.reference_prefix || ''}
                  onChange={(e) => setEftForm({ ...eftForm, reference_prefix: e.target.value })}
                  helperText="This prefix will be added to all payment references"
                />
              </div>
            )}
          </Card.Body>
          <Card.Footer className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleTestConnection(expandedProvider)}
              disabled={
                testing === expandedProvider ||
                (expandedProvider === 'paystack' && !paystackForm.secret_key) ||
                (expandedProvider === 'paypal' && (!paypalForm.client_id || !paypalForm.client_secret))
              }
            >
              {testing === expandedProvider ? <Spinner size="sm" /> : 'Test Connection'}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave(expandedProvider)}
              disabled={saving === expandedProvider}
            >
              {saving === expandedProvider ? <Spinner size="sm" /> : 'Save Configuration'}
            </Button>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
}
