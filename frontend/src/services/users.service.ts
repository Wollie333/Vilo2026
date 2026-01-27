import { api } from './api.service';
import type { UserProfile, UserWithRoles, UserStatus, UserStats } from '@/types/auth.types';
import type { PaginatedResponse } from '@/types/api.types';

export interface UserFilters {
  status?: UserStatus;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  timezone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  company_name?: string;
  vat_number?: string;
  company_registration?: string;
  status?: UserStatus;
}

export interface AssignRolesData {
  roleIds: string[];
}

export interface AssignPermissionData {
  permissionId: string;
  overrideType: 'grant' | 'deny';
}

export interface AssignPropertiesData {
  propertyIds: string[];
  primaryPropertyId?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  status?: 'active' | 'pending';
  userTypeId?: string;

  // Subscription configuration (optional)
  subscription?: {
    subscription_type_id: string;
    status?: 'active' | 'trial';
    trial_ends_at?: string;
    expires_at?: string;
  };
}

export interface ActivityLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLogResponse {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Backend response structure for list users
interface UserListApiResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UsersService {
  async listUsers(filters: UserFilters = {}): Promise<PaginatedResponse<UserProfile>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<UserListApiResponse>(`/users?${params.toString()}`);

    if (!response.success) {
      console.error('listUsers API error:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch users');
    }

    // Handle empty or malformed response
    if (!response.data) {
      return {
        success: true,
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      };
    }

