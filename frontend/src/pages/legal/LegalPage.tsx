/**
 * LegalPage
 *
 * Legal settings page with sidebar navigation layout.
 * Manages Terms & Conditions and Cancellation Policies.
 */

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card, Spinner, Alert } from '@/components/ui';
import { legalService } from '@/services';
import { useHashTab } from '@/hooks';
import { TermsTab } from './components/TermsTab';
import { CancellationPoliciesTab } from './components/CancellationPoliciesTab';
import type { CancellationPolicy } from '@/types/legal.types';

// Valid views for hash-based routing
const LEGAL_VIEWS = ['terms', 'cancellation'] as const;

// Icons
const DocumentTextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

export const LegalPage: React.FC = () => {
  const [activeView, setActiveView] = useHashTab(LEGAL_VIEWS, 'cancellation');
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await legalService.getCancellationPolicies();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cancellation policies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  // Render the active view content
  const renderContent = () => {
    if (isLoading && activeView === 'cancellation') {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    switch (activeView) {
      case 'terms':
        return <TermsTab />;
      case 'cancellation':
        return (
          <CancellationPoliciesTab
            policies={policies}
            isLoading={isLoading}
            onRefresh={loadPolicies}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout title="Legal Settings" subtitle="Manage terms of service and cancellation policies">
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
              {/* Documents Section */}
              <SectionTitle title="Documents" />
              <div className="space-y-1 mb-4">
                <NavItem
                  icon={<DocumentTextIcon />}
                  label="Terms & Conditions"
                  isActive={activeView === 'terms'}
                  onClick={() => setActiveView('terms')}
                />
              </div>

              {/* Policies Section */}
              <SectionTitle title="Policies" />
              <div className="space-y-1">
                <NavItem
                  icon={<ShieldCheckIcon />}
                  label="Cancellation Policies"
                  count={policies.length}
                  isActive={activeView === 'cancellation'}
                  onClick={() => setActiveView('cancellation')}
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
