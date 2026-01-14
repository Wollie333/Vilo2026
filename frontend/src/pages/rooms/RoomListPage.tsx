/**
 * RoomListPage Component
 *
 * List all rooms across all properties with search, filter, and CRUD operations.
 * Displays rooms in a responsive grid layout using RoomCard components.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  FilterCard,
  FilterToggleButton,
  EmptyState,
  Modal,
  Select,
  Card,
  Pagination,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Badge,
  ViewModeSelector,
} from '@/components/ui';
import { useViewMode } from '@/hooks';
import { RoomCard } from '@/components/features';
import { roomService, propertyService } from '@/services';
import type { RoomWithDetails, RoomLimitInfo, PricingMode, RoomListParams } from '@/types/room.types';
import type { PropertyWithCompany } from '@/types/property.types';
import {
  HiOutlinePlus,
  HiOutlineHome,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePause,
  HiOutlinePlay,
} from 'react-icons/hi';

// ============================================================================
// Types
// ============================================================================

type SortField = 'name' | 'base_price_per_night' | 'created_at' | 'completeness_score';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Filter Options
// ============================================================================

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'inactive', label: 'Inactive' },
];

const pricingModeOptions = [
  { value: '', label: 'All pricing modes' },
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'per_person_sharing', label: 'Per Person Sharing' },
];

const sortOptions = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'base_price_per_night:asc', label: 'Price (Low to High)' },
  { value: 'base_price_per_night:desc', label: 'Price (High to Low)' },
  { value: 'completeness_score:desc', label: 'Completeness (High to Low)' },
];

// ============================================================================
// Component
// ============================================================================

export const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data state
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [limitInfo, setLimitInfo] = useState<RoomLimitInfo | null>(null);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode('rooms-list-view', 'table');

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [propertyFilter, setPropertyFilter] = useState(searchParams.get('property_id') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pricingModeFilter, setPricingModeFilter] = useState(searchParams.get('pricing_mode') || '');
  const [sortValue, setSortValue] = useState(
    searchParams.get('sort') || 'created_at:desc'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const limit = 12; // Items per page

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<RoomWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parse sort value
  const [sortField, sortOrder] = sortValue.split(':') as [SortField, SortOrder];

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (propertyFilter) count++;
    if (statusFilter) count++;
    if (pricingModeFilter) count++;
    return count;
  }, [searchQuery, propertyFilter, statusFilter, pricingModeFilter]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter params
      const params: RoomListParams = {
        search: searchQuery || undefined,
        property_id: propertyFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        is_paused: statusFilter === 'paused' ? true : undefined,
        pricing_mode: pricingModeFilter as PricingMode || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
        page,
        limit,
      };

      // Fetch rooms, limit info, and properties
      const [roomsRes, limitRes, propertiesRes] = await Promise.all([
        roomService.listRooms(params),
        roomService.getRoomLimit(),
        propertyService.getMyProperties(),
      ]);

      setRooms(roomsRes.rooms);
      setTotalRooms(roomsRes.total);
      setTotalPages(roomsRes.totalPages);
      setLimitInfo(limitRes);
      setProperties(propertiesRes.properties);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, propertyFilter, statusFilter, pricingModeFilter, sortField, sortOrder, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (propertyFilter) params.set('property_id', propertyFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (pricingModeFilter) params.set('pricing_mode', pricingModeFilter);
    if (sortValue !== 'created_at:desc') params.set('sort', sortValue);
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [searchQuery, propertyFilter, statusFilter, pricingModeFilter, sortValue, page, setSearchParams]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRoomClick = (room: RoomWithDetails) => {
    navigate(`/manage/rooms/${room.id}`);
  };

  const handleEditRoom = (room: RoomWithDetails) => {
    navigate(`/manage/rooms/${room.id}`, { state: { edit: true } });
  };

  const handleDeleteClick = (room: RoomWithDetails) => {
    setRoomToDelete(room);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setIsDeleting(true);
      await roomService.deleteRoom(roomToDelete.id);
      setDeleteModalOpen(false);
      setRoomToDelete(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePause = async (room: RoomWithDetails) => {
    try {
      if (room.is_paused) {
        await roomService.unpauseRoom(room.id);
      } else {
        await roomService.pauseRoom(room.id);
      }
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room status';
      setError(errorMessage);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================================
  // Build Options
  // ============================================================================

  const propertyOptions = [
    { value: '', label: 'All properties' },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout title="Rooms" subtitle="Manage your rooms across all properties">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rooms</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {limitInfo?.is_unlimited
                ? `${totalRooms} rooms`
                : `${limitInfo?.current_count || 0} of ${limitInfo?.max_allowed || 0} rooms`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            {/* View Mode Selector */}
            <ViewModeSelector
              value={viewMode}
              onChange={setViewMode}
              storageKey="rooms-list-view"
            />
            <Button
              onClick={() => navigate('/manage/rooms/new')}
              disabled={limitInfo ? !limitInfo.can_create : false}
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span className="ml-2">Add Room</span>
            </Button>
          </div>
        </div>

        {/* No Properties Warning */}
        {properties.length === 0 && !loading && (
          <Alert variant="warning">
            You need to create a property before you can add rooms.{' '}
            <button
              onClick={() => navigate('/manage/properties/new')}
              className="font-medium underline"
            >
              Create a property
            </button>
          </Alert>
        )}

        {/* Limit Warning */}
        {limitInfo && !limitInfo.is_unlimited && !limitInfo.can_create && (
          <Alert variant="warning">
            You have reached your room limit ({limitInfo.max_allowed}). Upgrade your plan to create more rooms.
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
              placeholder="Search rooms..."
              debounceMs={300}
            />
            <FilterCard.Field>
              <Select
                value={propertyFilter}
                onChange={(e) => {
                  setPropertyFilter(e.target.value);
                  setPage(1);
                }}
                options={propertyOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={statusOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={pricingModeFilter}
                onChange={(e) => {
                  setPricingModeFilter(e.target.value);
                  setPage(1);
                }}
                options={pricingModeOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={sortValue}
                onChange={(e) => {
                  setSortValue(e.target.value);
                  setPage(1);
                }}
                options={sortOptions}
              />
            </FilterCard.Field>
          </FilterCard>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <EmptyState
              icon={<HiOutlineHome className="w-12 h-12" />}
              title="No rooms yet"
              description={
                properties.length === 0
                  ? 'Create a property first, then add rooms to it.'
                  : searchQuery || propertyFilter || statusFilter || pricingModeFilter
                    ? 'No rooms match your current filters.'
                    : 'Create your first room to start accepting bookings.'
              }
              action={
                limitInfo?.can_create && properties.length > 0 ? (
                  <Button onClick={() => navigate('/manage/rooms/new')}>
                    <HiOutlinePlus className="w-5 h-5" />
                    <span className="ml-2">Create Room</span>
                  </Button>
                ) : properties.length === 0 ? (
                  <Button onClick={() => navigate('/manage/properties/new')}>
                    <HiOutlinePlus className="w-5 h-5" />
                    <span className="ml-2">Create Property</span>
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <Card className="overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader width={60}>{''}</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Property</TableHeader>
                  <TableHeader align="right">Price/Night</TableHeader>
                  <TableHeader align="center">Guests</TableHeader>
                  <TableHeader align="center">Status</TableHeader>
                  <TableHeader align="right" width={140}>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                  >
                    <TableCell>
                      {room.featured_image ? (
                        <img
                          src={room.featured_image}
                          alt={room.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                          <HiOutlineHome className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {room.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {room.room_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 dark:text-gray-400">
                        {room.property_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-medium">
                        {room.currency} {room.base_price_per_night.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      {room.max_guests}
                    </TableCell>
                    <TableCell align="center">
                      {room.is_paused ? (
                        <Badge variant="warning" size="sm">Paused</Badge>
                      ) : room.is_active ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="default" size="sm">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePause(room)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          title={room.is_paused ? 'Resume' : 'Pause'}
                        >
                          {room.is_paused ? (
                            <HiOutlinePlay className="w-4 h-4" />
                          ) : (
                            <HiOutlinePause className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(room)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleRoomClick(room)}
                onEdit={() => handleEditRoom(room)}
                onDelete={() => handleDeleteClick(room)}
                onTogglePause={() => handleTogglePause(room)}
                showActions
              />
            ))}
          </div>
        ) : (
          // List View (compact cards)
          <div className="space-y-2">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                compact
                onClick={() => handleRoomClick(room)}
                onEdit={() => handleEditRoom(room)}
                onDelete={() => handleDeleteClick(room)}
                onTogglePause={() => handleTogglePause(room)}
                showActions={false}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRoomToDelete(null);
          }}
          title="Delete Room"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{roomToDelete?.name}</strong>? This will also delete all associated bookings. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setRoomToDelete(null);
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
