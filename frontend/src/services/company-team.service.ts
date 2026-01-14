import { api } from './api.service';
import type {
  CompanyTeamMember,
  CompanyTeamMemberWithUser,
  CompanyTeamMemberWithCompany,
  CreateCompanyTeamMemberRequest,
  UpdateCompanyTeamMemberRequest,
} from '@/types/company-team.types';

/**
 * Service for managing company team members
 */
class CompanyTeamService {
  // ============================================================================
  // COMPANY TEAM MEMBERS
  // ============================================================================

  /**
   * List team members for a company
   */
  async listTeamMembers(companyId: string): Promise<CompanyTeamMemberWithUser[]> {
    const response = await api.get<{ team_members: CompanyTeamMemberWithUser[] }>(
      `/companies/${companyId}/team-members`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch team members');
    }
    return response.data.team_members;
  }

  /**
   * Get team member by ID
   */
  async getTeamMember(companyId: string, teamMemberId: string): Promise<CompanyTeamMemberWithUser> {
    const response = await api.get<{ team_member: CompanyTeamMemberWithUser }>(
      `/companies/${companyId}/team-members/${teamMemberId}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch team member');
    }
    return response.data.team_member;
  }

  /**
   * Add team member to company
   */
  async addTeamMember(
    companyId: string,
    data: CreateCompanyTeamMemberRequest
  ): Promise<CompanyTeamMember> {
    const response = await api.post<{ team_member: CompanyTeamMember }>(
      `/companies/${companyId}/team-members`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add team member');
    }
    return response.data.team_member;
  }

  /**
   * Update team member
   */
  async updateTeamMember(
    companyId: string,
    teamMemberId: string,
    data: UpdateCompanyTeamMemberRequest
  ): Promise<CompanyTeamMember> {
    const response = await api.patch<{ team_member: CompanyTeamMember }>(
      `/companies/${companyId}/team-members/${teamMemberId}`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update team member');
    }
    return response.data.team_member;
  }

  /**
   * Remove team member from company
   */
  async removeTeamMember(companyId: string, teamMemberId: string): Promise<void> {
    const response = await api.delete(`/companies/${companyId}/team-members/${teamMemberId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove team member');
    }
  }

  // ============================================================================
  // USER'S COMPANY MEMBERSHIPS
  // ============================================================================

  /**
   * Get companies where current user is a team member
   */
  async getMyCompanyMemberships(): Promise<CompanyTeamMemberWithCompany[]> {
    const response = await api.get<{ memberships: CompanyTeamMemberWithCompany[] }>(
      '/users/me/company-memberships'
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user company memberships');
    }
    return response.data.memberships;
  }
}

export const companyTeamService = new CompanyTeamService();
