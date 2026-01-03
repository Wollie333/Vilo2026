import React, { useState, useEffect, useCallback } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Badge,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableFooter,
  TablePagination,
} from '@/components/ui';
import { auditService } from '@/services';
import type { AuditLog } from '@/services/audit.service';

const actionColors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  'user.created': 'success',
  'user.approved': 'success',
  'user.activated': 'success',
  'user.updated': 'info',
  'user.login': 'info',
  'user.logout': 'default',
  'user.suspended': 'warning',
  'user.deleted': 'error',
  'role.assigned': 'info',
  'role.removed': 'warning',
  'role.created': 'success',
  'role.updated': 'info',
  'role.deleted': 'error',
  'permission.granted': 'success',
  'permission.denied': 'warning',
  'permission.removed': 'error',
  'property.assigned': 'info',
  'property.removed': 'warning',
};

const formatAction = (action: string): string => {
  return action
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const AuditLogPage: React.FC = () => {
  // Data state
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [entityType, setEntityType] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditService.listAuditLogs({
        entityType: entityType || undefined,
        action: actionFilter || undefined,
        page: currentPage,
        limit: 20,
      });
      setLogs(response.logs || []);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, actionFilter, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleRowExpand = (logId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Action', 'Entity Type', 'Entity ID', 'Actor ID', 'IP Address'];
    const rows = logs.map((log) => [
      formatDate(log.created_at),
      log.action,
      log.entity_type,
      log.entity_id,
      log.actor_id || 'N/A',
      log.ip_address || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderDataDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData && !newData) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
        {oldData && (
          <div className="mb-2">
            <span className="font-medium text-red-600 dark:text-red-400">Before:</span>
            <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div>
            <span className="font-medium text-green-600 dark:text-green-400">After:</span>
            <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <AuthenticatedLayout title="Audit Logs" subtitle="View system activity and changes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {total} total entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchLogs}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All entity types</option>
              <option value="user">User</option>
              <option value="role">Role</option>
              <option value="permission">Permission</option>
              <option value="property">Property</option>
              <option value="session">Session</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All actions</option>
              <optgroup label="User Actions">
                <option value="user.created">User Created</option>
                <option value="user.updated">User Updated</option>
                <option value="user.deleted">User Deleted</option>
                <option value="user.approved">User Approved</option>
                <option value="user.suspended">User Suspended</option>
                <option value="user.activated">User Activated</option>
                <option value="user.login">User Login</option>
                <option value="user.logout">User Logout</option>
              </optgroup>
              <optgroup label="Role Actions">
                <option value="role.assigned">Role Assigned</option>
                <option value="role.removed">Role Removed</option>
                <option value="role.created">Role Created</option>
                <option value="role.updated">Role Updated</option>
                <option value="role.deleted">Role Deleted</option>
              </optgroup>
              <optgroup label="Permission Actions">
                <option value="permission.granted">Permission Granted</option>
                <option value="permission.denied">Permission Denied</option>
                <option value="permission.removed">Permission Removed</option>
              </optgroup>
            </select>
            {(entityType || actionFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEntityType('');
                  setActionFilter('');
                  setCurrentPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
          <Table loading={isLoading}>
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: '40px' }}>{''}</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Entity</TableHeader>
                <TableHeader>Actor</TableHeader>
                <TableHeader>IP Address</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className={expandedRows.has(log.id) ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                    >
                      <TableCell>
                        {(log.old_data || log.new_data) && (
                          <button
                            onClick={() => toggleRowExpand(log.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedRows.has(log.id) ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(log.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionColors[log.action] || 'default'}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {log.entity_type}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2 font-mono text-xs">
                            {log.entity_id.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.actor_id ? (
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                            {log.actor_id.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {log.ip_address || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (log.old_data || log.new_data) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 dark:bg-gray-800/50">
                          {renderDataDiff(log.old_data, log.new_data)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
            {totalPages > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={total}
                      pageSize={20}
                      onPageChange={setCurrentPage}
                      showItemCount
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
