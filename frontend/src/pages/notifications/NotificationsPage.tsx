/**
 * Notifications Page
 * FEATURE-03: Notification System
 *
 * Full page view for browsing and managing all notifications.
 */

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card, Button, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { NotificationItem } from '@/components/features/NotificationCenter';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationListParams, Notification } from '@/types/notification.types';

const BellIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

type FilterTab = 'all' | 'unread' | 'read';

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

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
  } = useNotifications();

  // Fetch notifications on mount and when tab changes
  useEffect(() => {
    const params: NotificationListParams = {
      page: 1,
      limit: 20,
    };

    if (activeTab === 'unread') {
      params.read = false;
    } else if (activeTab === 'read') {
      params.read = true;
    }

    fetchNotifications(params);
    setPage(1);
    setHasMore(true);
  }, [activeTab, fetchNotifications]);

  // Update local notifications when context notifications change
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const params: NotificationListParams = {
      page: nextPage,
      limit: 20,
    };

    if (activeTab === 'unread') {
      params.read = false;
    } else if (activeTab === 'read') {
      params.read = true;
    }

    await fetchNotifications(params);
    setPage(nextPage);

    // Check if we have more notifications
    if (notifications.length < 20) {
      setHasMore(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead([id]);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete all notifications? This action cannot be undone.'
      )
    ) {
      try {
        await clearAllNotifications();
        setLocalNotifications([]);
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
  };

  const handleClick = (notification: Notification) => {
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = localNotifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  return (
    <AuthenticatedLayout
      title="Notifications"
      subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
    >
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Notifications
            </h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
              {localNotifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as FilterTab)}
          >
            <div className="border-b border-gray-200 dark:border-dark-border px-4">
              <TabsList variant="underline">
                <TabsTrigger value="all" variant="underline">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" variant="underline">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="read" variant="underline">
                  Read
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="p-0 mt-0">
              {isLoading && filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <p className="text-error text-sm mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNotifications({ page: 1, limit: 20 })}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-4 text-gray-400">
                    <BellIcon />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {activeTab === 'unread'
                      ? 'No unread notifications'
                      : activeTab === 'read'
                        ? 'No read notifications'
                        : 'No notifications yet'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeTab === 'unread'
                      ? "You're all caught up!"
                      : "When you receive notifications, they'll appear here."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 dark:divide-dark-border">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        onClick={handleClick}
                      />
                    ))}
                  </div>

                  {hasMore && filteredNotifications.length >= 20 && (
                    <div className="flex justify-center py-4 border-t border-gray-100 dark:border-dark-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        isLoading={isLoading}
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card.Body>
      </Card>
    </AuthenticatedLayout>
  );
}

export default NotificationsPage;
