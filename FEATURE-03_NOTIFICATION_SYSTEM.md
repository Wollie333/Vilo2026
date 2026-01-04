# FEATURE-03: Notification System

## Status: IN PROGRESS
## Created: 2026-01-04

---

## Overview

A robust, extensible notification system for the Vilo vacation rental platform featuring:
- **Toast Notifications**: Transient in-app popup notifications with auto-dismiss
- **Notification Center**: Persistent inbox with bell icon in header
- **Email Notifications**: Backend email delivery for important events
- **Real-time Updates**: Supabase Realtime for instant notification delivery
- **Template System**: Data-driven templates for easy extensibility

---

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| In-App Notifications | Toast popups with 4 variants (success, error, warning, info) |
| Notification Center | Bell icon with unread badge + dropdown list |
| Persistence | Database storage with read/unread tracking |
| Email Integration | Supabase Edge Functions / Resend / SendGrid |
| Real-time | Supabase Realtime subscriptions |
| Templates | {{placeholder}} syntax for dynamic content |
| Extensibility | Add new notification types via database only |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + TypeScript + TailwindCSS                               │
│  ├── NotificationContext (state + realtime subscription)        │
│  ├── Toast Component (transient popups)                         │
│  ├── NotificationCenter (bell icon dropdown)                    │
│  └── NotificationsPage (full history)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP + Supabase Realtime
┌─────────────────────▼───────────────────────────────────────────┐
│                         BACKEND                                  │
│  Express + TypeScript                                           │
│  ├── Notification Service (CRUD + bulk + templates)            │
│  ├── Email Service (Supabase/Resend/SendGrid)                  │
│  └── Notification Routes (REST API)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Service Role
┌─────────────────────▼───────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ├── Database (notification_types, templates, notifications)   │
│  ├── RLS Policies (user-scoped access)                         │
│  ├── Realtime (postgres_changes on notifications table)        │
│  └── Edge Functions (optional email sending)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Overview

```
notification_types
    └── notification_templates
            └── notifications ──► user_profiles
```

### Core Tables

#### 1. `notification_types` - Notification categories
```sql
- id (UUID, PK)
- name (unique): 'booking', 'payment', 'system', 'user', 'reminder', 'approval'
- display_name, description
- icon (for frontend display)
- color: 'info' | 'success' | 'warning' | 'error'
- is_system_type (boolean - protects deletion)
- sort_order (integer)
```

#### 2. `notification_templates` - Reusable templates
```sql
- id (UUID, PK)
- notification_type_id (FK)
- name (unique): 'booking_created', 'payment_received', etc.
- title_template: 'New Booking from {{guest_name}}'
- message_template: 'Booking at {{property_name}} on {{check_in_date}}'
- email_subject_template, email_body_template (optional)
- default_priority: 'low' | 'normal' | 'high' | 'urgent'
- default_variant: 'info' | 'success' | 'warning' | 'error'
- is_active (boolean)
```

#### 3. `notifications` - User notifications
```sql
- id (UUID, PK)
- user_id (FK to user_profiles)
- notification_type_id, template_id (FK, optional)
- title, message, variant
- data (JSONB - template variables and metadata)
- priority: 'low' | 'normal' | 'high' | 'urgent'
- read (boolean), read_at (timestamp)
- email_sent, email_sent_at, push_sent, push_sent_at
- action_url, action_label (for clickable notifications)
- expires_at (optional - auto-cleanup)
```

### Default Notification Types (Seeded)

| Type | Color | Description |
|------|-------|-------------|
| `booking` | info | Booking-related notifications |
| `payment` | success | Payment and billing |
| `property` | info | Property updates |
| `user` | info | Account notifications |
| `system` | warning | System alerts |
| `reminder` | info | Scheduled reminders |
| `approval` | success | Approval workflows |

### Default Templates (Seeded)

| Template | Type | Priority | Variant |
|----------|------|----------|---------|
| `booking_created` | booking | high | info |
| `booking_confirmed` | booking | normal | success |
| `booking_cancelled` | booking | high | warning |
| `check_in_reminder` | booking | normal | info |
| `payment_received` | payment | normal | success |
| `payment_failed` | payment | urgent | error |
| `refund_processed` | payment | normal | success |
| `welcome` | user | normal | success |
| `account_approved` | approval | high | success |
| `account_pending` | approval | normal | info |
| `new_user_pending` | approval | high | info |
| `system_maintenance` | system | normal | warning |

