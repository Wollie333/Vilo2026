import { useState } from 'react';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card, Button, Badge } from '../../components/ui';
import {
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
  EmptyState,
  EmptyStateNoData,
  EmptyStateNoResults,
  EmptyStateError,
} from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';

interface Booking {
  id: string;
  guest: string;
  property: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total: number;
}

const sampleData: Booking[] = [
  { id: '1', guest: 'John Smith', property: 'Beach House', checkIn: '2024-01-15', checkOut: '2024-01-20', status: 'confirmed', total: 1250 },
  { id: '2', guest: 'Sarah Johnson', property: 'Mountain Cabin', checkIn: '2024-01-18', checkOut: '2024-01-22', status: 'pending', total: 800 },
  { id: '3', guest: 'Mike Williams', property: 'City Apartment', checkIn: '2024-01-20', checkOut: '2024-01-25', status: 'confirmed', total: 950 },
  { id: '4', guest: 'Emily Brown', property: 'Lake View Villa', checkIn: '2024-01-22', checkOut: '2024-01-28', status: 'cancelled', total: 1500 },
  { id: '5', guest: 'David Lee', property: 'Beach House', checkIn: '2024-01-25', checkOut: '2024-01-30', status: 'confirmed', total: 1250 },
];

const statusColors = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
} as const;

