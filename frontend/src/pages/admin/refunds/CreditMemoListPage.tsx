import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FilterCard,
  FilterToggleButton,
  Select,
  Input,
  Skeleton,
  AmountDisplay,
  ConfirmDialog,
} from '@/components/ui';
import { creditMemoService } from '@/services';
import type { CreditMemo } from '@/types/credit-memo.types';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'void', label: 'Void' },
];

type SortField = 'created_at' | 'credit_memo_number' | 'total_cents';
type SortOrder = 'asc' | 'desc';

export const CreditMemoListPage: React.FC = () => {
  // Data state
  const [creditMemos, setCreditMemos] = useState<CreditMemo[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'draft' | 'issued' | 'void' | ''>('');
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

  // Action state
  const [voidingMemo, setVoidingMemo] = useState<CreditMemo | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const fetchCreditMemos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await creditMemoService.listCreditMemos({
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
      setCreditMemos(response.credit_memos || []);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credit memos');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, propertyFilter, fromDate, toDate, sortField, sortOrder, currentPage]);

  useEffect(() => {
    fetchCreditMemos();
  }, [fetchCreditMemos]);

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

  const handleDownload = async (memo: CreditMemo) => {
    setDownloadingId(memo.id);
    try {
      const response = await creditMemoService.getCreditMemoDownloadUrl(memo.id);
      window.open(response.download_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download credit memo');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVoidConfirm = async () => {
    if (!voidingMemo) return;

    setIsVoiding(true);
    try {
      await creditMemoService.voidCreditMemo(voidingMemo.id);
      setSuccess('Credit memo voided successfully');
      await fetchCreditMemos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void credit memo');
    } finally {
      setIsVoiding(false);
      setVoidingMemo(null);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: CreditMemo['status']) => {
    switch (status) {
      case 'issued':
        return <Badge variant="success">Issued</Badge>;
      case 'void':
        return <Badge variant="error">Void</Badge>;
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Credit Memos
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and manage refund credit memos
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FilterToggleButton
              isActive={showFilters}
              onClick={() => setShowFilters(!showFilters)}
              count={activeFilterCount}
            />
          </div>

          {showFilters && (
            <FilterCard>
              <FilterCard.Search
                placeholder="Search by credit memo number, customer name, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterCard.Field label="Status">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'draft' | 'issued' | 'void' | '')}
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
          )}
        </div>

        {/* Alerts */}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
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
                <TableHeader onClick={() => handleSort('credit_memo_number')}>
                  Credit Memo # {getSortIcon('credit_memo_number')}
                </TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Booking ID</TableHeader>
                <TableHeader onClick={() => handleSort('total_cents')}>
                  Amount {getSortIcon('total_cents')}
                </TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader onClick={() => handleSort('created_at')}>
                  Created {getSortIcon('created_at')}
                </TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : creditMemos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {activeFilterCount > 0
                        ? 'No credit memos match your filters'
                        : 'No credit memos yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                creditMemos.map((memo) => (
                  <TableRow key={memo.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {memo.credit_memo_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {memo.customer_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {memo.customer_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {memo.booking_id?.slice(0, 8) || '-'}
                    </TableCell>
                    <TableCell>
                      <AmountDisplay
                        amount={Math.abs(memo.total_cents / 100)}
                        currency={memo.currency}
                        size="sm"
                        isCredit={true}
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(memo.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(memo.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(memo)}
                          isLoading={downloadingId === memo.id}
                          disabled={memo.status === 'void' || !memo.pdf_url || downloadingId === memo.id}
                        >
                          📄 PDF
                        </Button>
                        {memo.status === 'issued' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVoidingMemo(memo)}
                            className="border-error text-error hover:bg-error/10"
                          >
                            Void
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isLoading && creditMemos.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7}>
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

        {/* Void Confirmation Dialog */}
        {voidingMemo && (
          <ConfirmDialog
            title="Void Credit Memo"
            message={`Are you sure you want to void credit memo ${voidingMemo.credit_memo_number}? This action cannot be undone.`}
            confirmLabel="Void Credit Memo"
            variant="danger"
            isOpen={true}
            onConfirm={handleVoidConfirm}
            onCancel={() => setVoidingMemo(null)}
            isLoading={isVoiding}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
};
