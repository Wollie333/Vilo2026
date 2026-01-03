import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Badge, Spinner, Alert, Input, ConfirmDialog } from '@/components/ui';
import { rolesService } from '@/services';
import { useAutoSave, useImmediateSave } from '@/hooks';
import type { Role, Permission } from '@/types/auth.types';

// Save status indicator component
const SaveStatusIndicator = ({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) => {
  if (status === 'idle') return null;

  return (
    <span className={`text-xs font-medium ${
      status === 'saving' ? 'text-gray-500 dark:text-gray-400' :
      status === 'saved' ? 'text-green-600 dark:text-green-400' :
      'text-red-600 dark:text-red-400'
    }`}>
      {status === 'saving' && 'Saving...'}
      {status === 'saved' && '✓ Saved'}
      {status === 'error' && 'Save failed'}
    </span>
  );
};

// Inline editable role card component
const RoleCard: React.FC<{
  role: Role;
  permissions: Permission[];
  onDelete: (role: Role) => void;
  onUpdate: () => void;
}> = ({ role, permissions, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    display_name: role.display_name,
    description: role.description || '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Auto-save for role fields
  const fieldAutoSave = useAutoSave<typeof formData>({
    saveField: async (field, value) => {
      await rolesService.updateRole(role.id, {
        [field === 'display_name' ? 'displayName' : field]: value,
      });
      onUpdate();
    },
    debounceMs: 500,
  });

  // Immediate save for permissions
  const permissionsSave = useImmediateSave<{ permissions: string[] }>(
    async (_field, value) => {
      await rolesService.updateRole(role.id, {
        permissionIds: value as string[],
      });
      onUpdate();
    }
  );

  // Load role permissions when expanding
  const handleToggleExpand = async () => {
    if (!isExpanded) {
      setIsLoadingPermissions(true);
      try {
        const roleWithPermissions = await rolesService.getRole(role.id);
        setSelectedPermissions(roleWithPermissions.permissions.map((p) => p.id));
      } catch (err) {
        console.error('Failed to load permissions', err);
      } finally {
        setIsLoadingPermissions(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    fieldAutoSave.handleChange(field, value);
  };

  const handleFieldBlur = (field: keyof typeof formData, value: string) => {
    fieldAutoSave.handleBlur(field, value);
  };

  const togglePermission = async (permissionId: string) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((id) => id !== permissionId)
      : [...selectedPermissions, permissionId];
    setSelectedPermissions(newPermissions);
    await permissionsSave.saveNow('permissions', newPermissions);
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
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
      {/* Role Header */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 space-y-4">
            {/* Display Name - Inline Editable */}
            <div className="flex items-center gap-3">
              {role.is_system_role ? (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {role.display_name}
                  </h3>
                  <Badge variant="default">System</Badge>
                </div>
              ) : (
                <div className="flex-1">
                  <Input
                    value={formData.display_name}
                    onChange={(e) => handleFieldChange('display_name', e.target.value)}
                    onBlur={(e) => handleFieldBlur('display_name', e.target.value)}
                    className="text-lg font-medium"
                    fullWidth
                  />
                </div>
              )}
              <SaveStatusIndicator status={fieldAutoSave.saveStatus} />
            </div>

            {/* Description - Inline Editable */}
            {!role.is_system_role ? (
              <Input
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={(e) => handleFieldBlur('description', e.target.value)}
                placeholder="Add a description..."
                fullWidth
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {role.description || 'No description'}
              </p>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500">
              ID: {role.name} | Priority: {role.priority}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpand}
            >
              {isExpanded ? 'Collapse' : 'Permissions'}
            </Button>
            {!role.is_system_role && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onDelete(role)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Section - Expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Permissions
            </h4>
            <SaveStatusIndicator status={permissionsSave.saveStatus} />
          </div>

          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <div key={resource}>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 capitalize mb-2">
                    {resource}
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {perms.map((permission) => (
                      <label
                        key={permission.id}
                        className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md transition-colors ${
                          role.is_system_role
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:bg-gray-100 dark:hover:bg-dark-card'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => !role.is_system_role && togglePermission(permission.id)}
                          disabled={role.is_system_role}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
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
      )}
    </div>
  );
};

export const RoleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    role: Role | null;
  }>({ isOpen: false, role: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rolesService.listRoles(),
        rolesService.listPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRole = () => {
    navigate('/admin/roles/new');
  };

  const handleDeleteRequest = (role: Role) => {
    setDeleteConfirm({ isOpen: true, role });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.role) return;

    setIsDeleting(true);
    try {
      await rolesService.deleteRole(deleteConfirm.role.id);
      setSuccess(`Role "${deleteConfirm.role.display_name}" deleted successfully`);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, role: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, role: null });
  };

  return (
    <AuthenticatedLayout title="Role Management" subtitle="Manage roles and their permissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleCreateRole}>
            Create Role
          </Button>
        </div>

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No roles found</p>
            <Button variant="primary" onClick={handleCreateRole}>
              Create Your First Role
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                permissions={permissions}
                onDelete={handleDeleteRequest}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${deleteConfirm.role?.display_name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onClose={handleDeleteCancel}
          isLoading={isDeleting}
        />
      </div>
    </AuthenticatedLayout>
  );
};
