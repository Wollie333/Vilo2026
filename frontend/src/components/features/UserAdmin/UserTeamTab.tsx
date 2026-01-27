/**
 * UserTeamTab Component
 *
 * Displays team members for a specific user (users where parent_user_id = this user)
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  Avatar,
  Badge,
  PlusIcon,
} from '@/components/ui';
import { usersService } from '@/services';
import type { UserStatus } from '@/types/auth.types';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
  user_type: {
    id: string;
    name: string;
    description: string;
  } | null;
  roles: Array<{
    id: string;
    name: string;
    display_name: string;
  }>;
}

interface UserTeamTabProps {
  userId: string;
  userName: string;
}

// Status color mapping
const statusColors: Record<UserStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
  deactivated: 'default',
};

export const UserTeamTab: React.FC<UserTeamTabProps> = ({ userId, userName }) => {
  const navigate = useNavigate();

  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch team members
  useEffect(() => {
    fetchMembers();
  }, [userId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getTeamMembers(userId);
      setMembers(result);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove "${memberName}" from ${userName}'s team?`)) {
      return;
    }

    try {
      setRemoving(memberId);
      await usersService.removeTeamMember(userId, memberId);
      // Refresh the list
      await fetchMembers();
    } catch (err: any) {
      console.error('Error removing team member:', err);
      alert(err.message || 'Failed to remove team member');
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Team Members for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {members.length} team member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Invite Member */}
          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon size="sm" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Spinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading team members...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No team members yet. Invite members using the button above.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.avatar_url || undefined}
                          alt={member.full_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.full_name}
                          </div>
                          {member.phone && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.roles.map((role) => (
                            <Badge key={role.id} variant="secondary" size="sm">
                              {role.display_name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No roles
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusColors[member.status]} size="sm">
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(member.last_login_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${member.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(member.id, member.full_name)}
                          disabled={removing === member.id}
                          isLoading={removing === member.id}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <InviteTeamMemberModal
          userId={userId}
          userName={userName}
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
};
