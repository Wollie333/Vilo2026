/**
 * PromoCodesListPage Component
 *
 * Centralized management page for promo codes (promotions).
 * Similar to AddOnsListPage pattern.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Badge,
  Alert,
  Spinner,
  Pagination,
  ViewModeSelector,
  Modal,
} from '@/components/ui';
import { useViewMode } from '@/hooks';
import { promotionsService } from '@/services';
import type { RoomPromotion } from '@/types/room.types';
import { useToast } from '@/context/NotificationContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineTag, HiOutlineTicket, HiOutlineHome } from 'react-icons/hi';

export const PromoCodesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [promos, setPromos] = useState<RoomPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rooms modal state
  const [roomsModalOpen, setRoomsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<RoomPromotion | null>(null);
  const [promoRooms, setPromoRooms] = useState<{ room_id: string; room_name: string }[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // View mode
  const { viewMode, setViewMode } = useViewMode('promo-codes-list-view', 'table');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load promo codes
  const loadPromos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await promotionsService.listAllPromotions();
      setPromos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load promo codes';
      setError(message);
      setPromos([]);
      console.error('Error loading promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await promotionsService.deletePromotion(id);

      toast({
        variant: 'success',
        title: 'Deleted',
        message: 'Promo code deleted successfully',
        duration: 3000,
      });

      // Reload data
      loadPromos();
      setDeleteId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete promo code';
      toast({
        variant: 'error',
        title: 'Delete Failed',
        message,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle viewing rooms for a promo
  const handleViewRooms = async (promo: RoomPromotion) => {
    if (!promo.room_count || promo.room_count === 0) {
      toast({
        variant: 'info',
        title: 'No Rooms',
        message: 'This promo code is not assigned to any rooms',
        duration: 3000,
      });
      return;
    }

    setSelectedPromo(promo);
    setRoomsModalOpen(true);
    setLoadingRooms(true);

    try {
      const rooms = await promotionsService.getPromotionAssignments(promo.id);
      setPromoRooms(rooms);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rooms';
      toast({
        variant: 'error',
        title: 'Error',
        message,
        duration: 5000,
      });
      setPromoRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(promos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromos = promos.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString();
  };

  // Get discount display
  const getDiscountDisplay = (promo: RoomPromotion) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}%`;
    } else if (promo.discount_type === 'fixed_amount') {
      return `R${promo.discount_value}`;
    } else {
      return `${promo.discount_value} nights`;
    }
  };

  return (
    <AuthenticatedLayout
      title="Promo Codes"
      subtitle="Manage promotional discount codes for your properties"
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HiOutlineTag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {promos.length} {promos.length === 1 ? 'promo code' : 'promo codes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ViewModeSelector
              value={viewMode}
              onChange={setViewMode}
              storageKey="promo-codes-list-view"
            />
            <Button
              onClick={() => navigate('/manage/rooms/promo-codes/new')}
              className="whitespace-nowrap"
            >
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Card>
            <Card.Body className="p-0">
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            </Card.Body>
          </Card>
        ) : promos.length === 0 ? (
          <Card>
            <Card.Body className="p-0">
              <div className="text-center py-12">
                <HiOutlineTag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No promo codes yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create your first promo code to get started
                </p>
                <Button onClick={() => navigate('/manage/rooms/promo-codes/new')}>
                  <HiOutlinePlus className="w-4 h-4 mr-2" />
                  Create Promo Code
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Code</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Discount</TableHeader>
                    <TableHeader>Valid Until</TableHeader>
                    <TableHeader>Rooms</TableHeader>
                    <TableHeader>Uses</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="text-right">Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPromos.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-dark-sidebar rounded">
                            {promo.code}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {promo.name}
                          </div>
                          {promo.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {promo.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {getDiscountDisplay(promo)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(promo.valid_until)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {promo.room_count && promo.room_count > 0 ? (
                          <button
                            onClick={() => handleViewRooms(promo)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-full text-sm font-medium transition-colors cursor-pointer"
                          >
                            <HiOutlineHome className="w-4 h-4" />
                            <span>{promo.room_count} {promo.room_count === 1 ? 'room' : 'rooms'}</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">0 rooms</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{promo.current_uses || 0}</span>
                          {promo.max_uses && (
                            <span className="text-gray-500"> / {promo.max_uses}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.is_active ? 'success' : 'secondary'}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/manage/rooms/promo-codes/${promo.id}/edit`)}
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(promo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPromos.map((promo) => (
              <Card key={promo.id} className="hover:shadow-md transition-shadow">
                <Card.Body>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <HiOutlineTicket className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant={promo.is_active ? 'success' : 'secondary'}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Code */}
                    <div>
                      <code className="px-3 py-1.5 text-base font-mono bg-gray-100 dark:bg-dark-sidebar rounded font-semibold">
                        {promo.code}
                      </code>
                    </div>

                    {/* Name and Description */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {promo.name}
                      </h3>
                      {promo.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {promo.description}
                        </p>
                      )}
                    </div>

                    {/* Discount */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="text-lg font-bold text-primary">
                        {getDiscountDisplay(promo)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Valid Until</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(promo.valid_until)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Rooms</span>
                        {promo.room_count && promo.room_count > 0 ? (
                          <button
                            onClick={() => handleViewRooms(promo)}
                            className="font-medium text-primary hover:text-primary-dark dark:text-primary-light underline"
                          >
                            {promo.room_count}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {promo.room_count || 0}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Uses</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {promo.current_uses || 0}
                          {promo.max_uses && ` / ${promo.max_uses}`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-dark-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/manage/rooms/promo-codes/${promo.id}/edit`)}
                        className="flex-1"
                      >
                        <HiOutlinePencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(promo.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          // Row View (compact list)
          <div className="space-y-2">
            {paginatedPromos.map((promo) => (
              <Card key={promo.id} className="hover:shadow-sm transition-shadow">
                <Card.Body className="py-3">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <HiOutlineTicket className="w-5 h-5 text-primary" />
                    </div>

                    {/* Code */}
                    <div className="min-w-[120px]">
                      <code className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-dark-sidebar rounded font-semibold">
                        {promo.code}
                      </code>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {promo.name}
                      </div>
                      {promo.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {promo.description}
                        </div>
                      )}
                    </div>

                    {/* Discount */}
                    <div className="hidden sm:block min-w-[100px] text-right">
                      <div className="text-lg font-bold text-primary">
                        {getDiscountDisplay(promo)}
                      </div>
                    </div>

                    {/* Valid Until */}
                    <div className="hidden md:block min-w-[120px] text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(promo.valid_until)}
                    </div>

                    {/* Rooms */}
                    <div className="hidden md:block min-w-[100px] text-sm">
                      {promo.room_count && promo.room_count > 0 ? (
                        <button
                          onClick={() => handleViewRooms(promo)}
                          className="text-primary hover:text-primary-dark dark:text-primary-light underline font-medium"
                        >
                          {promo.room_count} {promo.room_count === 1 ? 'room' : 'rooms'}
                        </button>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300">0 rooms</span>
                      )}
                    </div>

                    {/* Uses */}
                    <div className="hidden lg:block min-w-[80px] text-sm text-gray-600 dark:text-gray-300">
                      {promo.current_uses || 0}
                      {promo.max_uses && ` / ${promo.max_uses}`}
                    </div>

                    {/* Status */}
                    <div className="min-w-[80px]">
                      <Badge variant={promo.is_active ? 'success' : 'secondary'} size="sm">
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/manage/rooms/promo-codes/${promo.id}/edit`)}
                        className="p-1.5"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(promo.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Promo Code
                </h3>
              </Card.Header>
              <Card.Body>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this promo code? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleDelete(deleteId)}
                    isLoading={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Rooms Modal */}
        <Modal
          isOpen={roomsModalOpen}
          onClose={() => setRoomsModalOpen(false)}
          title={`Rooms with Promo Code: ${selectedPromo?.code || ''}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Promo Info */}
            {selectedPromo && (
              <div className="pb-4 border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3 mb-2">
                  <code className="px-3 py-1.5 text-sm font-mono bg-primary/10 text-primary rounded font-semibold">
                    {selectedPromo.code}
                  </code>
                  <Badge variant={selectedPromo.is_active ? 'success' : 'secondary'}>
                    {selectedPromo.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {selectedPromo.name}
                </h4>
                {selectedPromo.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedPromo.description}
                  </p>
                )}
              </div>
            )}

            {/* Loading State */}
            {loadingRooms ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : promoRooms.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineHome className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No rooms found with this promo code
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This promo code is active on {promoRooms.length} {promoRooms.length === 1 ? 'room' : 'rooms'}:
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {promoRooms.map((room) => (
                    <div
                      key={room.room_id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-sidebar rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                    >
                      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                        <HiOutlineHome className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {room.room_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          ID: {room.room_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button variant="outline" onClick={() => setRoomsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
};
