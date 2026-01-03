# FEATURE-01: Authentication & User Management System

## Status: PLANNED
## Created: 2026-01-03

---

## Overview

Complete authentication and user management system for Vilo vacation rental platform using Supabase Auth with:
- **Hybrid RBAC**: Super Admin + custom roles with per-user permission overrides
- **Property-based isolation**: Users assigned to specific properties
- **Admin approval workflow**: New signups require approval
- **Extended user profiles**: Name, phone, avatar, timezone, address, company, preferences

---

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Auth Method | Email/Password only |
| Role System | Hybrid RBAC (roles + permission overrides) |
| Multi-tenancy | Property-based isolation |
| Onboarding | Admin approval required |
| Security | Email verification, password reset, secure sessions |
| Profile Fields | Extended (name, phone, avatar, timezone, address, company, preferences) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + TypeScript + TailwindCSS                               │
│  ├── AuthContext (user state, permissions)                      │
│  ├── Protected Routes (role/permission guards)                  │
│  └── Supabase Client (anon key only)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP + JWT
┌─────────────────────▼───────────────────────────────────────────┐
│                         BACKEND                                  │
│  Express + TypeScript                                           │
│  ├── Auth Middleware (JWT verification)                         │
│  ├── RBAC Middleware (role/permission checks)                   │
│  └── Supabase Admin Client (service_role key)                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Service Role
┌─────────────────────▼───────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ├── Auth (users, sessions, email verification)                 │
│  ├── Database (profiles, roles, permissions, properties)        │
│  ├── RLS Policies (row-level security)                         │
│  └── Storage (avatars)                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Overview

```
auth.users (Supabase managed)
    │
    └── public.user_profiles (1:1)
            ├── public.user_roles ──► public.roles
            │                              └── public.role_permissions ──► public.permissions
            ├── public.user_permissions (overrides) ──► public.permissions
            ├── public.user_properties ──► public.properties
            └── public.audit_log
```

### Core Tables

#### 1. `user_profiles` - Extended user data
```sql
- id (UUID, PK, references auth.users)
- email, full_name, phone, avatar_url
- timezone, address fields, company_name
- preferences (JSONB)
- status: 'pending' | 'active' | 'suspended' | 'deactivated'
- email_verified_at, approved_at, approved_by
- last_login_at, last_active_at
```

#### 2. `roles` - Definable roles
```sql
- id (UUID, PK)
- name (unique), display_name, description
- is_system_role (boolean - protects deletion)
- priority (integer - conflict resolution)
```

#### 3. `permissions` - Granular permissions
```sql
- id (UUID, PK)
- resource: 'users' | 'properties' | 'bookings' | etc.
- action: 'create' | 'read' | 'update' | 'delete' | 'manage'
```

#### 4. `user_roles` - User-role assignments
```sql
- user_id, role_id
- property_id (optional - scoped to property)
- assigned_by
```

#### 5. `user_permissions` - Direct permission overrides
```sql
- user_id, permission_id
- override_type: 'grant' | 'deny'
- property_id (optional - scoped)
- expires_at (optional)
```

#### 6. `user_properties` - Property assignments
```sql
- user_id, property_id
- is_primary (boolean)
- assigned_by
```

#### 7. `audit_log` - Immutable action log
```sql
- actor_id, action, entity_type, entity_id
- old_data, new_data (JSONB)
- ip_address, user_agent
```

### Default Roles (Seeded)

| Role | Priority | Description |
|------|----------|-------------|
| `super_admin` | 1000 | Full system access |
| `property_admin` | 500 | Full access to assigned properties |
| `property_manager` | 400 | Manage bookings and operations |
| `front_desk` | 200 | Check-ins, guest inquiries |
| `housekeeping` | 100 | View schedules, update status |
| `readonly` | 50 | View-only access |

### Default Permissions (Seeded)

