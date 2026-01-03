# Vilo

A modern vacation rental booking management platform built with React, Express, TypeScript, and Supabase.

## Overview

Vilo is an enterprise-grade property management system designed for vacation rental businesses. It provides comprehensive tools for property management, booking administration, user management, and analytics with a focus on security and role-based access control.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **TailwindCSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **Supabase JS** for auth and data

### Backend
- **Express.js** with TypeScript
- **Supabase** for PostgreSQL database
- **Zod** for input validation
- **Helmet** for security headers

### Database & Services
- **Supabase PostgreSQL** with Row-Level Security
- **Supabase Auth** for authentication
- **Supabase Storage** for file uploads

## Features

### Authentication & Authorization
- Email/password authentication with verification
- Role-Based Access Control (RBAC) with 6 predefined roles
- Granular permission system with 30+ permissions
- Admin approval workflow for new signups
- Session management with secure tokens
- Password reset via email

### User Management
- Complete user CRUD operations
- Profile management with avatar uploads
- User status tracking (pending, active, suspended, deactivated)
- Activity history and audit logging
- Role and permission assignment

### Role & Permission System
| Role | Description |
|------|-------------|
| Super Admin | Full system access |
| Property Admin | Full access to assigned properties |
| Property Manager | Booking & day-to-day operations |
| Front Desk | Check-ins, check-outs, guest inquiries |
| Housekeeping | Schedule viewing & room status |
| Read Only | View-only access |

### Admin Dashboard
- User list and management
- Pending approval queue
- Role management interface
- Audit log viewer
- Design system documentation

## Project Structure

```
Vilo/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth, RBAC, validation
│   │   ├── validators/      # Zod schemas
│   │   ├── types/           # TypeScript definitions
│   │   └── config/          # Configuration
│   └── migrations/          # SQL migrations
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route components
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Base primitives
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components
│   │   │   └── features/    # Business components
│   │   ├── services/        # API service layer
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── theme/           # Theming system
│   │   └── types/           # TypeScript interfaces
│   └── public/
│
└── package.json             # Root monorepo config
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Vilo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create `backend/.env`:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Run database migrations in Supabase SQL Editor (in order):
```
backend/migrations/001_create_auth_schema.sql
backend/migrations/002_create_indexes.sql
backend/migrations/003_create_rls_policies.sql
backend/migrations/004_create_triggers.sql
backend/migrations/005_seed_data.sql
backend/migrations/006_helper_functions.sql
backend/migrations/007_create_avatar_storage.sql
backend/migrations/008_add_business_fields.sql
```

5. Start development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

## Available Scripts

### Root (Monorepo)
```bash
npm run dev          # Run both frontend and backend
npm run build        # Build both packages
npm run install:all  # Install all dependencies
```

### Backend
```bash
npm run dev -w backend    # Start dev server (port 3001)
npm run build -w backend  # Compile TypeScript
```

### Frontend
```bash
npm run dev -w frontend   # Start Vite dev server (port 5173)
npm run build -w frontend # Production build
npm run lint -w frontend  # Run ESLint
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Complete password reset |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user details |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/users/:id/approve` | Approve pending user |
| POST | `/api/users/:id/suspend` | Suspend user |
| POST | `/api/users/:id/reactivate` | Reactivate user |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | List roles |
| POST | `/api/roles` | Create role |
| GET | `/api/roles/:id` | Get role details |
| PATCH | `/api/roles/:id` | Update role |
| DELETE | `/api/roles/:id` | Delete role |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit` | List audit logs |

## Security

- JWT-based authentication via Supabase
- HTTP security headers with Helmet
- CORS policy with domain whitelist
- Input validation with Zod schemas
- Role-based access control middleware
- Row-level security on database tables
- Immutable audit logging
- Email verification required
- Multi-tenancy isolation via properties

## License

Private - All rights reserved
