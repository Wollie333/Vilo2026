/**
 * EditMemberTypePage
 *
 * Standalone page for editing existing member types (user types).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert, Button, Input, Spinner } from '@/components/ui';
import { billingService } from '@/services';
import type { UserType } from '@/types/billing.types';

interface FormData {
  display_name: string;
  description: string;
  category: 'saas' | 'customer';
  can_have_subscription: boolean;
  can_have_team: boolean;
}

export const EditMemberTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { typeId } = useParams<{ typeId: string }>();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserType();
  }, [typeId]);

  const loadUserType = async () => {
    if (!typeId) {
      setError('Member type ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await billingService.getUserType(typeId);
      setUserType(data);
      setFormData({
        display_name: data.display_name,
        description: data.description || '',
        category: data.category,
        can_have_subscription: data.can_have_subscription,
        can_have_team: data.can_have_team,
      });
    } catch (err) {
      console.error('Failed to load member type:', err);
      setError(err instanceof Error ? err.message : 'Failed to load member type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    if (formData) {
      setFormData(prev => ({ ...prev!, [field]: value }));
    }
  };

  const handleCancel = () => {
    navigate('/admin/billing#member-types');
  };

  const handleDelete = async () => {
    if (!typeId || !window.confirm('Are you sure you want to delete this member type? This action cannot be undone.')) {
      return;
    }

    try {
      await billingService.deleteUserType(typeId);
      navigate('/admin/billing#member-types');
    } catch (err) {
      console.error('Failed to delete member type:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete member type');
    }
  };

  const handleSave = async () => {
    if (!typeId || !formData) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.display_name.trim()) {
        setError('Display name is required');
        setIsSaving(false);
        return;
      }

      // Update user type (category cannot be changed after creation)
      await billingService.updateUserType(typeId, {
        display_name: formData.display_name,
        description: formData.description || undefined,
        can_have_subscription: formData.can_have_subscription,
        can_have_team: formData.can_have_team,
      });

      // Navigate back to billing settings
      navigate('/admin/billing#member-types');
    } catch (err) {
      console.error('Failed to update member type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member type');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Edit Member Type">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !formData) {
    return (
      <AuthenticatedLayout title="Edit Member Type">
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
        <button
          onClick={handleCancel}
          className="text-primary hover:text-primary/80"
        >
          ← Back to Billing Settings
        </button>
      </AuthenticatedLayout>
    );
  }

  if (!userType || !formData) {
    return (
      <AuthenticatedLayout title="Edit Member Type">
        <Alert variant="error" className="mb-6">
          Member type not found
        </Alert>
        <button
          onClick={handleCancel}
          className="text-primary hover:text-primary/80"
        >
          ← Back to Billing Settings
        </button>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={`Edit: ${userType.display_name}`}
      subtitle="Update member type settings"
    >
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="max-w-3xl">
        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 space-y-6">
          {/* Internal Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Internal Name
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-md">
              <code className="text-sm text-gray-600 dark:text-gray-400">{userType.name}</code>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Internal name cannot be changed after creation.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name <span className="text-error">*</span>
            </label>
            <Input
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              placeholder="e.g., Property Manager"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe this member type's role and responsibilities..."
              disabled={isSaving}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Category (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-md">
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {formData.category === 'saas' ? 'SaaS Team (Internal)' : 'Customer'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Category cannot be changed after creation.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Features</h3>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="can_have_subscription"
                checked={formData.can_have_subscription}
                onChange={(e) => handleChange('can_have_subscription', e.target.checked)}
                disabled={isSaving}
                className="mt-1"
              />
              <div>
                <label htmlFor="can_have_subscription" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Can Have Subscription
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users of this type to have a subscription plan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="can_have_team"
                checked={formData.can_have_team}
                onChange={(e) => handleChange('can_have_team', e.target.checked)}
                disabled={isSaving}
                className="mt-1"
              />
              <div>
                <label htmlFor="can_have_team" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Can Have Team
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users of this type to manage team members.
                </p>
              </div>
            </div>

            {userType.is_system_type && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_system_type"
                  checked={true}
                  disabled={true}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="is_system_type" className="text-sm text-gray-700 dark:text-gray-300">
                    System Type
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This is a system-managed type and cannot be modified.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {!userType.is_system_type && (
              <Button
                variant="outline"
                className="text-error border-error hover:bg-error/10"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete Member Type
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default EditMemberTypePage;