    // Transform backend response to PaginatedResponse format
    const { users = [], total = 0, page = 1, limit = 10, totalPages = 0 } = response.data;
    return {
      success: true,
      data: users,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: { page, limit, total, totalPages },
      },
    };
  }

  async createUser(data: CreateUserData): Promise<UserWithRoles> {
    const response = await api.post<{ user: UserWithRoles }>('/users', data);
    if (!response.success || !response.data) {
      console.error('createUser API error:', response.error);
      throw new Error(response.error?.message || 'Failed to create user');
    }
    return response.data.user;
  }

  async getUser(id: string): Promise<UserWithRoles> {
    const response = await api.get<{ user: UserWithRoles }>(`/users/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user');
    }
    return response.data.user;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<UserProfile> {
    const response = await api.patch<{ user: UserProfile }>(`/users/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user');
    }
    return response.data.user;
  }

  async deleteUser(id: string): Promise<void> {
    const response = await api.delete(`/users/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user');
    }
  }

  async hardDeleteUser(id: string): Promise<void> {
    const response = await api.delete(`/users/${id}/hard`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to permanently delete user');
    }
  }

  async approveUser(id: string): Promise<UserProfile> {
    const response = await api.post<{ user: UserProfile }>(`/users/${id}/approve`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to approve user');
    }
    return response.data.user;
  }

  async assignRoles(userId: string, data: AssignRolesData): Promise<UserWithRoles> {
    const response = await api.post<{ user: UserWithRoles }>(`/users/${userId}/roles`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to assign roles');
    }
    return response.data.user;
  }

  async assignPermissions(userId: string, permissions: AssignPermissionData[]): Promise<UserWithRoles> {
    const response = await api.post<{ user: UserWithRoles }>(`/users/${userId}/permissions`, { permissions });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to assign permissions');
    }
    return response.data.user;
  }

  async assignProperties(userId: string, data: AssignPropertiesData): Promise<UserWithRoles> {
    const response = await api.post<{ user: UserWithRoles }>(`/users/${userId}/properties`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to assign properties');
    }
    return response.data.user;
  }

  async getUserProperties(userId: string): Promise<any[]> {
    const response = await api.get<{ properties: any[]; total: number }>(`/users/${userId}/properties`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user properties');
    }
    return response.data.properties;
  }

  async unassignProperty(userId: string, propertyId: string): Promise<void> {
    const response = await api.delete(`/users/${userId}/properties/${propertyId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unassign property');
    }
  }

  async getTeamMembers(userId: string): Promise<any[]> {
    const response = await api.get<{ members: any[]; total: number }>(`/users/${userId}/team`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch team members');
    }
    return response.data.members;
  }

  async inviteTeamMember(
    userId: string,
    data: { email: string; full_name: string; phone?: string; roleIds?: string[] }
  ): Promise<any> {
    const response = await api.post<{ member: any }>(`/users/${userId}/team`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to invite team member');
    }
    return response.data.member;
  }

  async removeTeamMember(userId: string, memberId: string): Promise<void> {
    const response = await api.delete(`/users/${userId}/team/${memberId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove team member');
    }
  }

  async getCustomersByUser(userId: string): Promise<any[]> {
    const response = await api.get<{ customers: any[]; total: number }>(`/users/${userId}/customers`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch customers');
    }
    return response.data.customers;
  }

  async getUserRooms(userId: string): Promise<any[]> {
    const response = await api.get<{ rooms: any[]; total: number }>(`/users/${userId}/rooms`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch rooms');
    }
    return response.data.rooms;
  }

  async getUserAddons(userId: string): Promise<any[]> {
    const response = await api.get<{ addons: any[]; total: number }>(`/users/${userId}/addons`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch addons');
    }
    return response.data.addons;
  }

  async getUserPolicies(userId: string): Promise<any> {
    const response = await api.get<{ policies: any[]; propertyPolicies: any[] }>(`/users/${userId}/policies`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch policies');
    }
    return response.data;
  }

  async getUserTerms(userId: string): Promise<any[]> {
    const response = await api.get<{ properties: any[]; total: number }>(`/users/${userId}/terms`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch terms');
    }
    return response.data.properties;
  }

  async getUserPaymentIntegrations(userId: string): Promise<any[]> {
    const response = await api.get<{ integrations: any[]; total: number }>(`/users/${userId}/payment-integrations`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch payment integrations');
    }
    return response.data.integrations;
  }

  async getUserSubscription(userId: string): Promise<any> {
    const response = await api.get<{ subscription: any; usage: any }>(`/users/${userId}/subscription`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription');
    }
    return response.data;
  }

  async getUserPaymentHistory(userId: string): Promise<any> {
    const response = await api.get<{ invoices: any[]; checkouts: any[]; stats: any }>(`/users/${userId}/payment-history`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch payment history');
    }
    return response.data;
  }

  async listPendingUsers(): Promise<UserProfile[]> {
    const response = await this.listUsers({ status: 'pending' });
    return response.data || [];
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.upload<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload avatar');
    }
    return response.data.avatarUrl;
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    deactivated: number;
  }> {
    // Fetch counts for each status - this could be optimized with a dedicated backend endpoint
    const [allUsers, activeUsers, pendingUsers, suspendedUsers, deactivatedUsers] = await Promise.all([
      this.listUsers({ limit: 1 }),
      this.listUsers({ status: 'active', limit: 1 }),
      this.listUsers({ status: 'pending', limit: 1 }),
      this.listUsers({ status: 'suspended', limit: 1 }),
      this.listUsers({ status: 'deactivated', limit: 1 }),
    ]);

    return {
      total: allUsers.meta?.pagination?.total || 0,
      active: activeUsers.meta?.pagination?.total || 0,
      pending: pendingUsers.meta?.pagination?.total || 0,
      suspended: suspendedUsers.meta?.pagination?.total || 0,
      deactivated: deactivatedUsers.meta?.pagination?.total || 0,
    };
  }

  async getUserActivity(userId: string, page = 1, limit = 10): Promise<ActivityLogResponse> {
    const response = await api.get<ActivityLogResponse>(
      `/users/${userId}/activity?page=${page}&limit=${limit}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch activity');
    }
    return response.data;
  }

  /**
   * Get user statistics (property count, room count, team count, etc.)
   * Super admin only - GET /api/users/:userId/stats
   */
  async getUserStatsByUserId(userId: string): Promise<UserStats> {
    const response = await api.get<UserStats>(`/users/${userId}/stats`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user stats');
    }
    return response.data;
  }
}

export const usersService = new UsersService();
