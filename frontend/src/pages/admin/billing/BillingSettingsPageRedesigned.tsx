/**
 * BillingSettingsPageRedesigned
 *
 * Modern, user-friendly billing settings with horizontal line tabs.
 * Allows super admin to manage Member Types, Subscription Plans, Payment Integrations, and Invoice Settings.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { billingService } from '@/services';
import { useHashTab } from '@/hooks';
import { MemberTypesSection } from './components/redesigned/MemberTypesSection';
import { SubscriptionPlansSection } from './components/redesigned/SubscriptionPlansSection';
import { PaymentIntegrationsTab } from './components/PaymentIntegrationsTab';
import { InvoiceSettingsTab } from './components/InvoiceSettingsTab';
import { LegalSettingsTab } from './components/LegalSettingsTab';
import type { UserType, SubscriptionType } from '@/types/billing.types';

// Valid tabs for hash-based routing
const BILLING_TABS = ['member-types', 'subscription-plans', 'payment-integrations', 'invoice-settings', 'legal-settings'] as const;
type BillingTab = typeof BILLING_TABS[number];

export const BillingSettingsPageRedesigned: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useHashTab(BILLING_TABS, 'subscription-plans');
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

  // Load data on mount and when location changes (including when navigating back from edit pages)
  useEffect(() => {
    loadData();
  }, [location.pathname, location.hash]);

  return (
    <AuthenticatedLayout
      title="Billing Settings"
      subtitle="Manage subscription plans, member types, payment integrations, and more"
    >
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
          <TabsList variant="underline">
            <TabsTrigger value="subscription-plans" variant="underline">
              Subscription Plans
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {subscriptionTypes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="member-types" variant="underline">
              Member Types
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {userTypes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="payment-integrations" variant="underline">
              Payment Integrations
            </TabsTrigger>
            <TabsTrigger value="invoice-settings" variant="underline">
              Invoice Settings
            </TabsTrigger>
            <TabsTrigger value="legal-settings" variant="underline">
              Legal Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription-plans">
            <SubscriptionPlansSection
              subscriptionTypes={subscriptionTypes}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="member-types">
            <MemberTypesSection userTypes={userTypes} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="payment-integrations">
            <PaymentIntegrationsTab />
          </TabsContent>

          <TabsContent value="invoice-settings">
            <InvoiceSettingsTab />
          </TabsContent>

          <TabsContent value="legal-settings">
            <LegalSettingsTab />
          </TabsContent>
        </Tabs>
      )}
    </AuthenticatedLayout>
  );
};

export default BillingSettingsPageRedesigned;
