# API Route Guide - Vilo Platform

## Overview

Vilo uses **feature-based routing** where routes are organized by business resources (invoices, properties, bookings) rather than by user type. Access control is enforced via middleware, not URL structure.

**Base URL**: `http://localhost:3000/api`

---

## Route Categories

### 🌐 Public Routes (No Authentication Required)

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/signup` | POST | User registration |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/discovery/*` | GET | Browse properties (guest browsing) |
| `/booking-wizard/*` | GET/POST | Guest booking flow |
| `/webhooks/*` | POST | Payment provider webhooks |

---

### 👤 Guest Routes (Authenticated - Any User Can Access)

**Guest = User who books properties but doesn't own any**

| Route | Method | Description | Middleware |
|-------|--------|-------------|------------|
| `/invoices/booking/received` | GET | Get invoices for bookings I made as guest | `authenticate` |
| `/bookings/my-bookings` | GET | Get my bookings as guest | `authenticate` |
| `/reviews/my-reviews` | GET | Get reviews I wrote | `authenticate` |
| `/reviews/` | POST | Submit a review | `authenticate` |

---

### 🏠 Property Owner Routes (Authenticated - Property Owners)

**Property Owner = User who owns properties and manages bookings**

| Route | Method | Description | Middleware |
|-------|--------|-------------|------------|
| `/properties/` | GET | List my properties | `authenticate` |
| `/properties/` | POST | Create new property | `authenticate` |
| `/properties/:id` | GET/PATCH/DELETE | Manage specific property | `authenticate` |
| `/rooms/` | GET | List rooms for my properties | `authenticate` |
| `/rooms/` | POST | Create new room | `authenticate` |
| `/bookings/` | GET | List bookings for my properties | `authenticate` |
| `/invoices/booking/issued` | GET | Get invoices I issued to guests | `authenticate` |
| `/companies/:id` | PATCH | Update my company settings | `authenticate` |
| `/analytics/` | GET | View property analytics | `authenticate` |

---

### 💳 Subscription User Routes (Authenticated - Paying Users)

**Subscription User = Any user with an active Vilo subscription**

| Route | Method | Description | Middleware |
|-------|--------|-------------|------------|
| `/invoices/subscription` | GET | Get my subscription invoices from Vilo | `authenticate` |
| `/billing/subscription` | GET | View my subscription details | `authenticate` |
| `/billing/payment-methods` | GET/POST | Manage payment methods | `authenticate` |
| `/users/profile` | GET/PATCH | View/update my profile | `authenticate` |

---

### 👨‍💼 Admin Routes (Admin or Super Admin Only)

**Admin = Platform administrators who manage users and content**

| Route | Method | Description | Middleware |
|-------|--------|-------------|------------|
| `/admin/users/` | GET | List all users | `authenticate` + `requireAdmin()` |
| `/admin/users/` | POST | Create new user | `authenticate` + `requireAdmin()` |
| `/admin/users/:id` | GET/PATCH/DELETE | Manage user | `authenticate` + `requireAdmin()` |
| `/invoices/admin/list` | GET | List all invoices | `authenticate` + `requireAdmin()` |
| `/invoices/admin/:id/void` | POST | Void an invoice | `authenticate` + `requireAdmin()` |
| `/invoices/admin/bookings/:id/generate` | POST | Manually generate booking invoice | `authenticate` + `requireAdmin()` |
| `/bookings/admin/list` | GET | List all bookings | `authenticate` + `requireAdmin()` |
| `/reviews/admin/list` | GET | List all reviews | `authenticate` + `requireAdmin()` |
| `/analytics/admin/platform` | GET | Platform-wide analytics | `authenticate` + `requireAdmin()` |

---

### 👑 Super Admin Routes (Super Admin Only)

**Super Admin = Highest privilege level - manages platform configuration**

