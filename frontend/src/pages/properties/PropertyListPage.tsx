/**
 * PropertyListPage Component
 *
 * List all properties for the current user with search, filter, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { propertyService, companyService } from '@/services';
import type { PropertyWithCompany, PropertyLimitInfo } from '@/types/property.types';
import type { CompanyWithPropertyCount } from '@/types/company.types';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PropertyIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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

type SortField = 'name' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const PropertyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [companies, setCompanies] = useState<CompanyWithPropertyCount[]>([]);
  const [limitInfo, setLimitInfo] = useState<PropertyLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyWithCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (companyFilter) count++;
    if (statusFilter) count++;
    return count;
  }, [searchQuery, companyFilter, statusFilter]);

  // Fetch properties, companies, and limit info
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [propertiesRes, limitRes, companiesRes] = await Promise.all([
        propertyService.getMyProperties({
          search: searchQuery || undefined,
          is_active: statusFilter === '' ? undefined : statusFilter === 'active',
          company_id: companyFilter || undefined,
        }),
        propertyService.getPropertyLimit(),
        companyService.getMyCompanies({ is_active: true }),
      ]);

      setProperties(propertiesRes.properties);
      setLimitInfo(limitRes);
      setCompanies(companiesRes.companies);
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, companyFilter]);

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

  // Sort properties client-side
  const sortedProperties = [...properties].sort((a, b) => {
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
  const handleDeleteClick = (property: PropertyWithCompany, e: React.MouseEvent) => {
    e.stopPropagation();
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      await propertyService.deleteProperty(propertyToDelete.id);
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Build company filter options
  const companyOptions = [
    { value: '', label: 'All companies' },
    ...companies.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <AuthenticatedLayout title="Properties" subtitle="Manage your properties">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {limitInfo?.is_unlimited
                ? `${properties.length} properties`
                : `${limitInfo?.current_count || 0} of ${limitInfo?.max_allowed || 0} properties`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            <Button
              onClick={() => navigate('/manage/properties/new')}
              disabled={limitInfo ? !limitInfo.can_create : false}
            >
              <PlusIcon />
              <span className="ml-2">Add Property</span>
            </Button>
          </div>
        </div>

        {/* No Companies Warning */}
        {companies.length === 0 && !loading && (
          <Alert variant="warning">
            You need to create a company before you can add properties.{' '}
            <button
              onClick={() => navigate('/companies/new')}
              className="font-medium underline"
            >
              Create a company
            </button>
          </Alert>
        )}

        {/* Limit Warning */}
        {limitInfo && !limitInfo.is_unlimited && !limitInfo.can_create && (
          <Alert variant="warning">
            You have reached your property limit ({limitInfo.max_allowed}). Upgrade your plan to create more properties.
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
              placeholder="Search properties..."
              debounceMs={300}
            />
            <FilterCard.Field>
              <Select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                options={companyOptions}
              />
            </FilterCard.Field>
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
        ) : properties.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PropertyIcon />}
              title="No properties yet"
              description={
                companies.length === 0
                  ? 'Create a company first, then add your properties.'
                  : 'Create your first property to start managing your rentals.'
              }
              action={
                limitInfo?.can_create && companies.length > 0 ? (
                  <Button onClick={() => navigate('/manage/properties/new')}>
                    <PlusIcon />
                    <span className="ml-2">Create Property</span>
                  </Button>
                ) : companies.length === 0 ? (
                  <Button onClick={() => navigate('/companies/new')}>
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
                    Property Name
                  </TableHeader>
                  <TableHeader>Owner</TableHeader>
                  <TableHeader>Company</TableHeader>
                  <TableHeader>City</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader width={50}>{' '}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProperties.map((property) => (
                  <TableRow
                    key={property.id}
                    onClick={() => navigate(`/manage/properties/${property.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <p className="font-medium text-gray-900 dark:text-white">{property.name}</p>
                    </TableCell>
                    <TableCell>
                      {property.owner_id && property.owner_full_name ? (
                        <Link
                          to={`/admin/users/${property.owner_id}`}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-sm text-primary hover:text-primary/80 hover:underline font-medium"
                        >
                          {property.owner_full_name}
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.company_name ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{property.company_name}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.address_city ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{property.address_city}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.email ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{property.email}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.phone ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{property.phone}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={property.is_active ? 'success' : 'default'}>
                        {property.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(property, e)}
                        title="Delete property"
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
            setPropertyToDelete(null);
          }}
          title="Delete Property"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{propertyToDelete?.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPropertyToDelete(null);
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
