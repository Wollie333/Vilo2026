/**
 * ProfilePage Component
 *
 * User profile page with 3-column layout matching the admin UserDetailPage design.
 * Features: auto-save, avatar upload, profile completion tracking, activity history.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Input,
  Badge,
  Avatar,
  Spinner,
  Alert,
  PhoneInput,
  Select,
  Button,
} from '@/components/ui';
import { useAuth, useHashTab } from '@/hooks';
import { usersService } from '@/services';
import { NotificationSettingsTab } from './NotificationSettingsTab';
import { BillingTab } from './BillingTab';

// Valid views for hash-based routing
const PROFILE_VIEWS = ['overview', 'personal', 'notifications', 'billing'] as const;
type ViewType = typeof PROFILE_VIEWS[number];

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Timezone options
const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

// Currency options
const currencyOptions = [
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
];

// Icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIconSmall = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Format date helpers
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Navigation Item Component
const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}> = ({ item, isActive, isComplete, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary-700 font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={isActive ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </div>
    {isComplete && (
      <span className="text-primary-700">
        <CheckIcon />
      </span>
    )}
  </button>
);

// Circular Progress Component
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
}> = ({ percentage, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-dark-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'blue' | 'purple';
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    green: 'bg-success/10 text-success border-success/20',
    yellow: 'bg-warning/10 text-warning border-warning/20',
    blue: 'bg-info/10 text-info border-info/20',
    purple: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Active view state
  const [activeView, setActiveView] = useHashTab(PROFILE_VIEWS, 'overview');

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    timezone: 'UTC',
    default_currency: 'ZAR',
    bio: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
  });

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        default_currency: user.default_currency || 'ZAR',
        bio: user.bio || '',
        linkedin_url: user.linkedin_url || '',
        facebook_url: user.facebook_url || '',
        instagram_url: user.instagram_url || '',
        twitter_url: user.twitter_url || '',
        youtube_url: user.youtube_url || '',
      });
    }
  }, [user]);

  // Handle field changes (just update state)
  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      await usersService.updateUser(user.id, formData);
      await refreshUser();
      setSuccess('Profile updated successfully');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, formData, refreshUser]);

  // Handle cancel - reset form to original values
  const handleCancel = useCallback(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        default_currency: user.default_currency || 'ZAR',
        bio: user.bio || '',
        linkedin_url: user.linkedin_url || '',
        facebook_url: user.facebook_url || '',
        instagram_url: user.instagram_url || '',
        twitter_url: user.twitter_url || '',
        youtube_url: user.youtube_url || '',
      });
      setHasChanges(false);
    }
  }, [user]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);
    try {
      await usersService.uploadAvatar(user.id, file);
      await refreshUser();
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Completion status
  const getCompletionStatus = useCallback((): Record<ViewType, boolean> => {
    if (!user) return {} as Record<ViewType, boolean>;
    return {
      overview: true,
      personal: Boolean(user.full_name),
      notifications: true,
      billing: true,
    };
  }, [user]);

  const completionStatus = getCompletionStatus();

  // Navigation sections
  const navSections: NavSection[] = [
    {
      title: '',
      items: [
        { id: 'overview', label: 'Overview', icon: <GridIcon /> },
        { id: 'personal', label: 'Personal Info', icon: <UserIcon /> },
        { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
        { id: 'billing', label: 'Subscription & Billing', icon: <CreditCardIcon /> },
      ],
    },
  ];

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<CalendarIcon />}
                label="Member Since"
                value={user ? formatDate(user.created_at) : '-'}
                color="green"
              />
              <StatCard
                icon={<ClockIcon />}
                label="Last Login"
                value={user?.last_login_at ? formatRelativeDate(user.last_login_at) : 'Never'}
                color="yellow"
              />
            </div>

            {/* Profile Summary */}
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile Summary</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Personal Info</span>
                    <Badge variant={completionStatus.personal ? 'success' : 'default'} size="sm">
                      {completionStatus.personal ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveView('personal')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors"
                  >
                    <UserIcon />
                    <span>Update personal information</span>
                  </button>
                  <button
                    onClick={() => setActiveView('notifications')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors"
                  >
                    <BellIcon />
                    <span>Manage notification preferences</span>
                  </button>
                  <button
                    onClick={() => setActiveView('billing')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors"
                  >
                    <CreditCardIcon />
                    <span>View subscription & billing</span>
                  </button>
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      case 'personal':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                  fullWidth
                />
                <Input
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Brief description about yourself"
                  fullWidth
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                      className="pl-10"
                      fullWidth
                    />
                  </div>
                </div>
                <PhoneInput
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleFieldChange('phone', value)}
                  fullWidth
                />
                <Select
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  options={timezoneOptions}
                  fullWidth
                />
                <div>
                  <Select
                    label="Default Currency"
                    value={formData.default_currency}
                    onChange={(e) => handleFieldChange('default_currency', e.target.value)}
                    options={currencyOptions}
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">System-wide default currency for your account</p>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Social Media
                  </h4>
                  <div className="space-y-4">
                    <Input
                      label="LinkedIn"
                      value={formData.linkedin_url}
                      onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      fullWidth
                    />
                    <Input
                      label="Facebook"
                      value={formData.facebook_url}
                      onChange={(e) => handleFieldChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/username"
                      fullWidth
                    />
                    <Input
                      label="Instagram"
                      value={formData.instagram_url}
                      onChange={(e) => handleFieldChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/username"
                      fullWidth
                    />
                    <Input
                      label="Twitter/X"
                      value={formData.twitter_url}
                      onChange={(e) => handleFieldChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/username"
                      fullWidth
                    />
                    <Input
                      label="YouTube"
                      value={formData.youtube_url}
                      onChange={(e) => handleFieldChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@channel"
                      fullWidth
                    />
                  </div>
                </div>
                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving || !hasChanges}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSaving}
                    disabled={!hasChanges}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        );

      case 'notifications':
        return <NotificationSettingsTab />;

      case 'billing':
        return <BillingTab />;

      default:
        return null;
    }
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

  const profileFields = ['personal'] as const;
  const completedCount = profileFields.filter((f) => completionStatus[f]).length;
  const completionPercentage = (completedCount / profileFields.length) * 100;

  return (
    <AuthenticatedLayout title="Profile" subtitle="Manage your account settings and preferences">
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-3">
            <Card variant="bordered" className="lg:sticky lg:top-6">
              <Card.Body className="p-3 space-y-4">
                {/* Profile Completion */}
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <CircularProgress percentage={completionPercentage} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Completion</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {completedCount} of {profileFields.length} sections
                    </p>
                  </div>
                </div>

                {navSections.map((section, index) => (
                  <div key={section.title || index}>
                    {section.title && (
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {section.title}
                      </p>
                    )}
                    <div className={section.title ? 'mt-1 space-y-1' : 'space-y-1'}>
                      {section.items.map((item) => (
                        <NavItemButton
                          key={item.id}
                          item={item}
                          isActive={activeView === item.id}
                          isComplete={completionStatus[item.id] || false}
                          onClick={() => setActiveView(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>

          {/* Center Column - Content */}
          <div className="lg:col-span-5">{renderContent()}</div>

          {/* Right Column - Profile Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Profile Card with Banner */}
              <Card variant="bordered" className="overflow-hidden">
                {/* Green Banner */}
                <div className="h-20 bg-gradient-to-br from-primary to-primary-600 relative">
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full group"
                    >
                      <Avatar
                        src={user.avatar_url || undefined}
                        name={user.full_name || user.email}
                        size="xl-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all flex items-center justify-center">
                        {isUploadingAvatar ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          <svg
                            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Identity */}
                <div className="pt-11 pb-4 px-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.full_name || 'Unnamed User'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                </div>
              </Card>

              {/* Account Info */}
              <Card variant="bordered">
                <Card.Header>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account Info
                  </h3>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <MailIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 dark:text-gray-500">
                        <PhoneIconSmall />
                      </span>
                      <span className="text-gray-900 dark:text-white">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <GlobeIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white">{user.timezone || 'UTC'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <CalendarIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white">Joined {formatDate(user.created_at)}</span>
                  </div>
                  {user.last_login_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 dark:text-gray-500">
                        <ClockIcon />
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        Last login: {formatRelativeDate(user.last_login_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <ShieldIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white capitalize">
                      Status: {user.status}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
