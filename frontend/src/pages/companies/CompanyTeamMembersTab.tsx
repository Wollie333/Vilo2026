/**
 * CompanyTeamMembersTab Component
 *
 * Manages team members for a company - staff who can access and manage properties.
 * Respects max_team_members subscription limit.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Modal, Input, Select } from '@/components/ui';
import { companyTeamService } from '@/services';
import type {
  CompanyTeamMemberWithUser,
  CompanyTeamMemberRole,
  CreateCompanyTeamMemberRequest,
  COMPANY_TEAM_MEMBER_ROLE_LABELS,
  COMPANY_TEAM_MEMBER_ROLE_DESCRIPTIONS,
} from '@/types/company-team.types';

interface CompanyTeamMembersTabProps {
  companyId: string;
}

// Icons
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Role labels
const ROLE_LABELS: Record<CompanyTeamMemberRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  receptionist: 'Receptionist',
  maintenance: 'Maintenance',
  housekeeping: 'Housekeeping',
  custom: 'Custom Role',
};

// Role descriptions
const ROLE_DESCRIPTIONS: Record<CompanyTeamMemberRole, string> = {
  owner: 'Full access to all property settings and team management',
  manager: 'Manage bookings, guests, and property operations',
  receptionist: 'Handle check-ins, bookings, and guest communication',
  maintenance: 'Manage property maintenance and repairs',
  housekeeping: 'Manage room cleaning and housekeeping tasks',
  custom: 'Custom role with specific permissions',
};

// Role badge variants
const getRoleBadgeVariant = (role: CompanyTeamMemberRole): 'primary' | 'success' | 'info' | 'warning' | 'default' => {
  const variantMap: Record<CompanyTeamMemberRole, 'primary' | 'success' | 'info' | 'warning' | 'default'> = {
    owner: 'primary',
    manager: 'success',
    receptionist: 'info',
    maintenance: 'warning',
    housekeeping: 'info',
    custom: 'default',
  };
  return variantMap[role] || 'default';
};

export const CompanyTeamMembersTab: React.FC<CompanyTeamMembersTabProps> = ({ companyId }) => {
  const [teamMembers, setTeamMembers] = useState<CompanyTeamMemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [addForm, setAddForm] = useState<CreateCompanyTeamMemberRequest>({
    user_id: '',
    role: 'custom',
    role_name: '',
    permissions: [],
  });
  const [isAdding, setIsAdding] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, [companyId]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const members = await companyTeamService.listTeamMembers(companyId);
      setTeamMembers(members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    // Validation
    if (!addForm.user_id.trim()) {
      setError('User email is required');
      return;
    }

    if (addForm.role === 'custom' && !addForm.role_name?.trim()) {
      setError('Custom role name is required');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      await companyTeamService.addTeamMember(companyId, addForm);
      setSuccess('Team member added successfully');
      setIsAddModalOpen(false);
      setAddForm({
        user_id: '',
        role: 'custom',
        role_name: '',
        permissions: [],
      });
      loadTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;

    try {
      setIsRemoving(true);
      setError(null);
      await companyTeamService.removeTeamMember(companyId, removeId);
      setSuccess('Team member removed successfully');
      setRemoveId(null);
      loadTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member');
    } finally {
      setIsRemoving(false);
    }
  };

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage staff who can access and manage your properties
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon />
          <span className="ml-2">Add Team Member</span>
        </Button>
      </div>

      {/* Info Alert */}
      <Alert variant="info">
        <div className="text-sm">
          <p className="font-medium text-gray-900 dark:text-white mb-1">
            About Team Members
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Team members are staff you invite to help manage your properties. Each member can be assigned a role
            with specific permissions. The number of team members you can add depends on your subscription plan.
          </p>
        </div>
      </Alert>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <UsersIcon />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No team members yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add your first team member to start collaborating on property management.
              </p>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                <PlusIcon />
                <span className="ml-2">Add First Team Member</span>
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teamMembers.map(member => (
            <Card key={member.id}>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                      {member.user.full_name?.[0] || member.user.email[0].toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {member.user.full_name || 'No name'}
                        </h4>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role_name || ROLE_LABELS[member.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <MailIcon />
                        <span>{member.user.email}</span>
                      </div>
                      {member.role !== 'custom' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ROLE_DESCRIPTIONS[member.role]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-error border-error hover:bg-error/10"
                      onClick={() => setRemoveId(member.id)}
                    >
                      <TrashIcon />
                      <span className="ml-1">Remove</span>
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              User Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                type="email"
                value={addForm.user_id}
                onChange={(e) => setAddForm({ ...addForm, user_id: e.target.value })}
                placeholder="Enter user email address"
                helperText="The user must have an existing account on the platform"
                className="pl-10"
              />
            </div>
          </div>

          <Select
            label="Role"
            value={addForm.role}
            onChange={(e) => setAddForm({ ...addForm, role: e.target.value as CompanyTeamMemberRole })}
          >
            <option value="manager">Manager</option>
            <option value="receptionist">Receptionist</option>
            <option value="maintenance">Maintenance</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="custom">Custom Role</option>
          </Select>

          {addForm.role === 'custom' && (
            <Input
              label="Custom Role Name"
              value={addForm.role_name || ''}
              onChange={(e) => setAddForm({ ...addForm, role_name: e.target.value })}
              placeholder="e.g., Night Auditor, Concierge"
            />
          )}

          {/* Role Description */}
          {addForm.role !== 'custom' && (
            <Alert variant="info">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ROLE_DESCRIPTIONS[addForm.role]}
              </p>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddTeamMember}
              isLoading={isAdding}
            >
              Add Team Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        title="Remove Team Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to remove this team member? They will lose access to your properties.
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-error hover:bg-error/90"
              onClick={handleRemove}
              isLoading={isRemoving}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
