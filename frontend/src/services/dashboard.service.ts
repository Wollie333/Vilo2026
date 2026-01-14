import { api } from './api.service';
import type {
  PropertyOwnerDashboardData,
  GuestDashboardData,
  AdminDashboardData,
  SuperAdminDashboardData
} from '../pages/Dashboard/Dashboard.types';

export const dashboardService = {
  /**
   * Get Property Owner Dashboard Data
   */
  async getPropertyOwnerDashboard(): Promise<PropertyOwnerDashboardData> {
    const response = await api.get<PropertyOwnerDashboardData>('/dashboard/property-owner');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load property owner dashboard');
  },

  /**
   * Get Guest Dashboard Data
   */
  async getGuestDashboard(): Promise<GuestDashboardData> {
    const response = await api.get<GuestDashboardData>('/dashboard/guest');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load guest dashboard');
  },

  /**
   * Get Admin Dashboard Data
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>('/dashboard/admin');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load admin dashboard');
  },

  /**
   * Get Super Admin Dashboard Data
   */
  async getSuperAdminDashboard(): Promise<SuperAdminDashboardData> {
    const response = await api.get<SuperAdminDashboardData>('/dashboard/super-admin');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load super admin dashboard');
  },

  /**
   * Clear dashboard cache (admin only)
   */
  async clearCache(userId?: string): Promise<void> {
    const response = await api.post('/dashboard/clear-cache', { userId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to clear dashboard cache');
    }
  }
};
