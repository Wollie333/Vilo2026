/**
 * MemberTypesSection Component
 *
 * Clean interface for managing member/user types with:
 * - Visual cards for each type
 * - Create/edit functionality
 * - Quick actions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, ConfirmDialog } from '@/components/ui';
import { billingService } from '@/services';
import type { UserType } from '@/types/billing.types';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

interface MemberTypesSectionProps {
  userTypes: UserType[];
  onRefresh: () => void;
}

export const MemberTypesSection: React.FC<MemberTypesSectionProps> = ({
  userTypes,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  // Open editor for creating new type
  const handleCreate = () => {
    navigate('/admin/billing/member-types/new');
  };

  // Open editor for editing existing type
  const handleEdit = (userType: UserType) => {
    navigate(`/admin/billing/member-types/${userType.id}/edit`);
  };

  // Delete type
  const handleDelete = async (typeId: string) => {
    try {
      await billingService.deleteUserType(typeId);
      onRefresh();
      setDeletingTypeId(null);
    } catch (err) {
      console.error('Failed to delete user type:', err);
    }
  };

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Member Types</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define roles and permissions for team members
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <PlusIcon />
          <span className="ml-2">Create Member Type</span>
        </Button>
      </div>

      {/* Types Grid */}
      {userTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No member types yet</p>
          <Button variant="primary" onClick={handleCreate}>
            <PlusIcon />
            <span className="ml-2">Create Your First Member Type</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTypes.map((userType) => (
            <div
              key={userType.id}
              className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <UsersIcon />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {userType.display_name}
                      </h3>
                      {userType.is_system_type && (
                        <Badge variant="info" size="sm" className="mt-1">
                          System
                        </Badge>
                      )}
                    </div>
                  </div>
                  {userType.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">
                      {userType.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Internal Name */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Internal Name
                </label>
                <code className="text-sm text-gray-700 dark:text-gray-300">
                  {userType.name}
                </code>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <ShieldIcon />
                    <span>Category</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {userType.category}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <UsersIcon />
                    <span>Features</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {userType.can_have_subscription && 'Sub '}
                    {userType.can_have_team && 'Team'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(userType)}
                  className="flex-1"
                >
                  <EditIcon />
                  <span className="ml-1">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingTypeId(userType.id)}
                  className="text-error border-error hover:bg-error/10"
                  title="Delete type"
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTypeId && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Member Type"
          message="Are you sure you want to delete this member type? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          onConfirm={() => handleDelete(deletingTypeId)}
          onClose={() => setDeletingTypeId(null)}
        />
      )}
    </div>
  );
};