---

## Backend Structure

```
backend/src/
├── types/
│   └── notification.types.ts      # TypeScript interfaces
├── validators/
│   └── notification.validators.ts # Zod schemas
├── services/
│   ├── notifications.service.ts   # Core business logic
│   └── email.service.ts           # Email abstraction
├── controllers/
│   └── notifications.controller.ts
└── routes/
    └── notifications.routes.ts
```

### API Endpoints

#### Notification Routes (`/api/notifications`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List user's notifications (paginated) | Required |
| GET | `/stats` | Get unread count & statistics | Required |
| GET | `/:id` | Get single notification | Required |
| POST | `/` | Create notification | Admin |
| POST | `/bulk` | Bulk create for multiple users | Admin |
| PATCH | `/:id/read` | Mark as read | Required |
| PATCH | `/read-all` | Mark all as read | Required |
| PATCH | `/read` | Mark multiple as read | Required |
| DELETE | `/:id` | Delete notification | Required |

### Query Parameters for GET `/`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `read` | boolean | Filter by read status |
| `type` | string | Filter by notification type name |
| `priority` | string | Filter by priority |
| `startDate` | ISO date | Filter from date |
| `endDate` | ISO date | Filter to date |
| `sortBy` | string | 'created_at' or 'priority' |
| `sortOrder` | string | 'asc' or 'desc' |

### Service Methods

```typescript
// Create single notification
createNotification(request, actorId): Promise<Notification>

// Create for multiple users
createBulkNotifications(request, actorId): Promise<{created, failed}>

// Notify by role
notifyUsersByRole(roleName, request, actorId): Promise<{created, failed}>

// Get paginated notifications
getUserNotifications(userId, params): Promise<NotificationListResponse>

// Mark as read
markAsRead(userId, notificationIds?): Promise<{updated}>
markAllAsRead(userId): Promise<{updated}>

// Delete
deleteNotification(notificationId, userId): Promise<void>

// Statistics
getNotificationStats(userId): Promise<NotificationStats>

// Cleanup
cleanupExpiredNotifications(): Promise<{deleted}>
```

---

## Frontend Structure

```
frontend/src/
├── types/
│   └── notification.types.ts       # Shared types
├── context/
│   └── NotificationContext.tsx     # Global state + realtime
├── services/
│   └── notification.service.ts     # API client
├── components/
│   ├── ui/
│   │   └── Toast/
│   │       ├── index.ts
│   │       ├── Toast.tsx
│   │       ├── Toast.types.ts
│   │       └── ToastContainer.tsx
│   └── features/
│       └── NotificationCenter/
│           ├── index.ts
│           ├── NotificationCenter.tsx
│           ├── NotificationCenter.types.ts
│           └── NotificationItem.tsx
├── pages/
│   ├── notifications/
│   │   ├── NotificationsPage.tsx
│   │   └── index.ts
│   └── design-system/
│       └── NotificationsShowcase.tsx
```

### Toast Component

**Variants**: info, success, warning, error (matching Alert component)

**Positions**: top-right, top-left, bottom-right, bottom-left, top-center, bottom-center

**Features**:
- Auto-dismiss with configurable duration
- Pause timer on hover
- Stack multiple toasts
- CSS animations (slide + fade)
- Dismissible with close button
- Optional action button

### NotificationContext

**State**:
```typescript
interface NotificationState {
  notifications: Notification[];  // Persistent from API
  unreadCount: number;
  toasts: Toast[];               // Ephemeral client-side
  isLoading: boolean;
  error: string | null;
}
```

**Methods**:
```typescript
// Toast (ephemeral)
toast(options: ToastOptions): string;
dismissToast(id: string): void;
clearAllToasts(): void;

// Persistent notifications
markAsRead(id: string): Promise<void>;
markAllAsRead(): Promise<void>;
deleteNotification(id: string): Promise<void>;
refetch(): Promise<void>;
```

