/**
 * UserTypesTab Component
 *
 * Displays and manages user types (member types) with permission templates.
 * Supports creating custom member types and applying permission presets.
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Input, Button, Alert, Spinner, ConfirmDialog, Checkbox, Modal } from '@/components/ui';
import { billingService } from '@/services';
import type {
  UserType,
  UserTypeCategory, // NEW
  Permission,
  PermissionTemplate,
  CreateUserTypeData,
} from '@/types/billing.types';

// Icons
const UsersIconLarge = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TemplateIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Color schemes for user types based on name
const getUserTypeColor = (name: string): string => {
  const colorMap: Record<string, string> = {
    super_admin: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    admin: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    free: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
    paid: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };
  return colorMap[name] || 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
};

// Badge variant based on user type
const getUserTypeBadgeVariant = (name: string): 'success' | 'primary' | 'warning' | 'default' | 'info' => {
  const variantMap: Record<string, 'success' | 'primary' | 'warning' | 'default' | 'info'> = {
    super_admin: 'warning',
    admin: 'primary',
    free: 'default',
    paid: 'success',
  };
  return variantMap[name] || 'info';
};

interface UserTypesTabProps {
  userTypes: UserType[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Group permissions by resource for display
const groupPermissionsByResource = (permissions: Permission[]): Record<string, Permission[]> => {
  return permissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

// Format resource name for display
const formatResourceName = (resource: string): string => {
  return resource
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format action name for display
const formatActionName = (action: string): string => {
  const actionLabels: Record<string, string> = {
    read: 'View',
    create: 'Create',
    update: 'Edit',
    delete: 'Delete',
    manage: 'Manage',
    approve: 'Approve',
    export: 'Export',
  };
  return actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1);
};

export const UserTypesTab: React.FC<UserTypesTabProps> = ({ userTypes, isLoading, onRefresh }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ display_name: string; description: string }>({ display_name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Permission management state
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Permission templates state
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Create member type modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserTypeData>({
    name: '',
    display_name: '',
    description: '',
    category: 'customer', // NEW - default to customer
    can_have_subscription: true,
    can_have_team: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all permissions and templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permissions, permissionTemplates] = await Promise.all([
          billingService.listPermissions(),
          billingService.listPermissionTemplates(),
        ]);
        setAllPermissions(permissions);
        setTemplates(permissionTemplates);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  // Fetch user type permissions when selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedPermissionIds(new Set());
      return;
    }

    const fetchUserTypePermissions = async () => {
      setIsLoadingPermissions(true);
      try {
        const permissions = await billingService.getUserTypePermissions(selectedId);
        setSelectedPermissionIds(new Set(permissions.map(p => p.id)));
      } catch (err) {
        console.error('Failed to fetch user type permissions:', err);
        setSelectedPermissionIds(new Set());
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchUserTypePermissions();
  }, [selectedId]);

  const handleSelect = (userType: UserType) => {
    if (selectedId === userType.id) {
      setSelectedId(null);
    } else {
      setSelectedId(userType.id);
      setEditForm({ display_name: userType.display_name, description: userType.description || '' });
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    setError(null);
    try {
      await billingService.updateUserType(selectedId, editForm);
      setSuccess('Member type updated successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await billingService.deleteUserType(deleteId);
      setDeleteId(null);
      setSelectedId(null);
      setSuccess('Member type deleted successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedId) return;
    setIsSavingPermissions(true);
    setError(null);
    try {
      await billingService.updateUserTypePermissions(selectedId, Array.from(selectedPermissionIds));
      setSuccess('Permissions saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!selectedId) return;
    setIsApplyingTemplate(true);
    setError(null);
    try {
      const newPermissions = await billingService.applyTemplateToUserType(selectedId, templateId);
      setSelectedPermissionIds(new Set(newPermissions.map(p => p.id)));
      const template = templates.find(t => t.id === templateId);
      setSuccess(`Applied "${template?.display_name}" template successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleSelectAllResource = (resourcePermissions: Permission[]) => {
    setSelectedPermissionIds(prev => {
      const newSet = new Set(prev);
      const allSelected = resourcePermissions.every(p => newSet.has(p.id));

      if (allSelected) {
        // Deselect all
        resourcePermissions.forEach(p => newSet.delete(p.id));
      } else {
        // Select all
        resourcePermissions.forEach(p => newSet.add(p.id));
      }
      return newSet;
    });
  };

  const handleCreateMemberType = async () => {
    if (!createForm.name || !createForm.display_name) {
      setError('Name and Display Name are required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await billingService.createUserType(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        display_name: '',
        description: '',
        can_have_subscription: true,
        can_have_team: false,
      });
      setSuccess('Member type created successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create member type');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedUserType = userTypes.find(ut => ut.id === selectedId);
  const groupedPermissions = groupPermissionsByResource(allPermissions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Member Types</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage member types and their permissions
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon />
          <span className="ml-2">Add Member Type</span>
        </Button>
      </div>

      {/* Category Explanation */}
      <Alert variant="info">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Member Type Categories</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong className="text-gray-900 dark:text-white">SaaS Team:</strong> Internal platform team members (super_admin, admin).
                Permissions are assigned directly to the member type via the Permissions section below.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Customer:</strong> Property owners and end users (free, paid).
                Permissions come from their subscription plan (see Subscription Plans tab).
              </p>
            </div>
          </div>
        </div>
      </Alert>

      {/* User Type Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {userTypes.map((userType) => (
          <Card
            key={userType.id}
            variant={selectedId === userType.id ? 'highlight' : 'feature'}
            interactive
            className="cursor-pointer"
            onClick={() => handleSelect(userType)}
          >
            <Card.Body>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getUserTypeColor(userType.name)}`}>
                  <UsersIconLarge />
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <Badge variant={getUserTypeBadgeVariant(userType.name)}>
                    {userType.is_system_type ? 'System' : 'Custom'}
                  </Badge>
                  <Badge variant={userType.category === 'saas' ? 'primary' : 'success'}>
                    {userType.category === 'saas' ? 'SaaS' : 'Customer'}
                  </Badge>
                </div>
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {userType.display_name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {userType.description || 'No description provided'}
              </p>
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-1.5 text-xs">
                  {userType.can_have_subscription ? (
                    <span className="text-green-600 dark:text-green-400"><CheckCircleIcon /></span>
                  ) : (
                    <span className="text-gray-400"><XCircleIcon /></span>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">Subscription</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {userType.can_have_team ? (
                    <span className="text-green-600 dark:text-green-400"><CheckCircleIcon /></span>
                  ) : (
                    <span className="text-gray-400"><XCircleIcon /></span>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">Team</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <SettingsIcon />
                  <span>Configure</span>
                </div>
                <ChevronDownIcon isOpen={selectedId === userType.id} />
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Configuration Panel */}
      {selectedId && selectedUserType && (
        <Card variant="bordered" className="animate-in slide-in-from-top-2 duration-200">
          <Card.Header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getUserTypeColor(selectedUserType.name)}`}>
                <UsersIconLarge />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Edit {selectedUserType.display_name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update member type details and permissions
                </p>
              </div>
            </div>
            {selectedUserType.is_system_type && (
              <Badge variant="warning">System types have limited editing</Badge>
            )}
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Display Name"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  placeholder="Enter display name"
                />
                <Input
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              {/* Capabilities Info */}
              <Card variant="gradient" padding="md">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Capabilities</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedUserType.can_have_subscription ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {selectedUserType.can_have_subscription ? <CheckCircleIcon /> : <XCircleIcon />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Subscriptions</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedUserType.can_have_subscription ? 'Can subscribe to plans' : 'Cannot subscribe'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedUserType.can_have_team ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {selectedUserType.can_have_team ? <CheckCircleIcon /> : <XCircleIcon />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Teams</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedUserType.can_have_team ? 'Can create teams' : 'Cannot create teams'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Permissions Section - Only for SaaS category */}
              {selectedUserType.category === 'saas' && (
                <>
                  {/* Permission Templates Section */}
                  {templates.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TemplateIcon />
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">Quick Apply Template</h5>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click a template to apply its permissions to this member type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {templates.map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyTemplate(template.id)}
                            disabled={isApplyingTemplate}
                            className="hover:bg-primary/10 hover:border-primary hover:text-primary"
                          >
                            <ShieldIcon />
                            <span className="ml-1">{template.display_name}</span>
                            <Badge variant="default" className="ml-2 text-xs">
                              {template.permission_ids.length}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Permissions Section */}
                  <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Base Permissions</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedPermissionIds.size} permissions selected
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSavePermissions}
                    isLoading={isSavingPermissions}
                    disabled={isLoadingPermissions}
                  >
                    Save Permissions
                  </Button>
                </div>

                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(groupedPermissions).map(([resource, permissions]) => {
                      const allSelected = permissions.every(p => selectedPermissionIds.has(p.id));
                      const someSelected = permissions.some(p => selectedPermissionIds.has(p.id)) && !allSelected;

                      return (
                        <Card key={resource} variant="bordered" padding="sm">
                          <div className="space-y-3">
                            <div
                              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card-hover -mx-2 px-2 py-1 rounded"
                              onClick={() => handleSelectAllResource(permissions)}
                            >
                              <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatResourceName(resource)}
                              </h6>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                                ${allSelected ? 'bg-primary border-primary' : someSelected ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}
                              `}>
                                {allSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {someSelected && (
                                  <div className="w-2 h-2 bg-primary rounded-sm" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 pl-1">
                              {permissions.map(permission => (
                                <Checkbox
                                  key={permission.id}
                                  id={`perm-${permission.id}`}
                                  label={formatActionName(permission.action)}
                                  checked={selectedPermissionIds.has(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                />
                              ))}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {allPermissions.length === 0 && !isLoadingPermissions && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No permissions defined in the system yet.
                  </p>
                )}
              </div>
                </>
              )}

              {/* Info Alert for Customer Category */}
              {selectedUserType.category === 'customer' && (
                <Alert variant="info">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Permissions for customer member types
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      This is a customer member type. Permissions are managed through subscription plans.
                      To configure permissions, go to the <strong>Subscription Plans</strong> tab.
                    </p>
                  </div>
                </Alert>
              )}
            </div>
          </Card.Body>
          <Card.Footer className="flex justify-between">
            <div>
              {!selectedUserType.is_system_type && (
                <Button
                  variant="outline"
                  className="text-error border-error hover:bg-error/10"
                  onClick={() => setDeleteId(selectedId)}
                >
                  <TrashIcon />
                  <span className="ml-2">Delete</span>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}

      {/* Create Member Type Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Member Type"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="System Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            placeholder="e.g., premium_member"
            helperText="Lowercase with underscores, used internally"
          />
          <Input
            label="Display Name"
            value={createForm.display_name}
            onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
            placeholder="e.g., Premium Member"
          />
          <Input
            label="Description"
            value={createForm.description || ''}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="Describe this member type..."
          />

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Category
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-dark-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  value="customer"
                  checked={createForm.category === 'customer'}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as UserTypeCategory })}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Customer</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Property owners and end users. Permissions come from their subscription plan.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-dark-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  value="saas"
                  checked={createForm.category === 'saas'}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as UserTypeCategory })}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">SaaS Team</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Internal platform team. Permissions are assigned directly to the member type.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Checkbox
              id="can_have_subscription"
              label="Can have subscription"
              checked={createForm.can_have_subscription || false}
              onChange={(e) => setCreateForm({ ...createForm, can_have_subscription: e.target.checked })}
            />
            <Checkbox
              id="can_have_team"
              label="Can have team"
              checked={createForm.can_have_team || false}
              onChange={(e) => setCreateForm({ ...createForm, can_have_team: e.target.checked })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMemberType}
              isLoading={isCreating}
            >
              Create Member Type
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Member Type"
        message="Are you sure you want to delete this member type? Users with this type will need to be reassigned. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
