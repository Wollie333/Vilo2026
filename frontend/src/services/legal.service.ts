import { api } from './api.service';
import type {
  CancellationPolicy,
  CreateCancellationPolicyData,
  UpdateCancellationPolicyData,
} from '@/types/legal.types';

// ============================================================================
// Legal Service - Cancellation Policies
// ============================================================================

class LegalService {
  // --------------------------------------------------------------------------
  // Get all active cancellation policies
  // --------------------------------------------------------------------------
  async getCancellationPolicies(includeInactive = false): Promise<CancellationPolicy[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await api.get<CancellationPolicy[]>(`/legal/cancellation-policies${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch cancellation policies');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Get a single cancellation policy by ID
  // --------------------------------------------------------------------------
  async getCancellationPolicy(id: string): Promise<CancellationPolicy> {
    const response = await api.get<CancellationPolicy>(`/legal/cancellation-policies/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch cancellation policy');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Create a new cancellation policy
  // --------------------------------------------------------------------------
  async createCancellationPolicy(data: CreateCancellationPolicyData): Promise<CancellationPolicy> {
    const response = await api.post<CancellationPolicy>('/legal/cancellation-policies', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create cancellation policy');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Update a cancellation policy
  // --------------------------------------------------------------------------
  async updateCancellationPolicy(
    id: string,
    data: UpdateCancellationPolicyData
  ): Promise<CancellationPolicy> {
    const response = await api.put<CancellationPolicy>(
      `/legal/cancellation-policies/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update cancellation policy');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Delete a cancellation policy
  // --------------------------------------------------------------------------
  async deleteCancellationPolicy(id: string): Promise<void> {
    const response = await api.delete(`/legal/cancellation-policies/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete cancellation policy');
    }
  }
}

export const legalService = new LegalService();