| Resource | Actions |
|----------|---------|
| users | create, read, update, delete, manage |
| roles | create, read, update, delete, manage |
| properties | create, read, update, delete, manage |
| bookings | create, read, update, delete, manage |
| guests | create, read, update, delete |
| analytics | read |
| reports | create, read |
| settings | read, update |
| audit_logs | read |

---

## Backend Structure

```
backend/src/
├── index.ts                    # Entry point
├── app.ts                      # Express configuration
├── config/
│   ├── supabase.ts            # Admin + anon clients
│   └── env.ts                 # Zod validation
├── routes/
│   ├── auth.routes.ts         # Auth endpoints
│   ├── users.routes.ts        # User CRUD
│   └── roles.routes.ts        # Role management
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   └── roles.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── users.service.ts
│   ├── roles.service.ts
│   └── audit.service.ts
├── middleware/
│   ├── auth.middleware.ts     # JWT verification
│   ├── rbac.middleware.ts     # Role checks
│   ├── permission.middleware.ts
│   ├── validate.middleware.ts # Zod schemas
│   ├── rateLimiter.middleware.ts
│   └── errorHandler.middleware.ts
├── validators/
│   ├── auth.validators.ts
│   ├── user.validators.ts
│   └── role.validators.ts
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   └── api.types.ts
└── utils/
    ├── errors.ts              # AppError class
    ├── response.ts            # API response helpers
    └── logger.ts
```

### API Endpoints

#### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Register (creates pending user) | Public |
| POST | `/login` | Login with email/password | Public |
| POST | `/logout` | Invalidate session | Required |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/forgot-password` | Send reset email | Public |
| POST | `/reset-password` | Reset with token | Public |
| GET | `/verify-email` | Verify email token | Public |
| GET | `/me` | Get current user + permissions | Required |

#### User Routes (`/api/users`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List users (paginated) | users:read |
| GET | `/:id` | Get user details | users:read |
| PATCH | `/:id` | Update user | users:update |
| DELETE | `/:id` | Soft delete | users:delete |
| POST | `/:id/approve` | Approve pending user | users:manage |
| POST | `/:id/roles` | Assign roles | Super Admin |
| POST | `/:id/permissions` | Override permissions | Super Admin |
| POST | `/:id/properties` | Assign to properties | users:manage |

#### Role Routes (`/api/roles`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List all roles | roles:read |
| GET | `/permissions` | List all permissions | roles:read |
| POST | `/` | Create custom role | Super Admin |
| PATCH | `/:id` | Update role | Super Admin |
| DELETE | `/:id` | Delete role | Super Admin |

---

## Frontend Structure

```
frontend/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Providers + Router
├── config/
│   └── supabase.ts            # Anon client only
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   └── api.types.ts
├── context/
│   ├── ThemeContext.tsx       # (exists)
│   └── AuthContext.tsx        # User state + permissions
├── hooks/
│   ├── useAuth.ts
│   └── usePermissions.ts
├── services/
│   ├── auth.service.ts
│   ├── api.service.ts
│   └── user.service.ts
├── components/
│   ├── ui/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Alert/
│   │   ├── Spinner/
│   │   ├── Modal/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   └── DataTable/
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── SignupForm/
│   │   └── ProtectedRoute/
│   └── users/
│       ├── UserList/
│       └── UserForm/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── PendingApprovalPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx
│   └── admin/
│       ├── users/
│       │   ├── UserListPage.tsx
│       │   └── UserDetailPage.tsx
│       ├── approvals/
│       │   └── PendingApprovalsPage.tsx
│       └── roles/
│           └── RoleManagementPage.tsx
└── routes/
    ├── index.tsx              # Router config
    ├── ProtectedRoute.tsx
    ├── AdminRoute.tsx
    └── SuperAdminRoute.tsx
