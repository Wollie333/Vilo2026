/**
 * BillingSettingsPage
 *
 * Simplified billing settings page with sidebar navigation layout.
 * Manages Member Types, Subscription Plans, and Payment Integrations.
 */

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card, Spinner, Alert } from '@/components/ui';
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

// Icons
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SubscriptionIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const InvoiceIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PermissionsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

// Navigation item component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors
      ${isActive
        ? 'bg-primary/10 text-primary-700 font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card'
      }
    `}
  >
    <div className="flex items-center gap-2.5">
      <span className={isActive ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-xs ${isActive ? 'text-primary-700/70' : 'text-gray-400 dark:text-gray-500'}`}>
        {count}
      </span>
    )}
  </button>
);

// Section title component
interface SectionTitleProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => (
  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
    {title}
  </div>
);

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

  // Render the active view content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    switch (activeView) {
      case 'member-types':
        return <UserTypesTab userTypes={userTypes} isLoading={false} onRefresh={loadData} />;
      case 'subscription-plans':
        return <SubscriptionPlansTab subscriptionTypes={subscriptionTypes} isLoading={false} onRefresh={loadData} />;
      case 'payment-integrations':
        return <PaymentIntegrationsTab />;
      case 'invoice-settings':
        return <InvoiceSettingsTab />;
      case 'permissions-guide':
        return <PermissionsGuideTab />;
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout title="Billing Settings" subtitle="Manage member types, subscription plans, and payment integrations">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-3">
          <Card variant="bordered" className="lg:sticky lg:top-6">
            <Card.Body className="p-2">
              {/* Configuration Section */}
              <SectionTitle title="Configuration" />
              <div className="space-y-1 mb-4">
                <NavItem
                  icon={<UsersIcon />}
                  label="Member Types"
                  count={userTypes.length}
                  isActive={activeView === 'member-types'}
                  onClick={() => setActiveView('member-types')}
                />
              </div>

              {/* Plans Section */}
              <SectionTitle title="Plans" />
              <div className="space-y-1 mb-4">
                <NavItem
                  icon={<SubscriptionIcon />}
                  label="Subscription Plans"
                  count={subscriptionTypes.length}
                  isActive={activeView === 'subscription-plans'}
                  onClick={() => setActiveView('subscription-plans')}
                />
              </div>

              {/* Integrations Section */}
              <SectionTitle title="Integrations" />
              <div className="space-y-1 mb-4">
                <NavItem
                  icon={<PaymentIcon />}
                  label="Payment Gateways"
                  isActive={activeView === 'payment-integrations'}
                  onClick={() => setActiveView('payment-integrations')}
                />
              </div>

              {/* Documents Section */}
              <SectionTitle title="Documents" />
              <div className="space-y-1 mb-4">
                <NavItem
                  icon={<InvoiceIcon />}
                  label="Invoice Settings"
                  isActive={activeView === 'invoice-settings'}
                  onClick={() => setActiveView('invoice-settings')}
                />
              </div>

              {/* Documentation Section */}
              <SectionTitle title="Documentation" />
              <div className="space-y-1">
                <NavItem
                  icon={<PermissionsIcon />}
                  label="Permissions Guide"
                  isActive={activeView === 'permissions-guide'}
                  onClick={() => setActiveView('permissions-guide')}
                />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {renderContent()}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
