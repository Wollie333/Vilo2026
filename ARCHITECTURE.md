# Architecture Overview

## System
- Frontend: React + Tailwind + TypeScript
- Backend API: Express (TypeScript)
- Platform services: Supabase (Auth, DB, Storage)

## Principles
- Multi-tenant by default
- Tenant data isolation
- Frontend = no elevated privileges
- Express = secure boundary
- **Component-first** development
- **Theme-driven** UI consistency

## Responsibilities
Frontend:
- UI presentation
- Auth flows
- Public booking flows
- Client-side validation

Backend:
- Webhooks
- Admin impersonation
- Membership logic
- Server-side validation
- Privileged operations

---

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── components/           # Reusable UI components
│   ├── ui/              # Base primitives (Button, Input, Card)
│   ├── forms/           # Form components (FormField, Select)
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── features/        # Feature-specific (BookingCard)
├── pages/               # Route-level components
├── hooks/               # Custom React hooks
├── theme/               # Theming system
│   ├── colors.ts        # Color palette
│   └── index.ts         # Exports
├── utils/               # Utility functions
├── types/               # Shared TypeScript types
├── services/            # API service layer
└── context/             # React context providers
```

### Component Categories

| Category | Location | Purpose | Example |
|----------|----------|---------|---------|
| UI | `components/ui/` | Generic, reusable primitives | Button, Card, Modal |
| Forms | `components/forms/` | Form-specific inputs | FormField, Select |
| Layout | `components/layout/` | Page structure | Sidebar, Header |
| Features | `components/features/` | Business-logic components | BookingCard |

### Component Requirements
Every component MUST have:
1. TypeScript interface (exported)
2. Folder structure: `ComponentName/index.ts`, `ComponentName.tsx`, `ComponentName.types.ts`
3. Theme-compliant colors only
4. Default props for optionals
5. Accessibility attributes

### State Management Strategy
- **Local state**: `useState` for component-level
- **Complex state**: `useReducer` for multi-field forms
- **Shared state**: React Context for theme, auth, toast
- **Server state**: React Query (future) for API data

### Styling Strategy
- **Tailwind CSS** for all styling
- **No inline styles** or CSS modules
- **Theme colors** via Tailwind config
- **Utility-first** approach
- **Component extraction** for repeated patterns

---

## Backend Architecture

### Directory Structure
```
backend/src/
├── routes/              # Express route handlers
├── controllers/         # Request handlers
├── services/            # Business logic
├── middleware/          # Express middleware
├── db/                  # Database setup & SQL files
├── types/               # TypeScript types
└── utils/               # Utilities
```

### API Design
- RESTful endpoints
- Consistent error responses
- Input validation
- Auth middleware on protected routes

---

## Data Flow

```
User Action → React Component → Service Layer → Express API → Supabase
                    ↓
              Update UI State
```

### Frontend-Backend Boundary
- Frontend: Uses anon key only
- Backend: Uses service role key
- Privileged operations route through Express
