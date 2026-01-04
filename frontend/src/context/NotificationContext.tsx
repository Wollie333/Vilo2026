/**
 * Notification Context
 * FEATURE-03: Notification System
 *
 * Global state management for toasts and persistent notifications.
 * Includes Supabase Realtime subscription for live updates.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { supabase } from '@/config/supabase';
import { ToastContainer } from '@/components/ui/Toast';
import type { ToastData } from '@/components/ui/Toast';
import type {
  Notification,
  ToastOptions,
  NotificationListParams,
  NotificationState,
  NotificationContextValue,
  ToastPosition,
} from '@/types/notification.types';
import { notificationService } from '@/services/notification.service';
import { useAuth } from './AuthContext';

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
  toastPosition?: ToastPosition;
  maxToasts?: number;
  defaultToastDuration?: number;
}

// ============================================================================
// Provider
// ============================================================================

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  toastPosition = 'top-right',
  maxToasts = 5,
  defaultToastDuration = 5000,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Toast state
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Persistent notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Toast Methods
  // ============================================================================

  const generateToastId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = generateToastId();
      const newToast: ToastData = {
        id,
        variant: options.variant || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? defaultToastDuration,
        dismissible: options.dismissible ?? true,
        action: options.action,
        onDismiss: options.onDismiss,
      };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    [defaultToastDuration, generateToastId]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // ============================================================================
  // Notification Methods (API)
  // ============================================================================

  const fetchNotifications = useCallback(
    async (params: NotificationListParams = {}) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await notificationService.getNotifications(params);
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(message);
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const stats = await notificationService.getStats();
      setUnreadCount(stats.unread);
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      if (!isAuthenticated) return;

      try {
        await notificationService.markAsRead(notificationIds);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => {
            if (!notificationIds || notificationIds.includes(n.id)) {
              return { ...n, read: true, read_at: new Date().toISOString() };
            }
            return n;
          })
        );

        // Refresh unread count
        await refreshUnreadCount();
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
        throw err;
      }
    },
    [isAuthenticated, refreshUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      try {
        await notificationService.deleteNotification(id);

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Refresh unread count
        await refreshUnreadCount();
      } catch (err) {
        console.error('Failed to delete notification:', err);
        throw err;
      }
    },
    [isAuthenticated, refreshUnreadCount]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await notificationService.clearAll();

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Initial Fetch & Realtime Subscription
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications({ limit: 20 });
    refreshUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Add to notifications list
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast for high priority notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast({
              variant: newNotification.variant,
              title: newNotification.title,
              message: newNotification.message,
              action: newNotification.action_url
                ? {
                    label: newNotification.action_label || 'View',
                    onClick: () => {
                      window.location.href = newNotification.action_url!;
                    },
                  }
                : undefined,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;

          // Update in notifications list
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );

          // Refresh unread count if read status changed
          if (updatedNotification.read) {
            refreshUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;

          // Remove from notifications list
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));

          // Refresh unread count
          refreshUnreadCount();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, fetchNotifications, refreshUnreadCount, toast]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const state: NotificationState = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      toasts,
    }),
    [notifications, unreadCount, isLoading, error, toasts]
  );

  const value: NotificationContextValue = useMemo(
    () => ({
      ...state,
      toast,
      dismissToast,
      clearToasts,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      refreshUnreadCount,
    }),
    [
      state,
      toast,
      dismissToast,
      clearToasts,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      refreshUnreadCount,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position={toastPosition}
        maxToasts={maxToasts}
      />
    </NotificationContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// ============================================================================
// Convenience Hooks
// ============================================================================

export const useToast = () => {
  const { toast, dismissToast, clearToasts, toasts } = useNotification();
  return { toast, dismissToast, clearToasts, toasts };
};

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshUnreadCount,
  } = useNotification();

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshUnreadCount,
  };
};