**Real-time Integration**:
```typescript
// Subscribes to postgres_changes on notifications table
// Automatically updates state when new notifications arrive
supabase.channel(`notifications:${userId}`)
  .on('postgres_changes', { event: '*', table: 'notifications' }, handler)
  .subscribe();
```

### NotificationCenter Component

- Bell icon with unread count badge
- Dropdown with scrollable notification list
- Click to mark as read and navigate (if action_url)
- "Mark all as read" button
- "View all" link to NotificationsPage
- Empty state when no notifications

### NotificationsPage

- Full page in AuthenticatedLayout
- Filter tabs: All, Unread, Read
- Pagination or infinite scroll
- Bulk actions: Mark all read, Clear all
- Empty states for each filter

---

## Implementation Phases

### Phase 1: Database Setup
- [x] Create migration `010_create_notifications_schema.sql`
- [x] Create tables: notification_types, notification_templates, notifications
- [x] Set up RLS policies
- [x] Create helper functions (render_template, create_notification_from_template)
- [x] Enable Realtime on notifications table
- [x] Seed default types and templates

### Phase 2: Backend Foundation
- [ ] Create `notification.types.ts`
- [ ] Create `notification.validators.ts` (Zod schemas)
- [ ] Create `email.service.ts`

### Phase 3: Backend Service Layer
- [ ] Create `notifications.service.ts`
- [ ] Create `notifications.controller.ts`
- [ ] Create `notifications.routes.ts`
- [ ] Mount routes in `routes/index.ts`
- [ ] Update `services/index.ts` exports

### Phase 4: Frontend Foundation
- [ ] Create `notification.types.ts`
- [ ] Create `notification.service.ts`
- [ ] Update tailwind.config.js with toast animations

### Phase 5: Toast Component
- [ ] Create `Toast.types.ts`
- [ ] Create `Toast.tsx`
- [ ] Create `ToastContainer.tsx`
- [ ] Export from `components/ui/index.ts`

### Phase 6: NotificationContext
- [ ] Create `NotificationContext.tsx`
- [ ] Implement toast state management
- [ ] Implement persistent notification fetching
- [ ] Add Supabase Realtime subscription
- [ ] Wrap App with NotificationProvider

### Phase 7: NotificationCenter
- [ ] Create `NotificationItem.tsx`
- [ ] Create `NotificationCenter.tsx`
- [ ] Integrate in Header component

### Phase 8: Pages & Polish
- [ ] Create `NotificationsPage.tsx`
- [ ] Create `NotificationsShowcase.tsx`
- [ ] Add routes to App.tsx
- [ ] Test real-time updates
- [ ] Test dark mode styling

---

## Usage Examples

### Triggering a Toast (Frontend)

```tsx
import { useNotification } from '@/context/NotificationContext';

function MyComponent() {
  const { toast } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      toast({
        variant: 'success',
        title: 'Saved!',
        message: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Error',
        message: 'Failed to save changes. Please try again.',
        duration: 0, // Don't auto-dismiss errors
      });
    }
  };
}
```

### Creating Notification from Backend Service

```typescript
import { createNotification } from './notifications.service';

// Using a template
await createNotification({
  user_id: propertyOwnerId,
  template_name: 'booking_created',
  data: {
    guest_name: booking.guestName,
    property_name: property.name,
    check_in_date: booking.checkIn,
    check_out_date: booking.checkOut,
    booking_id: booking.id,
  },
  action_url: `/bookings/${booking.id}`,
  action_label: 'View Booking',
  send_email: true,
}, actorId);

// Direct (without template)
await createNotification({
  user_id: userId,
  title: 'Custom Notification',
  message: 'This is a custom message.',
  variant: 'info',
  priority: 'normal',
}, actorId);
```

### Notifying All Admins

```typescript
import { notifyUsersByRole } from './notifications.service';

await notifyUsersByRole('super_admin', {
  template_name: 'system_maintenance',
  data: {
    maintenance_date: '2026-01-15 02:00 UTC',
    duration: '2 hours',
  },
  priority: 'high',
  send_email: true,
}, actorId);
```

