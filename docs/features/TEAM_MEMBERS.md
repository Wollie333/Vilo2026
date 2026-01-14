# Team Member Functionality

> **Status**: Planning / Future Implementation
> **Last Updated**: 2026-01-04

## Overview

Team members are users invited by clients (SaaS customers) or SaaS administrators to help manage their accounts. They do not have their own subscriptions - they inherit access from their parent account.

---

## User Types with Team Member Capabilities

| User Type | Can Create Team Members | Team Member Type Created |
|-----------|------------------------|--------------------------|
| `saas_customer` (Client) | Yes | `team_member` |
| `super_admin` | Yes | `saas_team_member` |

---

## Billing Model

- **Team members are NOT billed separately**
- They inherit subscription limits from their parent account
- The `parent_user_id` field in `user_profiles` links team members to their parent
- Subscription limit checks use the parent's subscription (see `check_subscription_limit()` function)

---

## Permission System

### Inheritance Model
- Team members get access based on permissions **assigned by their parent**
- Parent users can grant permissions up to (but not exceeding) their own permission level
- This allows clients to delegate specific tasks to their staff

### Permission Assignment
When creating a team member, the parent can:
1. Assign predefined team positions (roles)
2. Customize individual permissions (future feature)

---

## Team Member Creation Flow

### Form Fields
When a client clicks "Add Team Member", the form should collect:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | text | Yes | Team member's full name |
| `email` | email | Yes | Team member's email (for login) |
| `phone` | text | No | Contact phone number |
| `team_position` | select | Yes | Role/position in the team |

### Process Flow
1. Client opens "Add Team Member" form
2. Enters name, email, phone number
3. Selects team position (role)
4. Submits form
5. System creates user with:
   - `user_type_id` = `team_member`
   - `parent_user_id` = creating user's ID
   - Assigned role/permissions based on team position
6. Email invitation sent to new team member

---

## Team Positions (Predefined Roles)

Initial set of team positions for clients to assign:

| Position | Description | Typical Permissions |
|----------|-------------|---------------------|
| General Manager | Full operational access | All except billing/subscription |
| Sales | Handle bookings and customer inquiries | Bookings, guests, properties (read) |
| Admin | Administrative tasks | Users, settings, reports |
| Accountant | Financial operations | Reports, analytics, invoices |
| Front Desk | Day-to-day guest operations | Check-in/out, guest inquiries |
| Housekeeping | Room management | Room status, schedules |

---

## Future Features

### Custom Role Creation
Allow clients to create their own custom roles:
- Define role name and description
- Select specific permissions to include
- Set role priority level
- Assign to team members

### Permission Granularity
Fine-grained permission control:
- Resource-level permissions (properties, bookings, guests, etc.)
- Action-level permissions (create, read, update, delete, manage)
- Property-scoped permissions (access to specific properties only)

### Team Management UI
- List all team members under account
- Edit team member details and permissions
- Deactivate/reactivate team members
- Transfer team members between positions

---

## Database Schema (Existing)

The system already has infrastructure for this:

```sql
-- user_profiles table
parent_user_id UUID REFERENCES user_profiles(id)  -- Links team member to parent

-- user_types table
team_member type with can_have_subscription = false, can_have_team = false

-- user_roles table (for role assignment)
user_id, role_id, property_id (optional scoping)

-- user_permissions table (for direct permission overrides)
user_id, permission_id, override_type (grant/deny)
```

---

## Related Documentation

- [User Types System](../../backend/migrations/009_create_billing_schema.sql)
- [Role & Permission System](../../backend/src/types/user.types.ts)
- [RBAC Middleware](../../backend/src/middleware/rbac.middleware.ts)
