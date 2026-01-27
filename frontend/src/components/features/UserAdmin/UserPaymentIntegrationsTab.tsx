/**
 * UserPaymentIntegrationsTab Component
 *
 * Displays payment gateway integrations for a user's company
 * Super admin only - used in User Detail Page
 * SECURITY: Does not expose API keys or secrets
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Spinner,
  Badge,
  Alert,
} from '@/components/ui';
import { usersService } from '@/services';

interface PaymentIntegration {
  id: string;
  provider: string;
  display_name: string;
  is_enabled: boolean;
  is_primary: boolean;
  environment: 'test' | 'live';
  verification_status: 'unverified' | 'verified' | 'failed';
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserPaymentIntegrationsTabProps {
  userId: string;
  userName: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  paypal: 'PayPal',
  eft: 'EFT (Bank Transfer)',
  stripe: 'Stripe',
};

const PROVIDER_ICONS: Record<string, string> = {
  paystack: '💳',
  paypal: '🅿️',
  eft: '🏦',
  stripe: '💰',
};

export const UserPaymentIntegrationsTab: React.FC<UserPaymentIntegrationsTabProps> = ({
  userId,
  userName,
}) => {
  // State
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch integrations
  useEffect(() => {
    fetchIntegrations();
  }, [userId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserPaymentIntegrations(userId);
      setIntegrations(result);
    } catch (err: any) {
      console.error('Error fetching payment integrations:', err);
      setError(err.message || 'Failed to load payment integrations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const enabledCount = integrations.filter((i) => i.is_enabled).length;
  const testModeCount = integrations.filter((i) => i.environment === 'test').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Integrations for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {integrations.length} payment provider{integrations.length !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <Alert variant="info">
        <p className="text-sm">
          <strong>Security Notice:</strong> API keys and secrets are not displayed for security reasons.
          Users can edit payment settings from their own account settings page.
        </p>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Providers</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {integrations.length}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Enabled Providers</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {enabledCount}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Test Mode Active</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {testModeCount}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading payment integrations...</p>
          </Card.Body>
        </Card>
      ) : error ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card.Body>
        </Card>
      ) : integrations.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No payment integrations configured for this user's company.
            </p>
          </Card.Body>
        </Card>
      ) : (
        /* Payment Provider Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{PROVIDER_ICONS[integration.provider] || '💳'}</div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {PROVIDER_LABELS[integration.provider] || integration.provider}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={integration.is_enabled ? 'success' : 'secondary'} size="sm">
                          {integration.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {integration.is_primary && (
                          <Badge variant="primary" size="sm">
                            Primary
                          </Badge>
                        )}
                        {integration.environment === 'test' && (
                          <Badge variant="warning" size="sm">
                            Test Mode
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {integration.environment === 'test' ? 'Test / Sandbox' : 'Live / Production'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Verified:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDate(integration.last_verified_at)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDate(integration.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDate(integration.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Security notice */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    🔒 API credentials are securely stored and not displayed
                  </p>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
