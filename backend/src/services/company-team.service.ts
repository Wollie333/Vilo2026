import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import type {
  CompanyTeamMember,
  CompanyTeamMemberWithUser,
  CompanyTeamMemberWithCompany,
  CreateCompanyTeamMemberRequest,
  UpdateCompanyTeamMemberRequest,
} from '../types/company-team.types';

/**
 * Service for managing company team members
 */

// ============================================================================
// LIST & GET
// ============================================================================

/**
 * List team members for a company
 */
export const listCompanyTeamMembers = async (companyId: string): Promise<CompanyTeamMemberWithUser[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_team_members')
    .select(`
      *,
      user:users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch team members');
  }

  return data as CompanyTeamMemberWithUser[];
};

/**
 * Get team member by ID
 */
export const getTeamMember = async (id: string): Promise<CompanyTeamMemberWithUser> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_team_members')
    .select(`
      *,
      user:users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Team member not found');
  }

  return data as CompanyTeamMemberWithUser;
};

// ============================================================================
// CREATE
// ============================================================================

/**
 * Add team member to company
 */
export const addTeamMember = async (
  input: CreateCompanyTeamMemberRequest,
  actorId: string
): Promise<CompanyTeamMember> => {
  const supabase = getAdminClient();

  // Validate custom role has role_name
  if (input.role === 'custom' && !input.role_name) {
    throw new AppError('BAD_REQUEST', 'role_name is required for custom roles');
  }

  // Check if user is already a team member
  const { data: existing } = await supabase
    .from('company_team_members')
    .select('id')
    .eq('company_id', input.company_id)
    .eq('user_id', input.user_id)
    .eq('is_active', true)
    .single();

  if (existing) {
    throw new AppError('CONFLICT', 'User is already a team member of this company');
  }

  // Check subscription limit (max_team_members)
  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', input.company_id)
    .single();

  if (!company) {
    throw new AppError('NOT_FOUND', 'Company not found');
  }

  // Get company owner's active subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select(`
      subscription_type:subscription_types (
        limits
      )
    `)
    .eq('user_id', company.user_id)
    .eq('is_active', true)
    .single();

  if (subscription?.subscription_type) {
    const limits = (subscription.subscription_type as any).limits as Record<string, number>;
    const maxTeamMembers = limits?.max_team_members || 0;

    if (maxTeamMembers !== -1) {
      // -1 = unlimited
      const { count } = await supabase
        .from('company_team_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', input.company_id)
        .eq('is_active', true);

      if (count !== null && count >= maxTeamMembers) {
        throw new AppError(
          'FORBIDDEN',
          `Subscription limit reached: maximum ${maxTeamMembers} team members allowed`
        );
      }
    }
  }

  // Create team member
  const { data, error } = await supabase
    .from('company_team_members')
    .insert({
      company_id: input.company_id,
      user_id: input.user_id,
      role: input.role,
      role_name: input.role_name || null,
      permissions: input.permissions || [],
      assigned_by: actorId,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(), // Auto-accept for now
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add team member');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.create' as any, // Using existing audit action
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: input as any,
  });

  return data as CompanyTeamMember;
};

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update team member
 */
export const updateTeamMember = async (
  id: string,
  input: UpdateCompanyTeamMemberRequest,
  actorId: string
): Promise<CompanyTeamMember> => {
  const supabase = getAdminClient();

  const teamMember = await getTeamMember(id);

  const { data, error } = await supabase
    .from('company_team_members')
    .update({
      role: input.role,
      role_name: input.role_name,
      permissions: input.permissions,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update team member');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.update' as any, // Using existing audit action
    entity_type: 'user' as any,
    entity_id: id,
    old_data: teamMember as any,
    new_data: input as any,
  });

  return data as CompanyTeamMember;
};

// ============================================================================
// DELETE
// ============================================================================

/**
 * Remove team member (soft delete)
 */
export const removeTeamMember = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const teamMember = await getTeamMember(id);

  const { error } = await supabase
    .from('company_team_members')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove team member');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.delete' as any, // Using existing audit action
    entity_type: 'user' as any,
    entity_id: id,
    old_data: teamMember as any,
  });
};

// ============================================================================
// USER MEMBERSHIPS
// ============================================================================

/**
 * Get companies where user is a team member
 */
export const getUserCompanyMemberships = async (userId: string): Promise<CompanyTeamMemberWithCompany[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_team_members')
    .select(`
      *,
      company:companies (
        id,
        name,
        display_name,
        logo_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch user company memberships');
  }

  return data as CompanyTeamMemberWithCompany[];
};