| Route | Method | Description | Middleware |
|-------|--------|-------------|------------|
| `/admin/billing/settings` | GET/PATCH | Manage SaaS billing configuration | `authenticate` + `requireSuperAdmin()` |
| `/admin/billing/plans` | GET/POST | Manage subscription plans | `authenticate` + `requireSuperAdmin()` |
| `/invoices/admin/settings` | GET/PATCH | Manage platform invoice settings | `authenticate` + `requireSuperAdmin()` |
| `/invoices/admin/logo` | POST/DELETE | Manage platform invoice logo | `authenticate` + `requireSuperAdmin()` |

---

## Invoice Routes Breakdown

**Vilo has TWO separate invoice systems:**

### 1. SaaS-to-User Invoices (Vilo bills subscription users)

| Route | Method | Who Can Access | Description |
|-------|--------|----------------|-------------|
| `/invoices/subscription` | GET | Subscription users | My subscription invoices from Vilo |
| `/admin/invoices/settings` | GET/PATCH | Super Admin | Configure platform invoice settings |
| `/admin/invoices/logo` | POST/DELETE | Super Admin | Manage platform invoice logo |

**Settings Location**: `http://localhost:5173/admin/billing#invoice-settings`
**Database**: `invoice_settings` table where `company_id = NULL`

---

### 2. User-to-Guest Invoices (Property owners bill guests)

| Route | Method | Who Can Access | Description |
|-------|--------|----------------|-------------|
| `/invoices/booking/issued` | GET | Property owners | Invoices I issued to guests |
| `/invoices/booking/received` | GET | Guests | Invoices I received from property owners |

**Settings Location**: `http://localhost:5173/manage/companies/{id}#document-settings`
**Database**: `invoice_settings` table where `company_id = <company_uuid>`

---

## Authorization Patterns

### Pattern 1: Public Access
```typescript
// No middleware - anyone can access
router.get('/discovery/properties', propertyController.list);
```

### Pattern 2: Authenticated Users Only
```typescript
// Must be logged in
router.get('/bookings/my-bookings', authenticate, bookingController.getMyBookings);
```

### Pattern 3: Role-Based Access
```typescript
// Must be admin
router.get('/admin/users', authenticate, requireAdmin(), userController.list);

// Must be super admin
router.patch('/admin/billing/settings', authenticate, requireSuperAdmin(), billingController.update);
```

### Pattern 4: Permission-Based Access
```typescript
// Must have specific permission
router.post('/properties', authenticate, requirePermission('properties.create'), propertyController.create);
```

### Pattern 5: Resource Ownership Check
```typescript
// Check ownership in controller
export const updateProperty = async (req, res) => {
  const property = await getProperty(req.params.id);

  // Only owner or admin can update
  if (property.owner_id !== req.user.id && !req.user.is_admin) {
    throw new ForbiddenError('Not authorized');
  }

  // ... update logic
};
```

---

## Common Patterns

### 1. List My Resources
```typescript
GET /properties/          // My properties
GET /bookings/my-bookings // My bookings
GET /reviews/my-reviews   // My reviews
```

### 2. Admin List All Resources
```typescript
GET /admin/users/         // All users
GET /invoices/admin/list  // All invoices
GET /bookings/admin/list  // All bookings
```

### 3. Type-Specific Endpoints
```typescript
GET /invoices/subscription      // Subscription invoices only
GET /invoices/booking/issued    // Booking invoices (issuer view)
GET /invoices/booking/received  // Booking invoices (recipient view)
```

---

## Quick Reference by User Type

### "I'm a guest booking properties"
```
POST   /auth/signup
GET    /discovery/properties
POST   /booking-wizard/book
GET    /bookings/my-bookings
GET    /invoices/booking/received
POST   /reviews/
```

### "I'm a property owner"
```
POST   /auth/signup
POST   /properties/
POST   /rooms/
GET    /bookings/
GET    /invoices/booking/issued
GET    /analytics/
PATCH  /companies/:id
```

