import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Input, Button, Alert, Avatar, Spinner, PhoneInput, MaskedInput } from '@/components/ui';
import { useAuth } from '@/hooks';
import { usersService } from '@/services';
import type { UpdateUserData } from '@/services/users.service';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    timezone: '',
    company_name: '',
    vat_number: '',
    company_registration: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    address_country: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        company_name: user.company_name || '',
        vat_number: user.vat_number || '',
        company_registration: user.company_registration || '',
        address_street: user.address_street || '',
        address_city: user.address_city || '',
        address_state: user.address_state || '',
        address_postal_code: user.address_postal_code || '',
        address_country: user.address_country || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const updateData: UpdateUserData = {};

      // Only include changed fields
      if (formData.full_name !== (user.full_name || '')) {
        updateData.full_name = formData.full_name;
      }
      if (formData.phone !== (user.phone || '')) {
        updateData.phone = formData.phone;
      }
      if (formData.timezone !== user.timezone) {
        updateData.timezone = formData.timezone;
      }
      if (formData.company_name !== (user.company_name || '')) {
        updateData.company_name = formData.company_name;
      }
      if (formData.vat_number !== (user.vat_number || '')) {
        updateData.vat_number = formData.vat_number;
      }
      if (formData.company_registration !== (user.company_registration || '')) {
        updateData.company_registration = formData.company_registration;
      }
      if (formData.address_street !== (user.address_street || '')) {
        updateData.address_street = formData.address_street;
      }
      if (formData.address_city !== (user.address_city || '')) {
        updateData.address_city = formData.address_city;
      }
      if (formData.address_state !== (user.address_state || '')) {
        updateData.address_state = formData.address_state;
      }
      if (formData.address_postal_code !== (user.address_postal_code || '')) {
        updateData.address_postal_code = formData.address_postal_code;
      }
      if (formData.address_country !== (user.address_country || '')) {
        updateData.address_country = formData.address_country;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save');
        setIsLoading(false);
        return;
      }

      await usersService.updateUser(user.id, updateData);
      await refreshUser();
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
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

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
  ];

  return (
    <AuthenticatedLayout title="Profile" subtitle="Manage your account settings and preferences">
      <div className="max-w-3xl mx-auto space-y-6">

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

        {/* Avatar Section */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profile Picture
          </h2>
          <div className="flex items-center gap-6">
            <Avatar
              src={user.avatar_url || undefined}
              name={user.full_name || user.email}
              size="xl"
            />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Your avatar is generated from your email address.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Custom avatar uploads coming soon.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                fullWidth
              />

              <Input
                label="Email"
                type="email"
                value={user.email}
                disabled
                helperText="Email cannot be changed"
                fullWidth
              />

              <PhoneInput
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                fullWidth
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Your company"
                fullWidth
              />

              <MaskedInput
                label="VAT Number"
                name="vat_number"
                mask="vat"
                value={formData.vat_number}
                onChange={(value) => setFormData((prev) => ({ ...prev, vat_number: value }))}
                helperText="South African VAT number (10 digits)"
                fullWidth
              />

              <MaskedInput
                label="Company Registration"
                name="company_registration"
                mask="company_registration"
                value={formData.company_registration}
                onChange={(value) => setFormData((prev) => ({ ...prev, company_registration: value }))}
                helperText="Format: YYYY/NNNNNN/NN"
                fullWidth
              />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 space-y-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  placeholder="123 Main St"
                  fullWidth
                />
              </div>

              <Input
                label="City"
                name="address_city"
                value={formData.address_city}
                onChange={handleChange}
                placeholder="City"
                fullWidth
              />

              <Input
                label="State / Province"
                name="address_state"
                value={formData.address_state}
                onChange={handleChange}
                placeholder="State"
                fullWidth
              />

              <Input
                label="Postal Code"
                name="address_postal_code"
                value={formData.address_postal_code}
                onChange={handleChange}
                placeholder="12345"
                fullWidth
              />

              <Input
                label="Country"
                name="address_country"
                value={formData.address_country}
                onChange={handleChange}
                placeholder="Country"
                fullWidth
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>

        {/* Account Info */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Account Status</dt>
              <dd className="mt-1 text-gray-900 dark:text-white capitalize">{user.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Email Verified</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">
                {user.email_verified_at
                  ? new Date(user.email_verified_at).toLocaleDateString()
                  : 'Not verified'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Member Since</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Last Login</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleString()
                  : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
