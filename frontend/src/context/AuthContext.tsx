import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { authService, api, billingService } from '../services';
import type {
  LoginCredentials,
  SignUpData,
  AuthState,
} from '../types';
import type { SubscriptionAccessStatus } from '../types/subscription-access.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignUpData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearInitializing: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  // Subscription access
  subscriptionAccess: SubscriptionAccessStatus | null;
  checkSubscriptionAccess: () => Promise<void>;
  isPaused: boolean;
  isCancelled: boolean;
  hasWriteAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    isInitializing: false,
    error: null,
  });

  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessStatus | null>(null);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = api.getAccessToken();
      const refreshToken = api.getRefreshToken();

      if (accessToken) {
        try {
          const user = await authService.getCurrentUser(true); // Silent mode during init
          if (user) {
            setState({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              isInitializing: false,
              error: null,
            });
            return;
          } else {
            // User not found but API call succeeded - invalid token
            api.clearTokens();
          }
        } catch (error: any) {
          // Handle 401 errors (expired/invalid token) - clear tokens and log out
          if (error?.response?.status === 401 || error?.status === 401) {
            // Token is invalid or expired - clear it silently
            api.clearTokens();
          } else {
            // For other errors (network issues, etc.), keep trying
            // Only log non-auth errors
            console.warn('Failed to fetch user on init:', error);

            // If we have tokens and it's not an auth error, keep them
            if (accessToken && refreshToken) {
              // Keep user logged in, but mark as loading finished
              setState({
                user: null,
                accessToken,
                refreshToken,
                isAuthenticated: true, // Keep authenticated
                isLoading: false,
                isInitializing: false,
                error: null,
              });
              return;
            }
          }
        }
      }

      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        error: null,
      });
    };

    initAuth();
  }, []);

  // Auto-fetch user data if authenticated but user is null
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (state.isAuthenticated && !state.user && !state.isLoading) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            setState((prev) => ({ ...prev, user }));
          }
        } catch (error) {
          console.warn('Failed to fetch user data:', error);
          // Don't log out - just try again later
        }
      }
    };

    fetchUserIfNeeded();
  }, [state.isAuthenticated, state.user, state.isLoading]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);
      if (response) {
        const user = await authService.getCurrentUser();
        setState({
          user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignUpData) => {
    setState((prev) => ({ ...prev, isLoading: true, isInitializing: true, error: null }));

    try {
      const response = await authService.signUp(data);
      if (response) {
        // Set authenticated state immediately with basic user info
        // This allows the user to proceed to checkout/onboarding
        setState({
          user: {
            id: response.user.id,
            email: response.user.email,
            // Minimal profile - will be loaded fully later
            roles: [],
            effectivePermissions: [],
            directPermissions: [],
            properties: [],
          } as any,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          isInitializing: true, // Keep true for onboarding redirect
          error: null,
        });

        // Load full user profile in background (don't block)
        authService.getCurrentUser().then(user => {
          if (user) {
            setState(prev => ({ ...prev, user }));
          }
        }).catch(() => {
          // Ignore errors - user is already authenticated
        });
      }
      return { message: 'Account created successfully' };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isInitializing: false, // Reset on error
        error: error instanceof Error ? error.message : 'Sign up failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors - clear state anyway
      console.warn('Logout API call failed:', error);
    }
    api.clearTokens();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setState((prev) => ({ ...prev, user }));
      }
    } catch (error) {
      // Ignore refresh errors
    }
  }, []);

  const clearInitializing = useCallback(() => {
    setState((prev) => ({ ...prev, isInitializing: false }));
  }, []);

  const checkSubscriptionAccess = useCallback(async () => {
    if (!state.isAuthenticated) {
      setSubscriptionAccess(null);
      return;
    }

    try {
      const access = await billingService.getMySubscriptionAccess();
      setSubscriptionAccess(access);
    } catch (error) {
      console.warn('Failed to fetch subscription access:', error);
      // Don't clear state on error - keep previous value
    }
  }, [state.isAuthenticated]);

  // Fetch subscription access on authentication
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      checkSubscriptionAccess();
    } else {
      setSubscriptionAccess(null);
    }
  }, [state.isAuthenticated, state.user, checkSubscriptionAccess]);

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      return authService.hasPermission(state.user, resource, action);
    },
    [state.user]
  );

  const hasRole = useCallback(
    (roleName: string): boolean => {
      return authService.hasRole(state.user, roleName);
    },
    [state.user]
  );

  const isSuperAdmin = useMemo(() => authService.isSuperAdmin(state.user), [state.user]);
  const isAdmin = useMemo(() => authService.isAdmin(state.user), [state.user]);

  // Derived subscription access values
  const isPaused = useMemo(() => subscriptionAccess?.subscriptionStatus === 'paused', [subscriptionAccess]);
  const isCancelled = useMemo(() => subscriptionAccess?.subscriptionStatus === 'cancelled', [subscriptionAccess]);
  const hasWriteAccess = useMemo(() => subscriptionAccess?.accessMode === 'full', [subscriptionAccess]);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
    clearInitializing,
    hasPermission,
    hasRole,
    isSuperAdmin,
    isAdmin,
    subscriptionAccess,
    checkSubscriptionAccess,
    isPaused,
    isCancelled,
    hasWriteAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
