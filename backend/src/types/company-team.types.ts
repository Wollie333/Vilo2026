// ============================================================================
// Company Team Members
// ============================================================================

export type CompanyTeamMemberRole =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'maintenance'
  | 'housekeeping'
  | 'custom';

export interface CompanyTeamMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyTeamMemberRole;
  role_name: string | null;
  assigned_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
  permissions: string[]; // Array of "resource:action" strings
  created_at: string;
  updated_at: string;
}

export interface CompanyTeamMemberWithUser extends CompanyTeamMember {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CompanyTeamMemberWithCompany extends CompanyTeamMember {
  company: {
    id: string;
    name: string;
    display_name: string | null;
    logo_url: string | null;
  };
}

export interface CreateCompanyTeamMemberRequest {
  company_id: string;
  user_id: string;
  role: CompanyTeamMemberRole;
  role_name?: string; // Required if role = 'custom'
  permissions?: string[];
}

export interface UpdateCompanyTeamMemberRequest {
  role?: CompanyTeamMemberRole;
  role_name?: string;
  permissions?: string[];
  is_active?: boolean;
}

export interface CompanyTeamMemberListParams {
  company_id?: string;
  user_id?: string;
  is_active?: boolean;
  role?: CompanyTeamMemberRole;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'invited_at' | 'accepted_at';
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyTeamMemberListResponse {
  team_members: CompanyTeamMemberWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