### Bulk Notifications

```typescript
import { createBulkNotifications } from './notifications.service';

await createBulkNotifications({
  user_ids: ['uuid1', 'uuid2', 'uuid3'],
  template_name: 'system_update',
  data: {
    update_title: 'New Feature',
    update_message: 'We have added a new booking calendar view.',
  },
  send_email: false,
}, actorId);
```

---

## Extensibility

### Adding New Notification Types

**No code changes required!** Just add database rows:

```sql
-- 1. Add new type
INSERT INTO notification_types (name, display_name, description, icon, color)
VALUES ('marketing', 'Marketing', 'Promotional notifications', 'megaphone', 'info');

-- 2. Add templates for the type
INSERT INTO notification_templates (
  notification_type_id,
  name,
  title_template,
  message_template,
  default_priority,
  default_variant
)
SELECT
  id,
  'new_promotion',
  'Special Offer: {{promo_title}}',
  '{{promo_description}} Valid until {{expiry_date}}.',
  'normal',
  'info'
FROM notification_types WHERE name = 'marketing';
```

Then use it:
```typescript
await createNotification({
  user_id: userId,
  template_name: 'new_promotion',
  data: {
    promo_title: '20% Off Summer Bookings',
    promo_description: 'Book now and save on summer stays.',
    expiry_date: '2026-06-30',
  },
});
```

---

## Files to Create/Modify

### Backend (New Files)
```
backend/migrations/010_create_notifications_schema.sql  ✓ CREATED
backend/src/types/notification.types.ts
backend/src/validators/notification.validators.ts
backend/src/services/email.service.ts
backend/src/services/notifications.service.ts
backend/src/controllers/notifications.controller.ts
backend/src/routes/notifications.routes.ts
```

### Backend (Modify)
```
backend/src/routes/index.ts          # Mount notification routes
backend/src/services/index.ts        # Export services
backend/src/controllers/index.ts     # Export controller
backend/src/types/index.ts           # Export types
backend/src/config/env.ts            # Add email config vars
```

### Frontend (New Files)
```
frontend/src/types/notification.types.ts
frontend/src/services/notification.service.ts
frontend/src/context/NotificationContext.tsx
frontend/src/components/ui/Toast/index.ts
frontend/src/components/ui/Toast/Toast.tsx
frontend/src/components/ui/Toast/Toast.types.ts
frontend/src/components/ui/Toast/ToastContainer.tsx
frontend/src/components/features/NotificationCenter/index.ts
frontend/src/components/features/NotificationCenter/NotificationCenter.tsx
frontend/src/components/features/NotificationCenter/NotificationCenter.types.ts
frontend/src/components/features/NotificationCenter/NotificationItem.tsx
frontend/src/pages/notifications/NotificationsPage.tsx
frontend/src/pages/notifications/index.ts
frontend/src/pages/design-system/NotificationsShowcase.tsx
```

### Frontend (Modify)
```
frontend/src/components/ui/index.ts           # Export Toast
frontend/src/components/layout/Header/Header.tsx  # Add NotificationCenter
frontend/src/App.tsx                          # Add provider + routes
frontend/src/pages/design-system/index.ts     # Export showcase
frontend/tailwind.config.js                   # Add toast animations
```

---

## Environment Variables

### Backend (.env)
```
# Email Configuration (optional)
EMAIL_PROVIDER=supabase           # supabase | resend | sendgrid
EMAIL_FROM=noreply@vilo.app
RESEND_API_KEY=re_xxxxx           # If using Resend
SENDGRID_API_KEY=SG.xxxxx         # If using SendGrid
```

---

## Notes

1. **Email Provider**: Email sending is optional. If not configured, notifications are created without email delivery.

2. **Real-time Requirements**: Supabase Realtime must be enabled for the project. The migration enables the notifications table for realtime.

3. **Permission for Creating Notifications**: Only users with admin roles can create notifications for other users. Regular users can only view/manage their own.

4. **Cleanup Job**: Consider setting up a scheduled job to call `cleanupExpiredNotifications()` periodically.

5. **Browser Notifications**: Future enhancement - can add Web Push notifications using the existing infrastructure.
