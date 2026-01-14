import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { authService, api } from '../services';
import type {
  LoginCredentials,
  SignUpData,
  AuthState,
} from '../types';

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

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = api.getAccessToken();
      const refreshToken = api.getRefreshToken();

      if (accessToken) {
        try {
          const user = await authService.getCurrentUser();
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
          }
        } catch (error) {
          // Token invalid - clear it
          api.clearTokens();
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
    await authService.logout();
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