### "I'm a subscription user (paying Vilo)"
```
GET    /invoices/subscription
GET    /billing/subscription
POST   /billing/payment-methods
```

### "I'm an admin"
```
GET    /admin/users/
POST   /admin/users/
GET    /invoices/admin/list
POST   /invoices/admin/:id/void
GET    /analytics/admin/platform
```

### "I'm a super admin"
```
PATCH  /admin/billing/settings
GET    /admin/invoices/settings
POST   /admin/invoices/logo
```

---

## Frontend Route Mapping

### Admin Pages
- `/admin/billing` → Uses `/admin/billing/*` API routes
- `/admin/users` → Uses `/admin/users/*` API routes

### Property Owner Pages
- `/properties` → Uses `/properties/*` API routes
- `/bookings` → Uses `/bookings/*` API routes
- `/manage/companies/:id` → Uses `/companies/:id` API routes

### User Pages (Billing)
- `/profile/billing` → Uses `/billing/*` and `/invoices/subscription` API routes

### Guest Pages
- `/discovery` → Uses `/discovery/*` API routes
- `/book/:id` → Uses `/booking-wizard/*` API routes
- `/my-bookings` → Uses `/bookings/my-bookings` and `/invoices/booking/received` API routes

---

## Adding New Routes

### For New Feature (e.g., "Payment Schedules")

1. **Create route file**: `backend/src/routes/payment-schedule.routes.ts`
2. **Define routes**:
   ```typescript
   router.get('/', authenticate, controller.list);
   router.post('/', authenticate, controller.create);
   router.get('/admin/list', authenticate, requireAdmin(), controller.adminList);
   ```
3. **Register in index**: `router.use('/payment-schedules', paymentScheduleRoutes);`

### For Admin-Only Feature

1. **Create under /admin**: `backend/src/routes/admin-feature.routes.ts`
2. **Register with middleware**:
   ```typescript
   router.use('/admin/feature', authenticate, requireAdmin(), adminFeatureRoutes);
   ```

---

## Testing Routes

### Using curl

```bash
# Public route
curl http://localhost:3000/api/discovery/properties

# Authenticated route
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/properties

# Admin route
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/admin/users
```

### Using Frontend

```typescript
// Uses api.service.ts which automatically adds auth token
import { api } from '@/services/api.service';

// Authenticated request
const properties = await api.get('/properties');

// Admin request
const users = await api.get('/admin/users');
```

---

## Security Notes

⚠️ **URL structure does NOT enforce security** - middleware does.

❌ **Wrong Assumption**:
```
"Routes under /admin/ are automatically protected"
```

✅ **Correct Understanding**:
```
"Routes are protected by requireAdmin() middleware,
 /admin/ prefix is just organizational"
```

**Always check middleware stack:**
```typescript
// Unprotected (wrong)
router.get('/admin/users', controller.list);

// Protected (correct)
router.get('/admin/users', authenticate, requireAdmin(), controller.list);
```

---

## Troubleshooting

### Issue: "403 Forbidden"
- Check if user has required role (`is_admin`, `is_super_admin`)
- Check if route has correct middleware
- Check if user owns the resource (for resource ownership checks)

### Issue: "401 Unauthorized"
- Check if `Authorization: Bearer <token>` header is present
- Check if token is valid (not expired)
- Check if `authenticate` middleware is on the route

### Issue: "404 Not Found"
- Check route is registered in `backend/src/routes/index.ts`
- Check route path matches exactly (case-sensitive)
- Check if route is under correct prefix

---

## Related Documentation

- **Implementation Summary**: `INVOICE_SYSTEM_IMPLEMENTATION.md`
- **Routing Recommendation**: `ROUTING_STRUCTURE_RECOMMENDATION.md`
- **Payment Architecture**: `PAYMENT_AND_INVOICE_ARCHITECTURE.md`
- **API Controllers**: `backend/src/controllers/`
- **Middleware**: `backend/src/middleware/`
