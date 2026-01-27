/**
 * BillingSettingsPage
 *
 * Admin billing settings page with horizontal tab navigation.
 * Manages Member Types, Subscription Plans, Payment Integrations, Invoice Settings, and Permissions.
 */

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent, Spinner, Alert } from '@/components/ui';
import { billingService } from '@/services';
import { useHashTab } from '@/hooks';
import { UserTypesTab } from './components/UserTypesTab';
import { SubscriptionPlansTab } from './components/SubscriptionPlansTab';
import { PaymentIntegrationsTab } from './components/PaymentIntegrationsTab';
import { InvoiceSettingsTab } from './components/InvoiceSettingsTab';
import { PermissionsGuideTab } from './components/PermissionsGuideTab';
import type {
  UserType,
  SubscriptionType,
} from '@/types/billing.types';

// Valid views for hash-based routing
const BILLING_VIEWS = ['member-types', 'subscription-plans', 'payment-integrations', 'invoice-settings', 'permissions-guide'] as const;

export const BillingSettingsPage: React.FC = () => {
  const [activeView, setActiveView] = useHashTab(BILLING_VIEWS, 'member-types');
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await billingService.getBillingOverview();
      setUserTypes(overview.userTypes);
      setSubscriptionTypes(overview.subscriptionTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Billing Settings" subtitle="Manage member types, subscription plans, and payment integrations">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Billing Settings" subtitle="Manage member types, subscription plans, and payment integrations">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList variant="underline" className="mb-6">
          <TabsTrigger value="member-types" variant="underline">
            Member Types
          </TabsTrigger>
          <TabsTrigger value="subscription-plans" variant="underline">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="payment-integrations" variant="underline">
            Payment Integrations
          </TabsTrigger>
          <TabsTrigger value="invoice-settings" variant="underline">
            Invoice Settings
          </TabsTrigger>
          <TabsTrigger value="permissions-guide" variant="underline">
            Permissions Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="member-types">
          <UserTypesTab userTypes={userTypes} isLoading={false} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="subscription-plans">
          <SubscriptionPlansTab subscriptionTypes={subscriptionTypes} isLoading={false} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="payment-integrations">
          <PaymentIntegrationsTab />
        </TabsContent>

        <TabsContent value="invoice-settings">
          <InvoiceSettingsTab />
        </TabsContent>

        <TabsContent value="permissions-guide">
          <PermissionsGuideTab />
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};
