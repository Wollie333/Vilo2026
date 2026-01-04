/**
 * ProfilePage Component
 *
 * Main profile page with tabs for Profile and Notification Settings.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent, Spinner } from '@/components/ui';
import { useAuth } from '@/hooks';
import { ProfileTab } from './ProfileTab';
import { NotificationSettingsTab } from './NotificationSettingsTab';

type ProfileTabValue = 'profile' | 'notifications';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial tab from URL or default to 'profile'
  const initialTab = (searchParams.get('tab') as ProfileTabValue) || 'profile';
  const [activeTab, setActiveTab] = useState<ProfileTabValue>(initialTab);

  const handleTabChange = (value: string) => {
    const tab = value as ProfileTabValue;
    setActiveTab(tab);
    // Update URL without full navigation
    setSearchParams({ tab });
  };

  if (!user) {
    return (
      <AuthenticatedLayout title="Profile">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Profile" subtitle="Manage your account settings and preferences">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsTab />
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};
