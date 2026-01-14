/**
 * Promotions Service (Frontend)
 *
 * API client for promotions management.
 */

import { api } from './api.service';
import { RoomPromotion } from '../types/room.types';

/**
 * List all promotions across user's properties (for centralized management page)
 */
export const listAllPromotions = async (propertyId?: string): Promise<RoomPromotion[]> => {
  const params = propertyId ? { property_id: propertyId } : {};
  const response = await api.get('/promotions', { params });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch promotions');
  }

  return response.data.data || [];
};

/**
 * Get room assignments for a promotion
 */
export const getPromotionAssignments = async (
  promotionId: string
): Promise<{ room_id: string; room_name: string }[]> => {
  const response = await api.get(`/promotions/${promotionId}/assignments`);
  return response.data.data;
};

/**
 * Assign promotion to multiple rooms
 */
export const assignPromotionToRooms = async (
  promotionId: string,
  roomIds: string[]
): Promise<void> => {
  await api.post(`/promotions/${promotionId}/assign-rooms`, { roomIds });
};

/**
 * Unassign promotion from a specific room
 */
export const unassignPromotionFromRoom = async (
  promotionId: string,
  roomId: string
): Promise<void> => {
  await api.delete(`/promotions/${promotionId}/unassign-room/${roomId}`);
};

// ============================================================================
// GLOBAL PROPERTY-LEVEL CRUD
// ============================================================================

/**
 * Create a promotion at property level (no room_id required)
 */
export const createPromotion = async (
  data: {
    property_id: string;
    room_ids?: string[];
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
    discount_value: number;
    min_nights?: number;
    max_uses?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }
): Promise<RoomPromotion> => {
  const response = await api.post('/promotions', data);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create promotion');
  }

  return response.data.data;
};

/**
 * Get a single promotion by ID (for editing)
 */
export const getPromotionById = async (promotionId: string): Promise<RoomPromotion> => {
  const response = await api.get(`/promotions/${promotionId}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch promotion');
  }

  // For single item endpoints, data is directly in response.data
  return response.data as RoomPromotion;
};

/**
 * Update a promotion by ID
 */
export const updatePromotion = async (
  promotionId: string,
  data: {
    code?: string;
    name?: string;
    discount_type?: 'percentage' | 'fixed_amount' | 'free_nights';
    discount_value?: number;
    min_nights?: number;
    max_uses?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }
): Promise<RoomPromotion> => {
  const response = await api.put(`/promotions/${promotionId}`, data);
  return response.data.data;
};

/**
 * Delete a promotion by ID
 */
export const deletePromotion = async (promotionId: string): Promise<void> => {
  await api.delete(`/promotions/${promotionId}`);
};

// Export as named export to match other services
export const promotionsService = {
  listAllPromotions,
  getPromotionAssignments,
  assignPromotionToRooms,
  unassignPromotionFromRoom,
  createPromotion,
  getPromotionById,
  updatePromotion,
  deletePromotion,
};