export function DataDisplayShowcase() {
  const [sortField, setSortField] = useState<keyof Booking | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Selection hook for row selection demo
  const selection = useTableSelection(sampleData);

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...sampleData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Display Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Components for displaying data in tables and handling empty states.
          </p>
        </div>

        {/* Table Section */}
        <ComponentShowcase
          title="Table"
          description="Display tabular data with support for sorting, striping, and various styles."
        >
          <div className="space-y-8">
            {/* Basic Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Table</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader>Check-in</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.slice(0, 3).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>{booking.checkIn}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Striped Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Striped Variant</h4>
              <Table variant="striped">
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader>Check-in</TableHeader>
                    <TableHeader>Check-out</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>{booking.checkIn}</TableCell>
                      <TableCell>{booking.checkOut}</TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bordered Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Bordered Variant</h4>
              <Table variant="bordered">
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.slice(0, 3).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sortable Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sortable Headers</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader
                      sortable
                      sortDirection={sortField === 'guest' ? sortDirection : undefined}
                      onSort={() => handleSort('guest')}
                    >
                      Guest
                    </TableHeader>
                    <TableHeader
                      sortable
                      sortDirection={sortField === 'property' ? sortDirection : undefined}
                      onSort={() => handleSort('property')}
                    >
                      Property
                    </TableHeader>
                    <TableHeader
                      sortable
                      sortDirection={sortField === 'checkIn' ? sortDirection : undefined}
                      onSort={() => handleSort('checkIn')}
                    >
                      Check-in
                    </TableHeader>
                    <TableHeader
                      sortable
                      sortDirection={sortField === 'total' ? sortDirection : undefined}
                      onSort={() => handleSort('total')}
                      align="right"
                    >
                      Total
                    </TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>{booking.checkIn}</TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Compact Size */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Compact Size</h4>
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>
                        <Badge size="sm" variant={statusColors[booking.status]}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* With Footer */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Footer</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.slice(0, 3).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">Total Revenue</TableCell>
                    <TableCell align="right" className="font-semibold">
                      ${sampleData.slice(0, 3).reduce((sum, b) => sum + b.total, 0)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Row Selection with Checkboxes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Row Selection with Checkboxes</h4>
              <TableToolbar
                selectedCount={selection.selectedCount}
                onClearSelection={selection.deselectAll}
                actions={[
                  { label: 'Export', onClick: () => console.log('Export', selection.selectedItems) },
                  { label: 'Delete', onClick: () => console.log('Delete'), variant: 'danger' },
                ]}
              />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCheckboxCell
                      checked={selection.isAllSelected}
                      indeterminate={selection.isIndeterminate}
                      onChange={() => selection.isAllSelected ? selection.deselectAll() : selection.selectAll()}
                      ariaLabel="Select all"
                      asHeader
                    />
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((booking) => (
                    <TableRow key={booking.id} selected={selection.isSelected(booking.id)}>
                      <TableCheckboxCell
                        checked={selection.isSelected(booking.id)}
                        onChange={() => selection.toggleSelection(booking.id)}
                        ariaLabel={`Select ${booking.guest}`}
                      />
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* With Pagination */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Integrated Pagination</h4>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.slice(0, 3).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={5}
                        totalItems={25}
                        pageSize={5}
                        onPageChange={setCurrentPage}
                        showItemCount
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Loading State */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Loading State</h4>
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={isLoading ? 'primary' : 'outline'}
                  onClick={() => setIsLoading(!isLoading)}
                >
                  {isLoading ? 'Loading...' : 'Toggle Loading'}
                </Button>
              </div>
              <Table loading={isLoading}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Guest</TableHeader>
                    <TableHeader>Property</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.slice(0, 3).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest}</TableCell>
                      <TableCell>{booking.property}</TableCell>
                      <TableCell align="right">${booking.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentShowcase>

        {/* Table Props */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Table Props</h4>
          <PropsTable
            props={[
              { name: 'variant', type: "'default' | 'striped' | 'bordered'", default: "'default'", description: 'Visual style variant' },
              { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell padding size' },
              { name: 'loading', type: 'boolean', default: 'false', description: 'Show loading overlay with spinner' },
              { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Keep header visible on scroll' },
              { name: 'emptyState', type: 'ReactNode', description: 'Component to show when table is empty' },
            ]}
          />
        </div>

        {/* TableHeader Props */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">TableHeader Props</h4>
          <PropsTable
            props={[
              { name: 'sortable', type: 'boolean', default: 'false', description: 'Enable sorting (shows sort indicator)' },
              { name: 'sortDirection', type: "'asc' | 'desc' | null", description: 'Current sort direction' },
              { name: 'onSort', type: '() => void', description: 'Callback when clicked' },
              { name: 'align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Text alignment' },
              { name: 'width', type: 'string | number', description: 'Fixed column width' },
            ]}
          />
        </div>

        {/* TableCheckboxCell Props */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">TableCheckboxCell Props</h4>
          <PropsTable
            props={[
              { name: 'checked', type: 'boolean', required: true, description: 'Checkbox state' },
              { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Show indeterminate state (for select all)' },
              { name: 'onChange', type: '(checked: boolean) => void', required: true, description: 'Change handler' },
              { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable checkbox' },
              { name: 'ariaLabel', type: 'string', description: 'Accessibility label' },
              { name: 'asHeader', type: 'boolean', default: 'false', description: 'Render as th instead of td' },
            ]}
          />
        </div>

        {/* TablePagination Props */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">TablePagination Props</h4>
          <PropsTable
            props={[
              { name: 'currentPage', type: 'number', required: true, description: 'Current page (1-indexed)' },
              { name: 'totalPages', type: 'number', required: true, description: 'Total number of pages' },
              { name: 'totalItems', type: 'number', required: true, description: 'Total number of items' },
              { name: 'pageSize', type: 'number', required: true, description: 'Items per page' },
              { name: 'onPageChange', type: '(page: number) => void', required: true, description: 'Page change callback' },
              { name: 'showItemCount', type: 'boolean', default: 'true', description: 'Show "X-Y of Z items" text' },
              { name: 'showPageSizeSelector', type: 'boolean', default: 'false', description: 'Show page size dropdown' },
            ]}
          />
        </div>

        {/* TableToolbar Props */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">TableToolbar Props</h4>
          <PropsTable
            props={[
              { name: 'selectedCount', type: 'number', required: true, description: 'Number of selected items' },
              { name: 'onClearSelection', type: '() => void', required: true, description: 'Clear selection callback' },
              { name: 'actions', type: 'TableBulkAction[]', description: 'Array of bulk action buttons' },
            ]}
          />
        </div>

        {/* useTableSelection Hook */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">useTableSelection Hook</h4>
          <PropsTable
            props={[
              { name: 'items', type: 'T[]', required: true, description: 'Array of items with id property' },
              { name: 'options.onSelectionChange', type: '(ids: Set) => void', description: 'Selection change callback' },
            ]}
          />
          <Card className="p-4 bg-gray-50 dark:bg-dark-card">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Returns:</p>
            <code className="text-xs text-gray-600 dark:text-gray-400 block whitespace-pre">{`{
  selectedIds: Set<string>,
  isAllSelected: boolean,
  isIndeterminate: boolean,
  selectAll: () => void,
  deselectAll: () => void,
  toggleSelection: (id: string) => void,
  isSelected: (id: string) => boolean,
  selectedItems: T[],
  selectedCount: number
}`}</code>
          </Card>
        </div>

        {/* Empty State Section */}
        <ComponentShowcase
          title="Empty State"
          description="Display meaningful messages when there's no data to show."
        >
          <div className="space-y-8">
            {/* Custom Empty State */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Custom Empty State</h4>
              <Card className="p-8">
                <EmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="No properties found"
                  description="Get started by adding your first vacation rental property."
                  action={<Button>Add Property</Button>}
                />
              </Card>
            </div>

            {/* No Data Preset */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">No Data Preset</h4>
              <Card className="p-8">
                <EmptyStateNoData
                  title="No bookings yet"
                  description="When guests book your properties, they will appear here."
                  action={<Button onClick={() => console.log('View Properties')}>View Properties</Button>}
                />
              </Card>
            </div>

            {/* No Results Preset */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">No Search Results Preset</h4>
              <Card className="p-8">
                <EmptyStateNoResults
                  title="No results for 'beach house in mountains'"
                  description="Try adjusting your search or filters."
                  action={<Button variant="outline" onClick={() => console.log('Clear search')}>Clear Search</Button>}
                />
              </Card>
            </div>

            {/* Error Preset */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Error Preset</h4>
              <Card className="p-8">
                <EmptyStateError
                  title="Unable to load bookings"
                  description="There was a problem connecting to the server. Please check your connection and try again."
                  action={<Button onClick={() => console.log('Retry')}>Try Again</Button>}
                />
              </Card>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Size Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <EmptyState
                    size="sm"
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    title="Small"
                    description="Compact empty state"
                  />
                </Card>
                <Card className="p-4">
                  <EmptyState
                    size="md"
                    icon={
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    title="Medium"
                    description="Default empty state"
                  />
                </Card>
                <Card className="p-4">
                  <EmptyState
                    size="lg"
                    icon={
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    title="Large"
                    description="Prominent empty state"
                  />
                </Card>
              </div>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'icon', type: 'ReactNode', description: 'Icon to display above the title' },
            { name: 'title', type: 'string', required: true, description: 'Main heading text' },
            { name: 'description', type: 'string', description: 'Supporting description text' },
            { name: 'action', type: 'ReactNode', description: 'Action button or element' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
          ]}
        />
      </div>
    </AuthenticatedLayout>
  );
}
