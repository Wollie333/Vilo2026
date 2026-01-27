import { getAdminClient } from '../config/supabase';
import type {
  CancellationPolicy,
  CreateCancellationPolicyData,
  UpdateCancellationPolicyData,
} from '../types/legal.types';

// ============================================================================
// Legal Service - Cancellation Policies
// ============================================================================

export const legalService = {
  // --------------------------------------------------------------------------
  // Get all active cancellation policies (system defaults + user's custom policies)
  // --------------------------------------------------------------------------
  async getCancellationPolicies(userId?: string): Promise<CancellationPolicy[]> {
    const supabase = getAdminClient();

    // If userId provided, get system defaults + user's custom policies
    // Otherwise, just get system defaults (for public/unauthenticated access)
    let query = supabase
      .from('cancellation_policies')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      // Get system defaults OR policies created by this user
      query = query.or(`is_custom.eq.false,created_by.eq.${userId}`);
    } else {
      // Public access: only system defaults
      query = query.eq('is_custom', false);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch cancellation policies: ${error.message}`);
    }

    return data || [];
  },

  // --------------------------------------------------------------------------
  // Get all cancellation policies (including inactive - admin only)
  // --------------------------------------------------------------------------
  async getAllCancellationPolicies(): Promise<CancellationPolicy[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('cancellation_policies')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch cancellation policies: ${error.message}`);
    }

    return data || [];
  },

  // --------------------------------------------------------------------------
  // Get a single cancellation policy by ID
  // --------------------------------------------------------------------------
  async getCancellationPolicyById(id: string): Promise<CancellationPolicy | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('cancellation_policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch cancellation policy: ${error.message}`);
    }

    return data;
  },

  // --------------------------------------------------------------------------
  // Create a new cancellation policy
  // --------------------------------------------------------------------------
  async createCancellationPolicy(
    data: CreateCancellationPolicyData
  ): Promise<CancellationPolicy> {
    const supabase = getAdminClient();
    const { data: policy, error } = await supabase
      .from('cancellation_policies')
      .insert({
        name: data.name,
        description: data.description || null,
        tiers: data.tiers,
        is_default: data.is_default ?? false,
        is_active: data.is_active ?? true,
        is_custom: data.is_custom ?? true,
        created_by: data.created_by || null,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cancellation policy: ${error.message}`);
    }

    return policy;
  },

  // --------------------------------------------------------------------------
  // Update a cancellation policy
  // --------------------------------------------------------------------------
  async updateCancellationPolicy(
    id: string,
    data: UpdateCancellationPolicyData
  ): Promise<CancellationPolicy> {
    const supabase = getAdminClient();
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tiers !== undefined) updateData.tiers = data.tiers;
    if (data.is_default !== undefined) updateData.is_default = data.is_default;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const { data: policy, error } = await supabase
      .from('cancellation_policies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cancellation policy: ${error.message}`);
    }

    return policy;
  },

  // --------------------------------------------------------------------------
  // Delete (soft delete) a cancellation policy
  // --------------------------------------------------------------------------
  async deleteCancellationPolicy(id: string): Promise<void> {
    const supabase = getAdminClient();
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('cancellation_policies')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete cancellation policy: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Hard delete a cancellation policy (admin only)
  // --------------------------------------------------------------------------
  async hardDeleteCancellationPolicy(id: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('cancellation_policies')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete cancellation policy: ${error.message}`);
    }
  },
};
