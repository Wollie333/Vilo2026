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

// ============================================================================
// Role Utilities
// ============================================================================

export const COMPANY_TEAM_MEMBER_ROLE_LABELS: Record<CompanyTeamMemberRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  receptionist: 'Receptionist',
  maintenance: 'Maintenance',
  housekeeping: 'Housekeeping',
  custom: 'Custom Role',
};

export const COMPANY_TEAM_MEMBER_ROLE_DESCRIPTIONS: Record<CompanyTeamMemberRole, string> = {
  owner: 'Full access to all property settings and team management',
  manager: 'Manage bookings, guests, and property operations',
  receptionist: 'Handle check-ins, bookings, and guest communication',
  maintenance: 'Manage property maintenance and repairs',
  housekeeping: 'Manage room cleaning and housekeeping tasks',
  custom: 'Custom role with specific permissions',
};
