export type UserStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export type PermissionOverride = 'grant' | 'deny';

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  priority: number;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserProperty {
  id: string;
  user_id: string;
  property_id: string;
  is_primary: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  default_currency: string;
  company_name: string | null;
  vat_number: string | null;
  company_registration: string | null;
  preferences: Record<string, unknown>;
  status: UserStatus;
  email_verified_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  last_login_at: string | null;
  last_active_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends UserProfile {
  roles: RoleWithPermissions[];
  directPermissions: Array<{
    permission: Permission;
    override_type: PermissionOverride;
  }>;
  effectivePermissions: string[];
  properties: UserProperty[];
}

export interface AuthState {
  user: UserWithRoles | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
