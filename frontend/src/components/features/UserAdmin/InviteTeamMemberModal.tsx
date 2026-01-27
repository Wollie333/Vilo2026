/**
 * InviteTeamMemberModal Component
 *
 * Modal for inviting a new team member to a user's team
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Spinner,
  PhoneInput,
  Checkbox,
} from '@/components/ui';
import { usersService, rolesService } from '@/services';
import type { Role } from '@/types/auth.types';

interface InviteTeamMemberModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  // UI state
  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch available roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const result = await rolesService.listRoles();
      setRoles(result);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  // Toggle role selection
  const toggleRole = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  // Validate form
  const isValid = () => {
    if (!email.trim()) return false;
    if (!fullName.trim()) return false;
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid()) {
      setError('Please fill in all required fields with valid information');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await usersService.inviteTeamMember(userId, {
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        roleIds: selectedRoles.size > 0 ? Array.from(selectedRoles) : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      setError(err.message || 'Failed to invite team member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite Team Member
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new member to {userName}'s team
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={saving}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone (Optional)
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              disabled={saving}
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Roles (Optional)
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
              {loadingRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">Loading roles...</span>
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No roles available
                </p>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedRoles.has(role.id)}
                        onChange={() => toggleRole(role.id)}
                        disabled={saving}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.display_name}
                        </div>
                        {role.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select roles to assign to the new team member
            </p>
          </div>

          {/* Info message */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              An invitation email will be sent to the member with instructions to set up their password.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid() || saving}
            isLoading={saving}
          >
            Send Invitation
          </Button>
        </div>
      </div>
    </div>
  );
};
