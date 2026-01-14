import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Input, Alert, Card, Select, PhoneInput, PasswordInput } from '@/components/ui';
import { usersService, billingService } from '@/services';
import type { UserType } from '@/types/billing.types';

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string>('');

  // Data for dropdowns
  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserTypes, setIsLoadingUserTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch user types on mount
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const userTypesData = await billingService.listUserTypes();
        setUserTypes(userTypesData);
        // Default to "client" user type
        const clientType = userTypesData.find((ut) => ut.name === 'client');
        if (clientType) {
          setSelectedUserTypeId(clientType.id);
        } else if (userTypesData.length > 0) {
          setSelectedUserTypeId(userTypesData[0].id);
        }
      } catch (err) {
        console.error('Failed to load user types:', err);
      } finally {
        setIsLoadingUserTypes(false);
      }
    };

    fetchUserTypes();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await usersService.createUser({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        status,
        userTypeId: selectedUserTypeId || undefined,
      });

      navigate('/admin/users', {
        state: { message: 'User created successfully' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthenticatedLayout title="Create User" subtitle="Add a new user to the system">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/admin/users"
            className="text-primary hover:text-primary-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
        </div>

        {/* Form Card */}
        <Card variant="elevated" className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            New User Details
          </h2>

          {error && (
            <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="pl-10"
                  fullWidth
                  error={validationErrors.email}
                />
              </div>
            </div>

            {/* Full Name */}
            <Input
              type="text"
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              fullWidth
              error={validationErrors.fullName}
            />

            {/* Phone */}
            <PhoneInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              fullWidth
            />

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                label="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                fullWidth
                error={validationErrors.password}
              />
              <PasswordInput
                label="Confirm Password *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                fullWidth
                error={validationErrors.confirmPassword}
              />
            </div>

            {/* Status */}
            <Select
              label="Initial Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'pending')}
              options={[
                { value: 'active', label: 'Active (can log in immediately)' },
                { value: 'pending', label: 'Pending (requires approval)' },
              ]}
              helperText="Active users can log in immediately. Pending users need admin approval."
              fullWidth
            />

            {/* User Type */}
            {isLoadingUserTypes ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">Loading user types...</div>
            ) : userTypes.length > 0 && (
              <Select
                label="User Type"
                value={selectedUserTypeId}
                onChange={(e) => setSelectedUserTypeId(e.target.value)}
                options={userTypes.map((ut) => ({
                  value: ut.id,
                  label: ut.display_name,
                }))}
                helperText="Permissions are automatically assigned based on the selected user type."
                fullWidth
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};
