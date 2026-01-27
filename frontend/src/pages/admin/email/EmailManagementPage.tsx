/**
 * Email Management Page
 *
 * Main admin page for managing platform-wide email templates.
 * Super admin only.
 */

import React from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useHashTab } from '@/hooks';
import { TemplateListTab } from './components/TemplateListTab';
import { SupabaseAuthTab } from './components/SupabaseAuthTab';
import { EmailAnalyticsTab } from './components/EmailAnalyticsTab';

export const EmailManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useHashTab(
    ['templates', 'supabase-auth', 'analytics'],
    'templates'
  );

  return (
    <AuthenticatedLayout
      title="Email Management"
      subtitle="Manage platform-wide email templates and notifications"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="underline">
            <TabsTrigger value="templates">
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="supabase-auth">
              Supabase Auth
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics & Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <TemplateListTab />
          </TabsContent>

          <TabsContent value="supabase-auth">
            <SupabaseAuthTab />
          </TabsContent>

          <TabsContent value="analytics">
            <EmailAnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};
