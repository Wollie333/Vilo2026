import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Spinner, Alert, Input } from '@/components/ui';
import { rolesService } from '@/services';
import type { Permission } from '@/types/auth.types';

export const CreateRolePage: React.FC = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissionIds: [] as string[],
  });

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const permissionsData = await rolesService.listPermissions();
      setPermissions(permissionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await rolesService.createRole({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        permissionIds: formData.permissionIds,
      });
      navigate('/admin/roles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <AuthenticatedLayout
      title="Create Role"
      subtitle="Define a new role with specific permissions"
    >
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Role Details
              </h2>
              <div className="space-y-4">
                <Input
                  label="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., property_manager"
                  helperText="Unique identifier (lowercase, underscores allowed). Cannot be changed after creation."
                  required
                  fullWidth
                />
                <Input
                  label="Display Name"
                  value={formData.displayName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Property Manager"
                  required
                  fullWidth
                />
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What can this role do?"
                  fullWidth
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-dark-border pt-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Permissions
              </h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource}>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 capitalize mb-3">
                        {resource}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-gray-700 dark:text-gray-300 capitalize">
                              {permission.action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/roles')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Create Role
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
};
