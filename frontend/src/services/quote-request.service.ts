/**
 * Quote Request Service (Frontend)
 *
 * API client for quote request endpoints
 */

import { api } from './api.service';
import type {
  QuoteRequestWithDetails,
  CreateQuoteRequestInput,
  RespondToQuoteInput,
  UpdateQuoteStatusInput,
  QuoteRequestListResponse,
  QuoteRequestStats,
} from '@/types/quote-request.types';

export const quoteRequestService = {
  /**
   * Submit a quote request (public - no auth required)
   */
  create: async (data: CreateQuoteRequestInput): Promise<QuoteRequestWithDetails> => {
    console.log('[QuoteRequestService] Creating quote request');
    console.log('[QuoteRequestService] Data:', data);

    const response = await api.post('/quote-requests', data);
    console.log('[QuoteRequestService] Response:', response);

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to create quote request');
    }

    console.log('[QuoteRequestService] Quote created:', response.data.id);
    return response.data;
  },

  /**
   * Get quote request by ID
   */
  getById: async (id: string): Promise<QuoteRequestWithDetails> => {
    console.log('[QuoteRequestService] Fetching quote:', id);

    const response = await api.get(`/quote-requests/${id}`);

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch quote request');
    }

    return response.data;
  },

  /**
   * List quote requests (property owner - auth required)
   */
  list: async (params?: {
    property_id?: string;
    status?: string;
    group_type?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<QuoteRequestListResponse> => {
    console.log('[QuoteRequestService] Listing quotes with params:', params);

    const response = await api.get('/quote-requests', { params });

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to list quote requests');
    }

    return response.data;
  },

  /**
   * Respond to quote request (property owner - auth required)
   */
  respond: async (id: string, data: RespondToQuoteInput): Promise<QuoteRequestWithDetails> => {
    console.log('[QuoteRequestService] Responding to quote:', id);
    console.log('[QuoteRequestService] Response data:', data);

    const response = await api.post(`/quote-requests/${id}/respond`, data);

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to respond to quote request');
    }

    console.log('[QuoteRequestService] Response sent successfully');
    return response.data;
  },

  /**
   * Update quote status (property owner - auth required)
   */
  updateStatus: async (id: string, updates: UpdateQuoteStatusInput): Promise<QuoteRequestWithDetails> => {
    console.log('[QuoteRequestService] Updating quote status:', id);
    console.log('[QuoteRequestService] Updates:', updates);

    const response = await api.patch(`/quote-requests/${id}/status`, updates);

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to update quote status');
    }

    return response.data;
  },

  /**
   * Convert quote to booking (property owner - auth required)
   */
  convertToBooking: async (id: string, bookingId: string): Promise<void> => {
    console.log('[QuoteRequestService] Converting quote to booking:', id, '→', bookingId);

    const response = await api.post(`/quote-requests/${id}/convert`, { booking_id: bookingId });

    if (!response.success) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to convert quote to booking');
    }

    console.log('[QuoteRequestService] Quote converted successfully');
  },

  /**
   * Get statistics (property owner - auth required)
   */
  getStats: async (propertyId?: string): Promise<QuoteRequestStats> => {
    console.log('[QuoteRequestService] Fetching statistics');

    const params = propertyId ? { property_id: propertyId } : {};
    const response = await api.get('/quote-requests/stats', { params });

    if (!response.success || !response.data) {
      console.error('[QuoteRequestService] API error:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch quote statistics');
    }

    return response.data;
  },
};
