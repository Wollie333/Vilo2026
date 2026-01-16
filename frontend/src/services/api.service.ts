import { API_URL } from '../config';
import type { ApiResponse } from '../types';

const TOKEN_KEY = 'vilo_access_token';
const REFRESH_TOKEN_KEY = 'vilo_refresh_token';

class ApiService {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = API_URL;
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // HTTP methods
  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any>; timeout?: number; _retryCount?: number; _silentAuth?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const timeout = options.timeout || 30000; // 30 second default timeout
    const retryCount = options._retryCount || 0;
    const silentAuth = options._silentAuth || false;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const token = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data: ApiResponse<T> = await response.json();

        // Handle 401 - try to refresh token (only once per request)
        if (response.status === 401 && this.getRefreshToken() && retryCount === 0) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshed = await this.refreshTokens();
              this.isRefreshing = false;

              if (refreshed) {
                const newToken = this.getAccessToken();
                if (newToken) {
                  this.onTokenRefreshed(newToken);
                  // Retry the request with new token (increment retry count)
                  return this.request<T>(endpoint, { ...options, _retryCount: retryCount + 1 });
                }
              }
            } catch (error) {
              this.isRefreshing = false;
              throw error;
            }
          } else {
            // Token refresh in progress - wait for it
            return new Promise((resolve) => {
              this.subscribeTokenRefresh(() => {
                resolve(this.request<T>(endpoint, { ...options, _retryCount: retryCount + 1 }));
              });
            });
          }
        }

        // If we get 401 after retry, it's a permissions issue, not a token issue
        if (response.status === 401 && retryCount > 0 && !silentAuth) {
          console.warn('Access denied after token refresh - insufficient permissions for:', endpoint);
        }

        // Don't log 401 errors to console if silentAuth is true (e.g., during auth init)
        if (response.status === 401 && silentAuth && !response.ok) {
          // Silently return the error response without console logging
          return data;
        }

        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Request timed out after ${timeout / 1000} seconds`,
            },
          };
        }
        throw fetchError;
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.warn('Token refresh failed with status:', response.status);
        // Only clear tokens on 401 (invalid token), not on server errors
        if (response.status === 401) {
          this.clearTokens();
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return false;
      }

      const data = await response.json();
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      console.warn('Token refresh response invalid');
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Don't clear tokens on network errors - might be temporary
      return false;
    }
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any>; _silentAuth?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    // DEBUG: Log patch requests to properties
    if (endpoint.includes('/properties/')) {
      console.log('📡 API PATCH Request:', endpoint);
      console.log('  - Body keys:', body ? Object.keys(body as object) : 'no body');
      if (body && (body as any).terms_and_conditions) {
        console.log('  - terms_and_conditions length:', (body as any).terms_and_conditions.length);
      }
      console.log('  - Full body:', body);
    }

    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAccessToken();

    const headers: HeadersInit = {};
    // Don't set Content-Type - browser will set it with boundary for multipart/form-data

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data: ApiResponse<T> = await response.json();

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          // Retry the request with new token
          return this.upload<T>(endpoint, formData);
        }
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }
}

export const api = new ApiService();
