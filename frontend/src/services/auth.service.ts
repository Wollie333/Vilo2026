import { api } from './api.service';
import type {
  LoginCredentials,
  SignUpData,
  UserWithRoles,
} from '../types';

export interface LoginResponse {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpResponse {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface MeResponse {
  user: UserWithRoles;
}

export const authService = {
  /**
   * Sign up a new user and auto-login
   */
  async signUp(data: SignUpData): Promise<SignUpResponse | null> {
    const response = await api.post<SignUpResponse>('/auth/signup', data);
    if (response.success && response.data) {
      // Set tokens for auto-login (same as login)
      api.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }
    throw new Error(response.error?.message || 'Sign up failed');
  },

  /**
   * Log in with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse | null> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.success && response.data) {
      api.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }
    throw new Error(response.error?.message || 'Login failed');
  },

  /**
   * Log out and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors - still clear tokens
    }
    api.clearTokens();
  },

  /**
   * Get current user profile
   * @param silent - If true, suppresses 401 error logging (useful during auth initialization)
   */
  async getCurrentUser(silent: boolean = false): Promise<UserWithRoles | null> {
    const response = await api.get<MeResponse>('/auth/me', silent ? { _silentAuth: true } as any : undefined);
    if (response.success && response.data) {
      return response.data.user;
    }
    return null;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await api.post('/auth/forgot-password', { email });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send reset email');
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to reset password');
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const response = await api.get(`/api/auth/verify-email?token=${token}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to verify email');
    }
  },

  /**
   * Check if user has a specific permission
   */
  hasPermission(user: UserWithRoles | null, resource: string, action: string): boolean {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;

    // Super admin has all permissions
    if (user.roles.some((r) => r.name === 'super_admin')) return true;

    const key = `${resource}:${action}`;
    const manageKey = `${resource}:manage`;

    const permissions = user.effectivePermissions || [];
    return (
      permissions.includes(key) ||
      permissions.includes(manageKey)
    );
  },

  /**
   * Check if user has a specific role
   */
  hasRole(user: UserWithRoles | null, roleName: string): boolean {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((r) => r.name === roleName);
  },

  /**
   * Check if user is super admin
   */
  isSuperAdmin(user: UserWithRoles | null): boolean {
    return this.hasRole(user, 'super_admin');
  },

  /**
   * Check if user is any admin
   */
  isAdmin(user: UserWithRoles | null): boolean {
    return this.hasRole(user, 'super_admin') || this.hasRole(user, 'property_admin');
  },
};
