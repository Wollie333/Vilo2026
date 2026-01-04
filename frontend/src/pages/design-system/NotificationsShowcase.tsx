/**
 * Notifications Showcase
 * FEATURE-03: Notification System
 *
 * Design system documentation for Toast and Notification components.
 */

import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/context/NotificationContext';
import { ComponentShowcase, PropsTable } from './components';
import type { ToastPosition, NotificationVariant } from '@/types/notification.types';

export function NotificationsShowcase() {
  const { toast } = useToast();
  const [demoPosition, setDemoPosition] = useState<ToastPosition>('top-right');

  const showToast = (variant: NotificationVariant, title: string, message?: string) => {
    toast({
      variant,
      title,
      message,
      duration: 5000,
    });
  };

  const showToastWithAction = () => {
    toast({
      variant: 'info',
      title: 'New booking request',
      message: 'John Doe requested to book Ocean View Villa',
      action: {
        label: 'View Details',
        onClick: () => console.log('Viewing details...'),
      },
    });
  };

  const showPersistentToast = () => {
    toast({
      variant: 'warning',
      title: 'Session expiring',
      message: 'Your session will expire in 5 minutes. Save your work to avoid losing changes.',
      duration: 0, // Never auto-dismiss
    });
  };

  const positions: ToastPosition[] = [
    'top-right',
    'top-left',
    'top-center',
    'bottom-right',
    'bottom-left',
    'bottom-center',
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications System
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Toast notifications and notification center for transient and persistent messaging.
          </p>
        </div>

        {/* Toast Variants Section */}
        <ComponentShowcase
          title="Toast Variants"
          description="Display transient messages with different semantic variants."
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => showToast('info', 'Information', 'This is an informational message.')}
              >
                Info Toast
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  showToast('success', 'Success!', 'Your changes have been saved successfully.')
                }
              >
                Success Toast
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  showToast('warning', 'Warning', 'Please review your settings before continuing.')
                }
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  showToast('error', 'Error', 'Something went wrong. Please try again.')
                }
              >
                Error Toast
              </Button>
            </div>

            <Card variant="bordered" className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Usage</h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card p-3 rounded-md overflow-x-auto">
{`import { useToast } from '@/context/NotificationContext';

const { toast } = useToast();

// Show a success toast
toast({
  variant: 'success',
  title: 'Saved!',
  message: 'Your changes have been saved.',
});`}
              </pre>
            </Card>
          </div>
        </ComponentShowcase>

        {/* Toast with Actions */}
        <ComponentShowcase
          title="Toast with Actions"
          description="Add actionable buttons to toasts for quick user interactions."
        >
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" onClick={showToastWithAction}>
                Toast with Action
              </Button>
              <Button variant="outline" onClick={showPersistentToast}>
                Persistent Toast (no auto-dismiss)
              </Button>
            </div>

            <Card variant="bordered" className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Usage</h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card p-3 rounded-md overflow-x-auto">
{`// Toast with action button
toast({
  variant: 'info',
  title: 'New booking request',
  message: 'John Doe requested to book Ocean View Villa',
  action: {
    label: 'View Details',
    onClick: () => navigate('/bookings/123'),
  },
});

// Persistent toast (duration: 0)
toast({
  variant: 'warning',
  title: 'Session expiring',
  message: 'Your session will expire in 5 minutes.',
  duration: 0, // Never auto-dismiss
});`}
              </pre>
            </Card>
          </div>
        </ComponentShowcase>

        {/* Toast Positions */}
        <ComponentShowcase
          title="Toast Positions"
          description="Configure where toasts appear on the screen."
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <Button
                  key={pos}
                  variant={demoPosition === pos ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDemoPosition(pos)}
                >
                  {pos}
                </Button>
              ))}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selected position: <code className="bg-gray-100 dark:bg-dark-card px-2 py-0.5 rounded">{demoPosition}</code>
            </p>

            <Card variant="bordered" className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Configuring Position
              </h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card p-3 rounded-md overflow-x-auto">
{`// In your App.tsx
<NotificationProvider toastPosition="top-right" maxToasts={5}>
  <App />
</NotificationProvider>`}
              </pre>
            </Card>
          </div>
        </ComponentShowcase>

        {/* Multiple Toasts */}
        <ComponentShowcase
          title="Stacking Multiple Toasts"
          description="Multiple toasts stack automatically with configurable limits."
        >
          <div className="space-y-6">
            <Button
              variant="primary"
              onClick={() => {
                showToast('info', 'First notification', 'This appeared first');
                setTimeout(() => showToast('success', 'Second notification', 'This appeared second'), 500);
                setTimeout(() => showToast('warning', 'Third notification', 'This appeared third'), 1000);
              }}
            >
              Show Multiple Toasts
            </Button>

            <Card variant="bordered" className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Toasts stack in order of appearance</li>
                <li>Maximum number of visible toasts is configurable (default: 5)</li>
                <li>Hovering over a toast pauses its auto-dismiss timer</li>
                <li>Each toast can be dismissed individually</li>
              </ul>
            </Card>
          </div>
        </ComponentShowcase>

        {/* Notification Center */}
        <ComponentShowcase
          title="Notification Center"
          description="Persistent notification inbox accessible from the header."
        >
          <div className="space-y-6">
            <Card variant="bordered" className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Features</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Bell icon in header with unread count badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Dropdown showing recent notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Mark as read on click</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time updates via Supabase Realtime</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Priority indicators for high/urgent notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Link to full notifications page</span>
                </li>
              </ul>
            </Card>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              The NotificationCenter component is already integrated in the Header. Click the bell
              icon in the top navigation to see it in action.
            </p>
          </div>
        </ComponentShowcase>

        {/* useNotification Hook */}
        <ComponentShowcase
          title="useNotification Hook"
          description="Access notification context methods and state."
        >
          <Card variant="bordered" className="p-4">
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card p-3 rounded-md overflow-x-auto">
{`import { useNotification, useToast, useNotifications } from '@/context/NotificationContext';

// Full context access
const {
  // Toast methods
  toast,
  dismissToast,
  clearToasts,
  toasts,

  // Notification methods
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

// Just toast methods
const { toast, dismissToast, clearToasts, toasts } = useToast();

// Just notification methods
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
} = useNotifications();`}
            </pre>
          </Card>
        </ComponentShowcase>

        {/* ToastOptions Props Table */}
        <PropsTable
          props={[
            { name: 'variant', type: "'info' | 'success' | 'warning' | 'error'", default: "'info'", description: 'Toast color variant' },
            { name: 'title', type: 'string', required: true, description: 'Toast title text' },
            { name: 'message', type: 'string', description: 'Optional description text' },
            { name: 'duration', type: 'number', default: '5000', description: 'Auto-dismiss duration in ms. Set to 0 for persistent toast.' },
            { name: 'dismissible', type: 'boolean', default: 'true', description: 'Show close button' },
            { name: 'action', type: '{ label: string; onClick: () => void }', description: 'Optional action button' },
            { name: 'onDismiss', type: '() => void', description: 'Callback when toast is dismissed' },
          ]}
        />

        {/* Backend Integration */}
        <ComponentShowcase
          title="Backend Integration"
          description="Creating notifications from the backend."
        >
          <Card variant="bordered" className="p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Creating Notifications from Backend
            </h4>
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card p-3 rounded-md overflow-x-auto">
{`import { createNotification, notifyUsersByRole } from '@/services/notifications.service';

// Create a single notification
await createNotification({
  user_id: ownerId,
  template_name: 'booking_created',
  data: {
    guest_name: 'John Doe',
    property_name: 'Ocean View Villa',
    check_in_date: '2026-01-15',
  },
  action_url: \`/bookings/\${bookingId}\`,
  send_email: true,
});

// Notify all users with a specific role
await notifyUsersByRole('admin', {
  template_name: 'system_maintenance',
  data: {
    maintenance_date: '2026-01-20',
    duration: '2 hours',
  },
  priority: 'high',
  send_email: true,
}, actorId);`}
            </pre>
          </Card>
        </ComponentShowcase>

        {/* Extensibility */}
        <ComponentShowcase
          title="Adding New Notification Types"
          description="The notification system is fully data-driven and extensible."
        >
          <Card variant="bordered" className="p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Steps to Add a New Type</h4>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-3 list-decimal list-inside">
              <li>
                Add a row to <code className="bg-gray-100 dark:bg-dark-card px-1 rounded">notification_types</code> table
              </li>
              <li>
                Create templates in <code className="bg-gray-100 dark:bg-dark-card px-1 rounded">notification_templates</code> table
              </li>
              <li>
                Call <code className="bg-gray-100 dark:bg-dark-card px-1 rounded">createNotification(&#123; template_name: 'new_template', ... &#125;)</code>
              </li>
            </ol>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              No code changes required for new notification types - fully data-driven!
            </p>
          </Card>
        </ComponentShowcase>
      </div>
    </AuthenticatedLayout>
  );
}

export default NotificationsShowcase;
