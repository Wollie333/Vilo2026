import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Badge, Avatar, Spinner, Alert, Modal, ConfirmDialog } from '@/components/ui';
import { usersService } from '@/services';
import type { UserProfile } from '@/types/auth.types';

export const PendingApprovalsPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Action states
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Bulk action states
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Expanded user details
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Sort state
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchPendingUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingUsers = await usersService.listPendingUsers();
      setUsers(pendingUsers);
      setSelectedUsers(new Set());
      setIsAllSelected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const sortedUsers = [...users].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      await usersService.approveUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccess('User approved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    setIsRejecting(true);
    try {
      await usersService.updateUser(rejectingUser.id, { status: 'deactivated' });
      setUsers((prev) => prev.filter((u) => u.id !== rejectingUser.id));
      setRejectingUser(null);
      setSuccess('User registration rejected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers(new Set());
      setIsAllSelected(false);
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
      setIsAllSelected(true);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    setIsAllSelected(newSelection.size === users.length);
  };

  const handleBulkApprove = async () => {
    setIsBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedUsers).map((userId) => usersService.approveUser(userId))
      );
      setSuccess(`Successfully approved ${selectedUsers.size} user(s)`);
      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      setIsAllSelected(false);
      setBulkAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve users');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    setIsBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedUsers).map((userId) =>
          usersService.updateUser(userId, { status: 'deactivated' })
        )
      );
      setSuccess(`Successfully rejected ${selectedUsers.size} user(s)`);
      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      setIsAllSelected(false);
      setBulkAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject users');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  return (
    <AuthenticatedLayout title="Pending Approvals" subtitle="Review and approve new user registrations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {users.length} pending registration{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedUsers.size} user(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBulkAction('approve')}
              >
                Approve All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                onClick={() => setBulkAction('reject')}
              >
                Reject All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUsers(new Set());
                  setIsAllSelected(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Alerts */}
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
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              There are no pending user approvals at the moment.
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Select all
              </span>
            </div>

            <div className="space-y-4">
              {sortedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden ${
                    selectedUsers.has(user.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Main content */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                        />
                        <Avatar
                          src={user.avatar_url || undefined}
                          name={user.full_name || user.email}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {user.full_name || 'No name'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {user.phone}
                              </span>
                            )}
                            {user.company_name && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {user.company_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Registered {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-shrink-0">
                        <Badge variant="warning">Pending</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            isLoading={approvingId === user.id}
                            disabled={approvingId !== null}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                            onClick={() => setRejectingUser(user)}
                            disabled={approvingId !== null}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className="mt-4 flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                    >
                      {expandedUserId === user.id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide details
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show more details
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expandedUserId === user.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-dark-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Contact Information
                          </h4>
                          <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                              <dd className="text-gray-900 dark:text-white">{user.email}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                              <dd className="text-gray-900 dark:text-white">{user.phone || 'Not provided'}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500 dark:text-gray-400">Company</dt>
                              <dd className="text-gray-900 dark:text-white">{user.company_name || 'Not provided'}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500 dark:text-gray-400">Timezone</dt>
                              <dd className="text-gray-900 dark:text-white">{user.timezone}</dd>
                            </div>
                          </dl>
                        </div>
                        {(user.address_street || user.address_city) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Address
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {[
                                user.address_street,
                                user.address_city,
                                user.address_state,
                                user.address_postal_code,
                                user.address_country,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          View full profile →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reject Confirmation Modal */}
        <Modal isOpen={!!rejectingUser} onClose={() => setRejectingUser(null)}>
          <Modal.Header>Reject User</Modal.Header>
          <Modal.Body>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to reject the registration for{' '}
              <strong className="text-gray-900 dark:text-white">
                {rejectingUser?.full_name || rejectingUser?.email}
              </strong>
              ? This will deactivate their account.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setRejectingUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              isLoading={isRejecting}
            >
              Reject User
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Bulk Approve Confirmation */}
        <ConfirmDialog
          isOpen={bulkAction === 'approve'}
          onClose={() => setBulkAction(null)}
          onConfirm={handleBulkApprove}
          title="Approve All Selected"
          message={`Are you sure you want to approve ${selectedUsers.size} user(s)? They will be able to log in immediately.`}
          confirmText="Approve All"
          variant="info"
          isLoading={isBulkActionLoading}
        />

        {/* Bulk Reject Confirmation */}
        <ConfirmDialog
          isOpen={bulkAction === 'reject'}
          onClose={() => setBulkAction(null)}
          onConfirm={handleBulkReject}
          title="Reject All Selected"
          message={`Are you sure you want to reject ${selectedUsers.size} user(s)? Their accounts will be deactivated.`}
          confirmText="Reject All"
          variant="danger"
          isLoading={isBulkActionLoading}
        />
      </div>
    </AuthenticatedLayout>
  );
};
