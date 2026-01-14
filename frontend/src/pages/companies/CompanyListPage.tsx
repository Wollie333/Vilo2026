/**
 * CompanyListPage Component
 *
 * List all companies for the current user with search, filter, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  FilterCard,
  FilterToggleButton,
  EmptyState,
  Modal,
  Select,
} from '@/components/ui';
import { companyService } from '@/services';
import type { CompanyWithPropertyCount, CompanyLimitInfo } from '@/types/company.types';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

type SortField = 'name' | 'created_at' | 'property_count';
type SortOrder = 'asc' | 'desc';

export const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithPropertyCount[]>([]);
  const [limitInfo, setLimitInfo] = useState<CompanyLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyWithPropertyCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter) count++;
    return count;
  }, [searchQuery, statusFilter]);

  // Fetch companies and limit info
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [companiesRes, limitRes] = await Promise.all([
        companyService.getMyCompanies({
          search: searchQuery || undefined,
          is_active: statusFilter === '' ? undefined : statusFilter === 'active',
        }),
        companyService.getCompanyLimit(),
      ]);

      setCompanies(companiesRes.companies);
      setLimitInfo(limitRes);
    } catch (err) {
      setError('Failed to load companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort companies client-side
  const sortedCompanies = [...companies].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case 'property_count':
        aVal = a.property_count;
        bVal = b.property_count;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Handle delete
  const handleDeleteClick = (company: CompanyWithPropertyCount, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      await companyService.deleteCompany(companyToDelete.id);
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthenticatedLayout title="Companies" subtitle="Manage your companies">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {limitInfo?.is_unlimited
                ? `${companies.length} companies`
                : `${limitInfo?.current_count || 0} of ${limitInfo?.max_allowed || 0} companies`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            <Button
              onClick={() => navigate('/manage/companies/new')}
              disabled={limitInfo ? !limitInfo.can_create : false}
            >
              <PlusIcon />
              <span className="ml-2">Add Company</span>
            </Button>
          </div>
        </div>

        {/* Limit Warning */}
        {limitInfo && !limitInfo.is_unlimited && !limitInfo.can_create && (
          <Alert variant="warning">
            You have reached your company limit ({limitInfo.max_allowed}). Upgrade your plan to create more companies.
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <FilterCard>
            <FilterCard.Search
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search companies..."
              debounceMs={300}
            />
            <FilterCard.Field>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
                options={statusOptions}
              />
            </FilterCard.Field>
          </FilterCard>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : companies.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BuildingIcon />}
              title="No companies yet"
              description="Create your first company to start managing your properties."
              action={
                limitInfo?.can_create ? (
                  <Button onClick={() => navigate('/manage/companies/new')}>
                    <PlusIcon />
                    <span className="ml-2">Create Company</span>
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader
                    sortable
                    sortDirection={sortField === 'name' ? sortOrder : null}
                    onSort={() => handleSort('name')}
                  >
                    Company
                  </TableHeader>
                  <TableHeader
                    sortable
                    sortDirection={sortField === 'property_count' ? sortOrder : null}
                    onSort={() => handleSort('property_count')}
                  >
                    Properties
                  </TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader
                    sortable
                    sortDirection={sortField === 'created_at' ? sortOrder : null}
                    onSort={() => handleSort('created_at')}
                  >
                    Created
                  </TableHeader>
                  <TableHeader width={50}>{' '}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCompanies.map((company) => (
                  <TableRow
                    key={company.id}
                    onClick={() => navigate(`/manage/companies/${company.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {company.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                          {company.display_name && company.display_name !== company.name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {company.display_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.property_count > 0 ? 'primary' : 'default'}>
                        {company.property_count} {company.property_count === 1 ? 'property' : 'properties'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm" onClick={(e) => e.stopPropagation()}>
                        {company.contact_email && (
                          <a
                            href={`mailto:${company.contact_email}`}
                            className="block text-gray-900 dark:text-white hover:text-primary hover:underline"
                          >
                            {company.contact_email}
                          </a>
                        )}
                        {company.contact_phone && (
                          <a
                            href={`tel:${company.contact_phone}`}
                            className="block text-gray-500 dark:text-gray-400 hover:text-primary hover:underline"
                          >
                            {company.contact_phone}
                          </a>
                        )}
                        {!company.contact_email && !company.contact_phone && (
                          <span className="text-gray-400 dark:text-gray-500">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? 'success' : 'default'}>
                        {company.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(company.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(company, e)}
                        disabled={company.property_count > 0}
                        title={
                          company.property_count > 0
                            ? 'Cannot delete company with properties'
                            : 'Delete company'
                        }
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
          }}
          title="Delete Company"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{companyToDelete?.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCompanyToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
};
