export type UserStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export type PermissionOverride = 'grant' | 'deny';

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  company_name: string | null;
  preferences: Record<string, unknown>;
  status: UserStatus;
  email_verified_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  last_login_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  property_id: string | null;
  assigned_by: string | null;
  created_at: string;
  role?: Role;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  override_type: PermissionOverride;
  property_id: string | null;
  granted_by: string | null;
  expires_at: string | null;
  reason: string | null;
  created_at: string;
  permission?: Permission;
}

export interface UserProperty {
  id: string;
  user_id: string;
  property_id: string;
  is_primary: boolean;
  assigned_by: string | null;
  created_at: string;
}

export interface UserWithRoles extends UserProfile {
  roles: RoleWithPermissions[];
  directPermissions: UserPermission[];
  effectivePermissions: string[];
  properties: UserProperty[];
}

export interface UserListParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  roleId?: string;
  propertyId?: string;
  search?: string;
  sortBy?: 'created_at' | 'email' | 'full_name';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  company_name?: string;
  preferences?: Record<string, unknown>;
}

export interface ApproveUserRequest {
  defaultRole?: string;
  propertyIds?: string[];
}

export interface AssignRolesRequest {
  roleIds: string[];
  propertyId?: string;
  replaceExisting?: boolean;
}

export interface AssignPermissionsRequest {
  permissions: {
    permissionId: string;
    overrideType: PermissionOverride;
    propertyId?: string;
    expiresAt?: string;
    reason?: string;
  }[];
  replaceExisting?: boolean;
}

export interface AssignPropertiesRequest {
  propertyIds: string[];
  replaceExisting?: boolean;
}
