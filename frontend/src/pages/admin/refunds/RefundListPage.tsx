import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineRefresh } from 'react-icons/hi';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableFooter,
  TablePagination,
  FilterCard,
  FilterToggleButton,
  Select,
  Input,
  Skeleton,
  RefundStatusBadge,
  AmountDisplay,
} from '@/components/ui';
import { refundService } from '@/services';
import type { RefundRequestWithDetails, RefundStatus } from '@/types/refund.types';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

type SortField = 'created_at' | 'requested_amount' | 'approved_amount';
type SortOrder = 'asc' | 'desc';

export const RefundListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data state
  const [refunds, setRefunds] = useState<RefundRequestWithDetails[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter) count++;
    if (propertyFilter) count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [search, statusFilter, propertyFilter, fromDate, toDate]);

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await refundService.listRefunds({
        search: search || undefined,
        status: statusFilter || undefined,
        property_id: propertyFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
        page: currentPage,
        limit: 20,
      });
      setRefunds(response.refunds || []);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, propertyFilter, fromDate, toDate, sortField, sortOrder, currentPage]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPropertyFilter('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const handleViewDetails = (refundId: string) => {
    navigate(`/admin/refunds/${refundId}`);
  };

  const handleRefresh = () => {
    fetchRefunds();
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Refund Management
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {total} refund{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            <Button variant="outline" onClick={handleRefresh} className="hidden sm:flex">
              <HiOutlineRefresh className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div>
            <FilterCard>
              <FilterCard.Search
                placeholder="Search by booking reference, guest name, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterCard.Field label="Status">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
                    options={statusOptions}
                  />
                </FilterCard.Field>

                <FilterCard.Field label="Property ID">
                  <Input
                    value={propertyFilter}
                    onChange={(e) => setPropertyFilter(e.target.value)}
                    placeholder="Property ID"
                  />
                </FilterCard.Field>

                <FilterCard.Field label="From Date">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </FilterCard.Field>

                <FilterCard.Field label="To Date">
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </FilterCard.Field>
              </div>

              <FilterCard.Actions onClear={handleClearFilters} />
            </FilterCard>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader onClick={() => handleSort('created_at')}>
                  Request Date {getSortIcon('created_at')}
                </TableHeader>
                <TableHeader>Booking Reference</TableHeader>
                <TableHeader>Guest</TableHeader>
                <TableHeader>Property</TableHeader>
                <TableHeader onClick={() => handleSort('requested_amount')}>
                  Requested {getSortIcon('requested_amount')}
                </TableHeader>
                <TableHeader onClick={() => handleSort('approved_amount')}>
                  Approved {getSortIcon('approved_amount')}
                </TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : refunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {activeFilterCount > 0
                        ? 'No refunds match your filters'
                        : 'No refund requests yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      {new Date(refund.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {refund.booking?.booking_reference || refund.booking_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {refund.requested_by_user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {refund.requested_by_user?.email || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {refund.booking?.property_id.slice(0, 8) || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <AmountDisplay
                        amount={refund.requested_amount}
                        currency={refund.booking?.currency || 'ZAR'}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      {refund.approved_amount !== null ? (
                        <AmountDisplay
                          amount={refund.approved_amount}
                          currency={refund.booking?.currency || 'ZAR'}
                          size="sm"
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RefundStatusBadge status={refund.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(refund.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isLoading && refunds.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8}>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={total}
                      pageSize={20}
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
