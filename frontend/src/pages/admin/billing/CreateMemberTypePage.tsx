/**
 * CreateMemberTypePage
 *
 * Standalone page for creating new member types (user types).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert, Button, Input } from '@/components/ui';
import { billingService } from '@/services';

interface FormData {
  name: string;
  display_name: string;
  description: string;
  category: 'saas' | 'customer';
  can_have_subscription: boolean;
  can_have_team: boolean;
  is_system_type: boolean;
}

const defaultFormData: FormData = {
  name: '',
  display_name: '',
  description: '',
  category: 'customer',
  can_have_subscription: true,
  can_have_team: false,
  is_system_type: false,
};

export const CreateMemberTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    navigate('/admin/billing#member-types');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Internal name is required');
        setIsSaving(false);
        return;
      }

      if (!formData.display_name.trim()) {
        setError('Display name is required');
        setIsSaving(false);
        return;
      }

      // Validate internal name format (lowercase and underscores only)
      if (!/^[a-z_]+$/.test(formData.name)) {
        setError('Internal name must contain only lowercase letters and underscores');
        setIsSaving(false);
        return;
      }

      // Create user type
      await billingService.createUserType({
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || undefined,
        category: formData.category,
        can_have_subscription: formData.can_have_subscription,
        can_have_team: formData.can_have_team,
      });

      // Navigate back to billing settings
      navigate('/admin/billing#member-types');
    } catch (err) {
      console.error('Failed to create member type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create member type');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      title="Create Member Type"
      subtitle="Define a new role for team members"
    >
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="max-w-3xl">
        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 space-y-6">
          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Internal Name <span className="text-error">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., property_manager"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lowercase letters and underscores only. Used internally in the system.
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Human-friendly name shown in the UI.
            </p>
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-error">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="saas">SaaS Team (Internal)</option>
              <option value="customer">Customer</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              SaaS team members are internal staff. Customers are platform users (hosts, guests, etc.).
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

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="is_system_type"
                checked={formData.is_system_type}
                onChange={(e) => handleChange('is_system_type', e.target.checked)}
                disabled={isSaving}
                className="mt-1"
              />
              <div>
                <label htmlFor="is_system_type" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  System Type
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mark as a system-managed type (cannot be deleted by users).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Create Member Type
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default CreateMemberTypePage;
