/**
 * Payment Rules Service (Frontend)
 *
 * API client for payment rules management.
 */

import { api } from './api.service';
import {
  PaymentRule,
  PaymentRuleWithDetails,
  CreatePaymentRuleRequest,
  UpdatePaymentRuleRequest,
  RuleEditPermission,
} from '../types/payment-rules.types';

/**
 * Create a new payment rule for a room
 */
export const createPaymentRule = async (
  roomId: string,
  data: CreatePaymentRuleRequest
): Promise<PaymentRule> => {
  const response = await api.post(`/rooms/${roomId}/payment-rules`, data);
  return response.data;
};

/**
 * Get a specific payment rule by ID
 */
export const getPaymentRule = async (roomId: string, ruleId: string): Promise<PaymentRuleWithDetails> => {
  const response = await api.get(`/rooms/${roomId}/payment-rules/${ruleId}`);
  return response.data;
};

/**
 * List all payment rules for a room
 */
export const listRoomPaymentRules = async (roomId: string): Promise<PaymentRule[]> => {
  const response = await api.get(`/rooms/${roomId}/payment-rules`);
  return response.data || [];
};

/**
 * Update a payment rule
 */
export const updatePaymentRule = async (
  roomId: string,
  ruleId: string,
  data: UpdatePaymentRuleRequest
): Promise<PaymentRule> => {
  const response = await api.put(`/rooms/${roomId}/payment-rules/${ruleId}`, data);
  return response.data;
};

/**
 * Delete a payment rule
 */
export const deletePaymentRule = async (roomId: string, ruleId: string): Promise<void> => {
  await api.delete(`/rooms/${roomId}/payment-rules/${ruleId}`);
};

// ============================================================================
// CENTRALIZED MANAGEMENT
// ============================================================================

/**
 * List all payment rules across user's properties (for centralized management page)
 */
export const listAllPaymentRules = async (propertyId?: string): Promise<PaymentRule[]> => {
  const params = propertyId ? { propertyId } : {};
  const response = await api.get('/payment-rules', { params });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch payment rules');
  }

  // Backend returns { success: true, data: [...rules], total: N }
  // So response.data is already the rules array
  return response.data;
};

/**
 * Get room assignments for a payment rule
 */
export const getPaymentRuleAssignments = async (
  ruleId: string
): Promise<{ room_id: string; room_name: string }[]> => {
  const response = await api.get(`/payment-rules/${ruleId}/assignments`);
  return response.data || [];
};

/**
 * Assign payment rule to multiple rooms
 */
export const assignPaymentRuleToRooms = async (
  ruleId: string,
  roomIds: string[]
): Promise<void> => {
  await api.post(`/payment-rules/${ruleId}/assign-rooms`, { roomIds });
};

/**
 * Unassign payment rule from a specific room
 */
export const unassignPaymentRuleFromRoom = async (
  ruleId: string,
  roomId: string
): Promise<void> => {
  await api.delete(`/payment-rules/${ruleId}/unassign-room/${roomId}`);
};

// ============================================================================
// GLOBAL PROPERTY-LEVEL CRUD
// ============================================================================

/**
 * Create a payment rule at property level (no room_id required)
 */
export const createPaymentRuleGlobal = async (
  data: Omit<CreatePaymentRuleRequest, 'room_id'> & { property_id: string; room_ids?: string[] }
): Promise<PaymentRule> => {
  const response = await api.post('/payment-rules', data);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create payment rule');
  }

  // Backend returns { success: true, data: rule }
  return response.data;
};

/**
 * Get a single payment rule by ID (for editing)
 */
export const getPaymentRuleById = async (ruleId: string): Promise<PaymentRule> => {
  const response = await api.get(`/payment-rules/${ruleId}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch payment rule');
  }

  // Backend returns { success: true, data: rule }
  return response.data;
};

/**
 * Update a payment rule by ID (not room-specific)
 */
export const updatePaymentRuleGlobal = async (
  ruleId: string,
  data: UpdatePaymentRuleRequest
): Promise<PaymentRule> => {
  const response = await api.put(`/payment-rules/${ruleId}`, data);
  return response.data;
};

/**
 * Delete a payment rule by ID
 */
export const deletePaymentRuleGlobal = async (ruleId: string): Promise<void> => {
  await api.delete(`/payment-rules/${ruleId}`);
};

/**
 * Check if a payment rule can be edited
 * Returns false if the rule is assigned to any rooms
 */
export const checkEditPermission = async (ruleId: string): Promise<RuleEditPermission> => {
  const response = await api.get(`/payment-rules/${ruleId}/edit-permission`);
  return response.data;
};

// Export as named export to match other services
export const paymentRulesService = {
  createPaymentRule,
  getPaymentRule,
  listRoomPaymentRules,
  updatePaymentRule,
  deletePaymentRule,
  listAllPaymentRules,
  getPaymentRuleAssignments,
  assignPaymentRuleToRooms,
  unassignPaymentRuleFromRoom,
  createPaymentRuleGlobal,
  getPaymentRuleById,
  updatePaymentRuleGlobal,
  deletePaymentRuleGlobal,
  checkEditPermission,
};
