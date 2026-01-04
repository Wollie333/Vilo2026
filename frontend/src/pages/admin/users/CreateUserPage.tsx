import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Input, Alert, Card, Select, Checkbox, PhoneInput, PasswordInput } from '@/components/ui';
import { usersService, rolesService } from '@/services';
import type { Role } from '@/types/auth.types';

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Roles data
  const [roles, setRoles] = useState<Role[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await rolesService.listRoles();
        setRoles(rolesData);
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
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
        roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
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

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
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
              type="email"
              label="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
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
              hint="Active users can log in immediately. Pending users need admin approval."
              fullWidth
            />

            {/* Roles */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign Roles
              </label>
              {isLoadingRoles ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No roles available</div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-md p-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded"
                    >
                      <Checkbox
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                        label={role.display_name}
                        description={role.description || undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select one or more roles to assign to this user. You can change roles later.
              </p>
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
