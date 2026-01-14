/**
 * PermissionsTab Component
 *
 * Manages granular permissions with categorized view
 */

import React, { useState, useMemo } from 'react';
import { Input, Button, Spinner } from '@/components/ui';
import { usePermissionCategories } from '@/hooks';
import type { PlanFormData } from '../SubscriptionPlansTab';
import { PermissionCategoryCard } from '../PermissionCategoryCard';

interface PermissionsTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({ formData, onChange }) => {
  const { data: categories, isLoading, error } = usePermissionCategories();
  const [searchQuery, setSearchQuery] = useState('');

  // Get all permission IDs for select all
  const allPermissionIds = useMemo(() => {
    if (!categories) return [];
    return categories.flatMap((cat) => cat.permissions.map((p) => p.id));
  }, [categories]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!categories || !searchQuery) return categories || [];

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        permissions: category.permissions.filter(
          (p) =>
            p.resource.toLowerCase().includes(query) ||
            p.action.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [categories, searchQuery]);

  const togglePermission = (permissionId: string, enabled: boolean) => {
    const updated = enabled
      ? [...formData.permission_ids, permissionId]
      : formData.permission_ids.filter((id) => id !== permissionId);
    onChange({ permission_ids: updated });
  };

  const selectAllInCategory = (categoryId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) return;

    const permissionIds = category.permissions.map((p) => p.id);
    const updated = [...new Set([...formData.permission_ids, ...permissionIds])];
    onChange({ permission_ids: updated });
  };

  const deselectAllInCategory = (categoryId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) return;

    const permissionIds = category.permissions.map((p) => p.id);
    const updated = formData.permission_ids.filter((id) => !permissionIds.includes(id));
    onChange({ permission_ids: updated });
  };

  const handleSelectAll = () => {
    onChange({ permission_ids: allPermissionIds });
  };

  const handleClearAll = () => {
    onChange({ permission_ids: [] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-200">
          Failed to load permissions: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and quick actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Permission count */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">
            {formData.permission_ids.length}
          </span>
          <span>of {allPermissionIds.length} permissions selected</span>
        </div>
      </div>

      {/* Permission categories */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <PermissionCategoryCard
              key={category.id}
              category={category}
              selectedPermissions={formData.permission_ids}
              onTogglePermission={togglePermission}
              onSelectAll={() => selectAllInCategory(category.id)}
              onDeselectAll={() => deselectAllInCategory(category.id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>No permissions found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <span className="font-medium">Tip:</span> Permissions control what users with this plan can access. Use "manage" action for full control of a resource.
        </p>
      </div>
    </div>
  );
};
