import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Skeleton,
} from '@/components/ui';
import { customerService } from '@/services/customer.service';
import type {
  CustomerWithCompany,
  CustomerStatus,
  CustomerSource,
  CustomerListParams,
} from '@/types/customer.types';
import {
  CUSTOMER_STATUS_COLORS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from '@/types/customer.types';
import { Download, Users } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'past_guest', label: 'Past Guest' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'booking', label: 'Booking' },
  { value: 'chat', label: 'Chat' },
  { value: 'website_inquiry', label: 'Website Inquiry' },
  { value: 'manual', label: 'Manual' },
  { value: 'import', label: 'Import' },
  { value: 'referral', label: 'Referral' },
];

type SortField = 'full_name' | 'email' | 'created_at' | 'total_bookings' | 'total_spent' | 'last_booking_date';
type SortOrder = 'asc' | 'desc';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data state
  const [customers, setCustomers] = useState<CustomerWithCompany[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<CustomerSource | ''>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Export loading state
  const [isExporting, setIsExporting] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter) count++;
    if (sourceFilter) count++;
    return count;
  }, [search, statusFilter, sourceFilter]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: CustomerListParams = {
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page: currentPage,
        limit: 20,
        sortBy: sortField,
        sortOrder: sortOrder,
      };

      const response = await customerService.listCustomers(params);
      setCustomers(response.customers || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sourceFilter, currentPage, sortField, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch all customers (without pagination) for export
      const response = await customerService.listCustomers({
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        limit: 10000, // Large limit to get all
      });

      await customerService.exportCustomersToCSV(response.customers);
      setSuccess('Customers exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRowClick = (customerId: string) => {
    navigate(`/manage/customers/${customerId}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AuthenticatedLayout
      title="Customers"
      subtitle="Manage your customer relationships"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <FilterToggleButton
            showFilters={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            activeCount={activeFilterCount}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || customers.length === 0}
              isLoading={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => navigate('/manage/customers/new')}>
              Add Customer
            </Button>
          </div>
        </div>

        {showFilters && (
          <FilterCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value as CustomerStatus | '');
                    setCurrentPage(1);
                  }}
                  options={statusOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <Select
                  value={sourceFilter}
                  onChange={(value) => {
                    setSourceFilter(value as CustomerSource | '');
                    setCurrentPage(1);
                  }}
                  options={sourceOptions}
                />
              </div>
            </div>
          </FilterCard>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader
                  sortable
                  sorted={sortField === 'full_name'}
                  sortDirection={sortOrder}
                  onSort={() => handleSort('full_name')}
                >
                  Customer
                </TableHeader>
                <TableHeader
                  sortable
                  sorted={sortField === 'email'}
                  sortDirection={sortOrder}
                  onSort={() => handleSort('email')}
                >
                  Email
                </TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Source</TableHeader>
                <TableHeader
                  sortable
                  sorted={sortField === 'total_bookings'}
                  sortDirection={sortOrder}
                  onSort={() => handleSort('total_bookings')}
                  className="text-right"
                >
                  Bookings
                </TableHeader>
                <TableHeader
                  sortable
                  sorted={sortField === 'total_spent'}
                  sortDirection={sortOrder}
                  onSort={() => handleSort('total_spent')}
                  className="text-right"
                >
                  Total Spent
                </TableHeader>
                <TableHeader
                  sortable
                  sorted={sortField === 'last_booking_date'}
                  sortDirection={sortOrder}
                  onSort={() => handleSort('last_booking_date')}
                >
                  Last Booking
                </TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {activeFilterCount > 0
                        ? 'No customers found matching your filters'
                        : 'No customers yet'}
                    </p>
                    {activeFilterCount === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Customers will appear here when guests make bookings
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => handleRowClick(customer.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {customer.full_name || 'No name'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.company.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {customer.email}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {customer.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CUSTOMER_STATUS_COLORS[customer.status] as any}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {CUSTOMER_SOURCE_LABELS[customer.source]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {customer.total_bookings}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(customer.total_spent, customer.currency)}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {formatDate(customer.last_booking_date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isLoading && customers.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8}>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={total}
                      itemsPerPage={20}
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
