import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Badge,
  Avatar,
  Alert,
  ConfirmDialog,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableFooter,
  TableCheckboxCell,
  TableToolbar,
  TablePagination,
  useTableSelection,
  FilterCard,
  FilterToggleButton,
  Select,
  Skeleton,
} from '@/components/ui';
import { usersService, rolesService } from '@/services';
import type { UserProfile, UserStatus, Role } from '@/types/auth.types';

const statusColors: Record<UserStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
  deactivated: 'default',
};

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];

type SortField = 'full_name' | 'email' | 'status' | 'created_at' | 'last_login_at';
type SortOrder = 'asc' | 'desc';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [roleFilter, setRoleFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state using the hook
  const selection = useTableSelection(users);

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<'suspend' | 'activate' | 'deactivate' | 'delete' | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Quick action state
  const [quickActionUser, setQuickActionUser] = useState<{
    user: UserProfile;
    action: 'suspend' | 'activate';
  } | null>(null);
  const [isQuickActionLoading, setIsQuickActionLoading] = useState(false);

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter) count++;
    if (roleFilter) count++;
    return count;
  }, [search, statusFilter, roleFilter]);

  // Fetch roles once
  useEffect(() => {
    rolesService.listRoles().then(setRoles).catch(console.error);
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersService.listUsers({
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        page: currentPage,
        limit: 10,
      });
      setUsers(response.data || []);
      if (response.meta?.pagination) {
        setTotalPages(response.meta.pagination.totalPages);
        setTotal(response.meta.pagination.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, roleFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clear selection when users change
  useEffect(() => {
    selection.deselectAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort users client-side
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | number | null = null;
    let bVal: string | number | null = null;

    switch (sortField) {
      case 'full_name':
        aVal = a.full_name || '';
        bVal = b.full_name || '';
        break;
      case 'email':
        aVal = a.email;
        bVal = b.email;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'created_at':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case 'last_login_at':
        aVal = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
        bVal = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleBulkAction = async () => {
    if (!bulkAction || selection.selectedCount === 0) return;

    setIsBulkActionLoading(true);
    try {
      if (bulkAction === 'delete') {
        // Handle hard deletion (permanent)
        await Promise.all(
          Array.from(selection.selectedIds).map((userId) =>
            usersService.hardDeleteUser(userId)
          )
        );
        setSuccess(`Successfully deleted ${selection.selectedCount} user(s) permanently`);
      } else {
        // Handle status updates
        const newStatus: UserStatus = bulkAction === 'suspend'
          ? 'suspended'
          : bulkAction === 'activate'
            ? 'active'
            : 'deactivated';

        await Promise.all(
          Array.from(selection.selectedIds).map((userId) =>
            usersService.updateUser(userId, { status: newStatus })
          )
        );

        setSuccess(`Successfully ${bulkAction}d ${selection.selectedCount} user(s)`);
      }

      setBulkAction(null);
      selection.deselectAll();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleQuickAction = async () => {
    if (!quickActionUser) return;

    setIsQuickActionLoading(true);
    try {
      const newStatus: UserStatus = quickActionUser.action === 'suspend' ? 'suspended' : 'active';
      await usersService.updateUser(quickActionUser.user.id, { status: newStatus });
      setSuccess(`User ${quickActionUser.action}d successfully`);
      setQuickActionUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setIsQuickActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Status', 'Phone', 'Company', 'Joined', 'Last Login'];
    const rows = users.map((u) => [
      u.full_name || '',
      u.email,
      u.status,
      u.phone || '',
      u.company_name || '',
      new Date(u.created_at).toLocaleDateString(),
      u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getBulkActionConfig = () => {
    switch (bulkAction) {
      case 'suspend':
        return {
          title: 'Suspend Users',
          message: `Are you sure you want to suspend ${selection.selectedCount} user(s)? They will not be able to log in.`,
          confirmText: 'Suspend All',
          variant: 'warning' as const,
        };
      case 'activate':
        return {
          title: 'Activate Users',
          message: `Are you sure you want to activate ${selection.selectedCount} user(s)?`,
          confirmText: 'Activate All',
          variant: 'info' as const,
        };
      case 'deactivate':
        return {
          title: 'Deactivate Users',
          message: `Are you sure you want to deactivate ${selection.selectedCount} user(s)? This action is typically permanent.`,
          confirmText: 'Deactivate All',
          variant: 'danger' as const,
        };
      case 'delete':
        return {
          title: 'Delete Users',
          message: `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${selection.selectedCount} user(s)? This action cannot be undone. All user data, subscriptions, and related records will be deleted.`,
          confirmText: 'Delete All',
          variant: 'danger' as const,
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'info' as const };
    }
  };

  const bulkConfig = getBulkActionConfig();

  return (
    <AuthenticatedLayout title="Users" subtitle="Manage user accounts and permissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {total} total users
            </p>
          </div>
          <div className="flex gap-2">
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            <Button variant="outline" onClick={exportToCSV}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
            {isSuperAdmin && (
              <Button variant="primary" onClick={() => navigate('/admin/users/new')}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create User
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <FilterCard>
            <FilterCard.Search
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search by name or email..."
              debounceMs={300}
            />
            <FilterCard.Field>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | '');
                  setCurrentPage(1);
                }}
                options={statusOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All roles' },
                  ...roles.map((role) => ({
                    value: role.id,
                    label: role.display_name,
                  })),
                ]}
              />
            </FilterCard.Field>
          </FilterCard>
        )}

        {/* Bulk Actions Toolbar */}
        <TableToolbar
          selectedCount={selection.selectedCount}
          onClearSelection={selection.deselectAll}
          actions={[
            { label: 'Activate', onClick: () => setBulkAction('activate') },
            { label: 'Suspend', onClick: () => setBulkAction('suspend'), variant: 'warning' },
            { label: 'Deactivate', onClick: () => setBulkAction('deactivate'), variant: 'danger' },
            { label: 'Delete All', onClick: () => setBulkAction('delete'), variant: 'danger' },
          ]}
        />

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

        {/* Users Table */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableCheckboxCell
                  checked={selection.isAllSelected}
                  indeterminate={selection.isIndeterminate}
                  onChange={() => selection.isAllSelected ? selection.deselectAll() : selection.selectAll()}
                  ariaLabel="Select all users"
                  asHeader
                  disabled={isLoading}
                />
                <TableHeader
                  sortable
                  sortDirection={sortField === 'full_name' ? sortOrder : null}
                  onSort={() => handleSort('full_name')}
                >
                  User
                </TableHeader>
                <TableHeader
                  sortable
                  sortDirection={sortField === 'status' ? sortOrder : null}
                  onSort={() => handleSort('status')}
                >
                  Status
                </TableHeader>
                <TableHeader
                  sortable
                  sortDirection={sortField === 'last_login_at' ? sortOrder : null}
                  onSort={() => handleSort('last_login_at')}
                >
                  Last Login
                </TableHeader>
                <TableHeader
                  sortable
                  sortDirection={sortField === 'created_at' ? sortOrder : null}
                  onSort={() => handleSort('created_at')}
                >
                  Joined
                </TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="w-12">
                      <Skeleton variant="rectangular" width={18} height={18} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="ml-4 space-y-2">
                          <Skeleton variant="text" width={120} height={14} />
                          <Skeleton variant="text" width={160} height={12} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={70} height={22} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} height={14} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} height={14} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="text" width={40} height={14} />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    selected={selection.isSelected(user.id)}
                  >
                    <TableCheckboxCell
                      checked={selection.isSelected(user.id)}
                      onChange={() => selection.toggleSelection(user.id)}
                      ariaLabel={`Select ${user.full_name || user.email}`}
                    />
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatar_url || undefined}
                          name={user.full_name || user.email}
                          size="md"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[user.status]}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'active' && (
                          <button
                            onClick={() => setQuickActionUser({ user, action: 'suspend' })}
                            className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Suspend"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => setQuickActionUser({ user, action: 'activate' })}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Activate"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-primary hover:text-primary-600"
                        >
                          View
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isLoading && totalPages > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={total}
                      pageSize={10}
                      onPageChange={setCurrentPage}
                      showItemCount
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        {/* Bulk Action Confirmation */}
        <ConfirmDialog
          isOpen={bulkAction !== null}
          onClose={() => setBulkAction(null)}
          onConfirm={handleBulkAction}
          title={bulkConfig.title}
          message={bulkConfig.message}
          confirmText={bulkConfig.confirmText}
          variant={bulkConfig.variant}
          isLoading={isBulkActionLoading}
        />

        {/* Quick Action Confirmation */}
        <ConfirmDialog
          isOpen={quickActionUser !== null}
          onClose={() => setQuickActionUser(null)}
          onConfirm={handleQuickAction}
          title={quickActionUser?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
          message={
            quickActionUser?.action === 'suspend'
              ? `Are you sure you want to suspend ${quickActionUser?.user.full_name || quickActionUser?.user.email}?`
              : `Are you sure you want to activate ${quickActionUser?.user.full_name || quickActionUser?.user.email}?`
          }
          confirmText={quickActionUser?.action === 'suspend' ? 'Suspend' : 'Activate'}
          variant={quickActionUser?.action === 'suspend' ? 'warning' : 'info'}
          isLoading={isQuickActionLoading}
        />
      </div>
    </AuthenticatedLayout>
  );
};
