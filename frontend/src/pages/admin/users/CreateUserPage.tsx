import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Input, Alert, Card, Select, PhoneInput, PasswordInput } from '@/components/ui';
import { usersService, billingService } from '@/services';
import type { UserType, SubscriptionType } from '@/types/billing.types';

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

  // Subscription configuration state
  const [assignSubscription, setAssignSubscription] = useState(false);
  const [selectedSubscriptionTypeId, setSelectedSubscriptionTypeId] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial'>('active');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Data for dropdowns
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserTypes, setIsLoadingUserTypes] = useState(true);
  const [isLoadingSubscriptionTypes, setIsLoadingSubscriptionTypes] = useState(false);
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

  // Lazy load subscription types only when checkbox is checked
  useEffect(() => {
    if (!assignSubscription) return;

    const fetchSubscriptionTypes = async () => {
      setIsLoadingSubscriptionTypes(true);
      try {
        const types = await billingService.listSubscriptionTypes({ is_active: true });
        setSubscriptionTypes(types);
      } catch (err) {
        console.error('Failed to load subscription types:', err);
        setError('Failed to load subscription types');
      } finally {
        setIsLoadingSubscriptionTypes(false);
      }
    };

    fetchSubscriptionTypes();
  }, [assignSubscription]);

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

    // Subscription validations (only if assigning subscription)
    if (assignSubscription) {
      if (!selectedSubscriptionTypeId) {
        errors.subscriptionType = 'Please select a subscription type';
      }

      if (subscriptionStatus === 'trial') {
        if (!trialEndsAt) {
          errors.trialEndsAt = 'Trial end date required for trial subscriptions';
        } else if (trialEndsAt <= new Date()) {
          errors.trialEndsAt = 'Trial end date must be in the future';
        }
      }

      if (expiresAt) {
        if (expiresAt <= new Date()) {
          errors.expiresAt = 'Expiry date must be in the future';
        }
        if (trialEndsAt && expiresAt <= trialEndsAt) {
          errors.expiresAt = 'Expiry date must be after trial end date';
        }
      }
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

        // Include subscription data if assigning
        subscription: assignSubscription && selectedSubscriptionTypeId ? {
          subscription_type_id: selectedSubscriptionTypeId,
          status: subscriptionStatus,
          trial_ends_at: trialEndsAt?.toISOString(),
          expires_at: expiresAt?.toISOString(),
        } : undefined,
      });

      navigate('/admin/users', {
        state: {
          message: assignSubscription
            ? `User created with ${subscriptionStatus} subscription successfully`
            : 'User created successfully'
        },
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
            <Input
              label={<>Email <span className="text-red-500">*</span></>}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              fullWidth
              error={validationErrors.email}
            />

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

            {/* Subscription Assignment */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignSubscription}
                    onChange={(e) => setAssignSubscription(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign Subscription Plan
                  </span>
                </label>
              </div>

              {assignSubscription && (
                <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                  {/* Subscription Type Selector */}
                  {isLoadingSubscriptionTypes ? (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      Loading subscription plans...
                    </div>
                  ) : subscriptionTypes.length > 0 ? (
                    <>
                      <Select
                        label="Subscription Plan *"
                        value={selectedSubscriptionTypeId}
                        onChange={(e) => setSelectedSubscriptionTypeId(e.target.value)}
                        options={[
                          { value: '', label: 'Select a plan...' },
                          ...subscriptionTypes.map((st) => ({
                            value: st.id,
                            label: `${st.display_name} (${st.currency} ${(st.price_cents / 100).toFixed(2)})`,
                          })),
                        ]}
                        error={validationErrors.subscriptionType}
                        fullWidth
                      />

                      {/* Plan Preview */}
                      {selectedSubscriptionTypeId && (() => {
                        const plan = subscriptionTypes.find(st => st.id === selectedSubscriptionTypeId);
                        if (!plan) return null;

                        return (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Plan Details
                            </h4>
                            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                              <li>• {plan.description || 'No description'}</li>
                              <li>• Price: {plan.currency} {(plan.price_cents / 100).toFixed(2)}</li>
                              {plan.limits && (
                                <li>• Limits: {Object.entries(plan.limits).map(([key, value]) =>
                                  ` ${key}: ${value === -1 ? 'Unlimited' : value}`
                                ).join(', ')}</li>
                              )}
                            </ul>
                          </div>
                        );
                      })()}

                      {/* Subscription Status */}
                      <Select
                        label="Subscription Status"
                        value={subscriptionStatus}
                        onChange={(e) => setSubscriptionStatus(e.target.value as 'active' | 'trial')}
                        options={[
                          { value: 'active', label: 'Active (Full Access)' },
                          { value: 'trial', label: 'Trial (Limited Time)' },
                        ]}
                        helperText="Active subscriptions provide immediate full access. Trial subscriptions require a trial end date."
                        fullWidth
                      />

                      {/* Trial End Date (only if status is trial) */}
                      {subscriptionStatus === 'trial' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Trial End Date *
                          </label>
                          <input
                            type="date"
                            value={trialEndsAt ? trialEndsAt.toISOString().split('T')[0] : ''}
                            onChange={(e) => setTrialEndsAt(e.target.value ? new Date(e.target.value) : null)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {validationErrors.trialEndsAt && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {validationErrors.trialEndsAt}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            User will have trial access until this date
                          </p>
                        </div>
                      )}

                      {/* Expiry Date (optional) */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Expiry Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={expiresAt ? expiresAt.toISOString().split('T')[0] : ''}
                          onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value) : null)}
                          min={subscriptionStatus === 'trial' && trialEndsAt
                            ? trialEndsAt.toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0]
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {expiresAt && (
                          <button
                            type="button"
                            onClick={() => setExpiresAt(null)}
                            className="text-xs text-gray-500 hover:text-primary"
                          >
                            Clear expiry date
                          </button>
                        )}
                        {validationErrors.expiresAt && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {validationErrors.expiresAt}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Leave empty for lifetime subscription. Otherwise, subscription will expire on this date.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                      No active subscription plans available. Please create a plan first.
                    </div>
                  )}
                </div>
              )}
            </div>

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