```

### Route Guards

| Guard | Purpose |
|-------|---------|
| `ProtectedRoute` | Requires authentication, redirects to login |
| `AdminRoute` | Requires `admin` or `super_admin` role |
| `SuperAdminRoute` | Requires `super_admin` role only |
| `PublicRoute` | Redirects authenticated users to dashboard |

---

## Implementation Phases

### Phase 1: Database Setup (Supabase)
- [ ] Create migration files in `backend/migrations/`
- [ ] Create all tables with proper relationships
- [ ] Set up RLS policies
- [ ] Create trigger functions (new user, email verification)
- [ ] Seed default permissions and roles
- [ ] Create helper functions (`is_super_admin`, `has_permission`, etc.)

### Phase 2: Backend Foundation
- [ ] Install dependencies: `zod`
- [ ] Create config files (`env.ts`, `supabase.ts`)
- [ ] Create type definitions
- [ ] Create utility files (`errors.ts`, `response.ts`, `logger.ts`)
- [ ] Create validators (Zod schemas)

### Phase 3: Backend Middleware
- [ ] Auth middleware (JWT verification)
- [ ] RBAC middleware (role checks)
- [ ] Permission middleware
- [ ] Validation middleware
- [ ] Rate limiter middleware
- [ ] Error handler middleware
- [ ] Security headers middleware

### Phase 4: Backend Services & Routes
- [ ] Auth service + controller + routes
- [ ] Users service + controller + routes
- [ ] Roles service + controller + routes
- [ ] Audit service
- [ ] Update `app.ts` and `index.ts`

### Phase 5: Frontend Foundation
- [ ] Install dependencies: `react-router-dom`, `@supabase/supabase-js`
- [ ] Create Supabase client config
- [ ] Create type definitions
- [ ] Create `AuthContext` with full state management
- [ ] Create route guards
- [ ] Update `App.tsx` with providers and router

### Phase 6: Frontend UI Components
- [ ] Create `Input`, `Select`, `Checkbox` components
- [ ] Create `Alert`, `Spinner`, `Modal` components
- [ ] Create `Badge`, `Avatar` components
- [ ] Create `DataTable` component
- [ ] Create `AuthLayout` component

### Phase 7: Frontend Auth Pages
- [ ] `LoginPage` with form
- [ ] `SignupPage` with extended profile fields
- [ ] `ForgotPasswordPage`
- [ ] `ResetPasswordPage`
- [ ] `VerifyEmailPage`
- [ ] `PendingApprovalPage`

### Phase 8: Frontend Admin Pages
- [ ] `UserListPage` with filters and pagination
- [ ] `UserDetailPage` with edit form
- [ ] `PendingApprovalsPage`
- [ ] `RoleManagementPage` (Super Admin only)

### Phase 9: Profile & Polish
- [ ] `ProfilePage` with avatar upload
- [ ] Permission-based UI rendering (`usePermissions` hook)
- [ ] Error handling and loading states
- [ ] Toast notifications

---

## Security Measures

| Area | Implementation |
|------|----------------|
| **Authentication** | Supabase Auth with JWT |
| **Authorization** | RLS + Backend middleware |
| **Password Policy** | Min 8 chars, upper, lower, number, special |
| **Rate Limiting** | 5 auth attempts per 15 min |
| **Email Verification** | Required before approval |
| **Session Management** | Auto-refresh, secure storage |
| **Audit Trail** | All sensitive actions logged |
| **Input Validation** | Zod schemas on all endpoints |
| **CORS** | Configured for frontend origin |
| **Security Headers** | XSS, HSTS, CSP, etc. |

---

## Files to Create/Modify

### Backend (New Files)
```
backend/src/config/env.ts
backend/src/config/supabase.ts
backend/src/types/auth.types.ts
backend/src/types/user.types.ts
backend/src/types/api.types.ts
backend/src/utils/errors.ts
backend/src/utils/response.ts
backend/src/utils/logger.ts
backend/src/validators/auth.validators.ts
backend/src/validators/user.validators.ts
backend/src/validators/role.validators.ts
backend/src/middleware/auth.middleware.ts
backend/src/middleware/rbac.middleware.ts
backend/src/middleware/permission.middleware.ts
backend/src/middleware/validate.middleware.ts
backend/src/middleware/rateLimiter.middleware.ts
backend/src/middleware/errorHandler.middleware.ts
backend/src/middleware/securityHeaders.middleware.ts
backend/src/services/auth.service.ts
backend/src/services/users.service.ts
backend/src/services/roles.service.ts
backend/src/services/audit.service.ts
backend/src/controllers/auth.controller.ts
backend/src/controllers/users.controller.ts
backend/src/controllers/roles.controller.ts
backend/src/routes/index.ts
backend/src/routes/auth.routes.ts
backend/src/routes/users.routes.ts
backend/src/routes/roles.routes.ts
backend/src/app.ts
backend/migrations/001_create_auth_schema.sql
backend/migrations/002_create_indexes.sql
backend/migrations/003_create_rls_policies.sql
backend/migrations/004_create_triggers.sql
backend/migrations/005_seed_data.sql
```

### Backend (Modify)
```
backend/src/index.ts
backend/package.json (add zod)
```

### Frontend (New Files)
```
frontend/src/config/supabase.ts
frontend/src/types/auth.types.ts
frontend/src/types/user.types.ts
frontend/src/types/api.types.ts
frontend/src/context/AuthContext.tsx
frontend/src/hooks/useAuth.ts
frontend/src/hooks/usePermissions.ts
frontend/src/services/auth.service.ts
frontend/src/services/api.service.ts
frontend/src/services/user.service.ts
frontend/src/utils/validation.ts
frontend/src/utils/permissions.ts
frontend/src/routes/index.tsx
frontend/src/routes/ProtectedRoute.tsx
frontend/src/routes/AdminRoute.tsx
frontend/src/routes/SuperAdminRoute.tsx
frontend/src/routes/PublicRoute.tsx
frontend/src/components/ui/Input/*
frontend/src/components/ui/Select/*
frontend/src/components/ui/Alert/*
frontend/src/components/ui/Spinner/*
frontend/src/components/ui/Modal/*
frontend/src/components/ui/Badge/*
frontend/src/components/ui/Avatar/*
frontend/src/components/ui/DataTable/*
frontend/src/components/layout/AuthLayout/*
frontend/src/components/auth/LoginForm/*
frontend/src/components/auth/SignupForm/*
frontend/src/components/auth/ForgotPasswordForm/*
frontend/src/components/auth/ResetPasswordForm/*
frontend/src/pages/auth/LoginPage.tsx
frontend/src/pages/auth/SignupPage.tsx
frontend/src/pages/auth/ForgotPasswordPage.tsx
frontend/src/pages/auth/ResetPasswordPage.tsx
frontend/src/pages/auth/VerifyEmailPage.tsx
frontend/src/pages/auth/PendingApprovalPage.tsx
frontend/src/pages/profile/ProfilePage.tsx
frontend/src/pages/admin/users/UserListPage.tsx
frontend/src/pages/admin/users/UserDetailPage.tsx
frontend/src/pages/admin/approvals/PendingApprovalsPage.tsx
frontend/src/pages/admin/roles/RoleManagementPage.tsx
```

### Frontend (Modify)
```
frontend/src/App.tsx
frontend/src/main.tsx
frontend/package.json (add react-router-dom)
```

---

## Dependencies to Install

### Backend
```bash
cd backend && npm install zod
```

### Frontend
```bash
cd frontend && npm install react-router-dom @supabase/supabase-js
```

---

## Notes

1. **Super Admin Bootstrap**: First user must be manually set as `super_admin` in database
2. **Email Templates**: Configure in Supabase Dashboard > Authentication > Email Templates
3. **Redirect URLs**: Configure in Supabase Dashboard > Authentication > URL Configuration
4. **Storage Bucket**: Create `avatars` bucket in Supabase Storage with public access
