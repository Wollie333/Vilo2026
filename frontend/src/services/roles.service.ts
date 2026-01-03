import { api } from './api.service';
import type { Role, RoleWithPermissions, Permission } from '@/types/auth.types';

export interface CreateRoleData {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleData {
  displayName?: string;
  description?: string;
  permissionIds?: string[];
}

class RolesService {
  async listRoles(): Promise<Role[]> {
    const response = await api.get<{ roles: Role[] }>('/api/roles');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch roles');
    }
    return response.data.roles;
  }

  async getRole(id: string): Promise<RoleWithPermissions> {
    const response = await api.get<{ role: RoleWithPermissions }>(`/api/roles/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch role');
    }
    return response.data.role;
  }

  async listPermissions(): Promise<Permission[]> {
    const response = await api.get<{ permissions: Permission[] }>('/api/roles/permissions');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch permissions');
    }
    return response.data.permissions;
  }

  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post<{ role: Role }>('/api/roles', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create role');
    }
    return response.data.role;
  }

  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await api.patch<{ role: Role }>(`/api/roles/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update role');
    }
    return response.data.role;
  }

  async deleteRole(id: string): Promise<void> {
    const response = await api.delete(`/api/roles/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete role');
    }
  }
}

export const rolesService = new RolesService();
