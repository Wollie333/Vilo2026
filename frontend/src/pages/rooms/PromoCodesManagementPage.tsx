/**
 * Promo Codes Management Page
 *
 * Centralized page for managing all promo codes across properties.
 * Allows viewing, editing, deleting promo codes and assigning them to rooms.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineTag,
  HiOutlineHome,
} from 'react-icons/hi';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Spinner,
  Modal,
} from '@/components/ui';
import { promotionsService, propertyService } from '@/services';
import { RoomPromotion } from '@/types/room.types';
import { useAuth } from '@/context/AuthContext';

/**
 * Room Count Badge Component
 * Displays the number of rooms assigned to a promo code
 */
const RoomCountBadge: React.FC<{ promo: RoomPromotion; onClick?: () => void }> = ({ promo, onClick }) => {
  console.log('🎯 RoomCountBadge - promo:', promo.code, 'room_count:', promo.room_count);
  const roomCount = promo.room_count || 0;

  if (roomCount === 0) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        0 rooms
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-full text-sm font-medium transition-colors"
    >
      <HiOutlineHome className="w-4 h-4" />
      <span>{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span>
    </button>
  );
};

export const PromoCodesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<RoomPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingAssignments, setViewingAssignments] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<{ room_id: string; room_name: string }[]>([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionsService.listAllPromotions();
      console.log('📦 fetchPromotions - received data:', data);
      console.log('📦 First promo room_count:', data?.[0]?.room_count);
      setPromotions(data || []);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
      setPromotions([]); // Ensure promotions is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Fetch user's owned properties via API
      const response = await propertyService.getMyProperties();
      const properties = response.properties || [];

      if (properties.length === 0) {
        alert('No properties found. Please create a property first.');
        navigate('/manage/properties');
        return;
      }

      // Use first property (or primary if available)
      const primaryProperty = properties.find((p) => p.is_primary);
      const propertyId = primaryProperty?.id || properties[0].id;

      navigate(`/manage/rooms/promo-codes/new?property_id=${propertyId}`);
    } catch (error) {
      console.error('Failed to load properties:', error);
      alert('Failed to load properties. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (promo: RoomPromotion) => {
    navigate(`/manage/rooms/promo-codes/${promo.id}/edit`);
  };

  const handleDelete = async (promo: RoomPromotion) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${promo.code}"?`)) {
      return;
    }

    try {
      await promotionsService.deletePromotion(promo.id);
      await fetchPromotions();
    } catch (err) {
      console.error('Failed to delete promo code:', err);
      alert('Failed to delete promo code. It may be assigned to rooms.');
    }
  };

  const handleViewAssignments = async (promotionId: string) => {
    try {
      const data = await promotionsService.getPromotionAssignments(promotionId);
      setAssignments(data);
      setViewingAssignments(promotionId);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      alert('Failed to load room assignments.');
    }
  };

  const getDiscountTypeBadgeVariant = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return 'info';
      case 'fixed_amount':
        return 'warning';
      case 'free_nights':
        return 'success';
      default:
        return 'default';
    }
  };

  const getDiscountTypeLabel = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return 'Percentage';
      case 'fixed_amount':
        return 'Fixed Amount';
      case 'free_nights':
        return 'Free Nights';
      default:
        return discountType;
    }
  };

  const formatDiscountValue = (promo: RoomPromotion) => {
    switch (promo.discount_type) {
      case 'percentage':
        return `${promo.discount_value}%`;
      case 'fixed_amount':
        return `R${promo.discount_value.toFixed(2)}`;
      case 'free_nights':
        return `${promo.discount_value} night(s)`;
      default:
        return promo.discount_value.toString();
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Promo Codes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage promo codes across all your rooms
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
            <HiOutlinePlus className="w-4 h-4 mr-2" />
            {isCreating ? 'Loading...' : 'Create Promo Code'}
          </Button>
        </div>

        {/* Promotions Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <HiOutlineTag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Promo Codes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
                Create promo codes to offer discounts to your guests.
              </p>
              <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
                <HiOutlinePlus className="w-4 h-4 mr-2" />
                {isCreating ? 'Loading...' : 'Create Promo Code'}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Discount Type</TableHeader>
                  <TableHeader>Discount Value</TableHeader>
                  <TableHeader>Rooms</TableHeader>
                  <TableHeader>Uses</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="font-mono font-semibold text-primary">
                        {promo.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {promo.name}
                        </div>
                        {promo.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {promo.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDiscountTypeBadgeVariant(promo.discount_type)}>
                        {getDiscountTypeLabel(promo.discount_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDiscountValue(promo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RoomCountBadge
                        promo={promo}
                        onClick={() => handleViewAssignments(promo.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {promo.current_uses}
                        {promo.max_uses && ` / ${promo.max_uses}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.is_active ? 'success' : 'default'}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(promo)}
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(promo)}
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Room Assignments Modal */}
        {viewingAssignments && (
          <Modal
            isOpen={!!viewingAssignments}
            onClose={() => setViewingAssignments(null)}
            title="Room Assignments"
          >
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  This promo code is not assigned to any rooms yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.room_id}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <HiOutlineHome className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {assignment.room_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Modal>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
