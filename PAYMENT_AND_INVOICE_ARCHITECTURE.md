# Payment & Invoice Architecture - Two Separate Systems

## Overview

The Vilo platform has **two completely separate** payment and invoice systems:

1. **SaaS/Platform Level** - Super admin controlled (for subscription payments)
2. **Company/Property Level** - Property owner controlled (for guest booking payments)

---

## 1. SaaS/Platform Level (Super Admin Only)

### Purpose
- Handle subscription payments (users paying the platform)
- Issue invoices for subscription fees
- Platform controls payment methods and invoice branding

### Location in UI
- **Route**: `/admin/billing`
- **Tabs**:
  - Payment Integrations
  - Invoice Settings
  - Subscription Plans
  - Member Types

### Backend Routes

#### Payment Integrations
**File**: `backend/src/routes/payment.routes.ts`
**Middleware**: `requireSuperAdmin()` ✅
**Endpoints**:
- `GET /api/payment-integrations` - List all
- `GET /api/payment-integrations/:provider` - Get single
- `PATCH /api/payment-integrations/:provider` - Update
- `POST /api/payment-integrations/:provider/test` - Test connection

**Database Table**: `payment_integrations` (no company_id - platform-wide)

#### Invoice Settings
**File**: `backend/src/routes/invoice.routes.ts`
**Middleware**: `requireSuperAdmin()` ✅
**Endpoints**:
- `GET /api/invoices/admin/settings` - Get settings
- `PATCH /api/invoices/admin/settings` - Update settings
- `POST /api/invoices/admin/logo` - Upload logo
- `DELETE /api/invoices/admin/logo` - Delete logo

**Database Table**: `invoice_settings` (platform-wide settings)

### What These Control
- **Payment Integrations**:
  - Paystack, PayPal, EFT for subscription checkout
  - Platform webhook URLs
  - Primary payment method for subscriptions

- **Invoice Settings**:
  - Platform company name/logo on subscription invoices
  - Invoice prefix (e.g., "VILO-202601-0001")
  - Platform VAT number
  - Platform bank details
  - Footer text on subscription invoices

### Frontend Components
- `frontend/src/pages/admin/billing/components/PaymentIntegrationsTab.tsx`
- `frontend/src/pages/admin/billing/components/InvoiceSettingsTab.tsx`

### Services
- `frontend/src/services/payment.service.ts`
- `frontend/src/services/invoice.service.ts`

---

## 2. Company/Property Level (Property Owner Controlled)

### Purpose
- Handle guest booking payments (guests paying property owners)
- Issue invoices for booking charges
- Property owners control their own payment methods and branding

### Location in UI
- **Route**: `/manage/settings/payments`
- **Section**: Company Settings → Payment Settings

### Backend Routes

#### Payment Integrations
**File**: `backend/src/routes/company-payment-integration.routes.ts`
**Middleware**: `requireCompanyOwnership` ✅
**Endpoints**:
- `GET /api/company-payment-integrations/:companyId` - List integrations
- `GET /api/company-payment-integrations/:companyId/:provider` - Get single
- `PUT /api/company-payment-integrations/:companyId/:provider` - Create/update
- `PATCH /api/company-payment-integrations/:companyId/:provider/toggle` - Toggle enabled
- `POST /api/company-payment-integrations/:companyId/:provider/set-primary` - Set primary
- `POST /api/company-payment-integrations/:companyId/:provider/test` - Test connection
- `DELETE /api/company-payment-integrations/:companyId/:provider` - Delete

**Database Table**: `company_payment_integrations` (has company_id - per-company)

#### Invoice Settings
*Note: Company-specific invoice settings (for booking invoices) would be separate from platform invoice settings*

### What These Control
- **Payment Integrations**:
  - Paystack, PayPal, EFT for guest bookings
  - Company-specific webhook URLs
  - Primary payment method for their bookings

- **Invoice Settings** (if implemented):
  - Property/company name on guest invoices
  - Company logo on guest invoices
  - Company VAT number
  - Company bank details

### Frontend Components
- `frontend/src/pages/settings/PaymentSettingsPage.tsx`

### Services
- `frontend/src/services/company-payment-integration.service.ts`

---

## Key Differences

| Aspect | SaaS/Platform Level | Company/Property Level |
|--------|---------------------|------------------------|
| **Controlled By** | Super admins only | Property owners/managers |
| **Purpose** | Subscription billing | Guest booking payments |
| **Access Control** | `requireSuperAdmin()` | `requireCompanyOwnership` |
| **Database Scope** | Platform-wide (no company_id) | Per-company (has company_id) |
| **UI Location** | `/admin/billing` | `/manage/settings/payments` |
| **Payments From** | Users → Platform | Guests → Property Owners |
| **Invoices For** | Subscription fees | Booking charges |
| **Webhooks** | Platform URLs | Company-specific URLs |

---

## Payment Flow Examples

### SaaS Level - Subscription Payment
```
User signs up for "Vilo Plus" plan
  ↓
User goes to subscription checkout
  ↓
Payment processed via platform payment integrations (Paystack/PayPal/EFT)
  ↓
Platform receives payment
  ↓
Invoice generated using platform invoice settings
  ↓
User receives invoice with platform branding
```

### Company Level - Guest Booking Payment
```
Guest books a room at "Safari Lodge"
  ↓
Guest goes to booking checkout
  ↓
Payment processed via Safari Lodge's payment integrations
  ↓
Safari Lodge receives payment
  ↓
Invoice generated using Safari Lodge's invoice settings
  ↓
Guest receives invoice with Safari Lodge branding
```

---

## Security & Access Control

### Super Admin Access (Platform Level)
✅ Can configure platform payment integrations
✅ Can configure platform invoice settings
❌ Cannot access individual company payment settings (separation of concerns)

### Property Owner Access (Company Level)
✅ Can configure their own company payment integrations
✅ Can configure their own company invoice settings
❌ Cannot access platform payment settings
❌ Cannot access other companies' settings

---

## Recent Changes (2026-01-19)

### Fixed: Invoice Settings Security
**Problem**: Invoice settings routes were using `requireAdmin()` which allowed both super admins AND property admins to access SaaS platform invoice settings.

**Solution**: Changed to `requireSuperAdmin()` to restrict access to platform admins only.

**Files Changed**:
- `backend/src/routes/invoice.routes.ts`
  - Line 88: `GET /admin/settings` - Changed to `requireSuperAdmin()`
  - Line 98: `PATCH /admin/settings` - Changed to `requireSuperAdmin()`
  - Line 109: `POST /admin/logo` - Changed to `requireSuperAdmin()`
  - Line 120: `DELETE /admin/logo` - Changed to `requireSuperAdmin()`

### Verified: Payment Integrations Security
✅ Payment integration routes already correctly use `requireSuperAdmin()`
✅ No changes needed

---

## Frontend Access Control

Both tabs in `/admin/billing` are protected at the route level and should only be accessible to super admins. If a non-super-admin tries to access, the backend will return 403 Forbidden.

### Payment Integrations Tab
- Component: `PaymentIntegrationsTab.tsx`
- Service: `paymentService.ts`
- All API calls hit super-admin protected routes

### Invoice Settings Tab
- Component: `InvoiceSettingsTab.tsx`
- Service: `invoiceService.ts`
- All API calls hit super-admin protected routes

---

## Database Schema Summary

### Platform-Level Tables
```sql
-- Platform payment configurations
payment_integrations (
  id UUID PRIMARY KEY,
  provider TEXT, -- 'paystack' | 'paypal' | 'eft'
  is_enabled BOOLEAN,
  is_primary BOOLEAN,
  -- No company_id - applies platform-wide
)

-- Platform invoice settings
invoice_settings (
  id UUID PRIMARY KEY,
  company_name TEXT,
  logo_url TEXT,
  invoice_prefix TEXT,
  vat_number TEXT,
  -- No company_id - applies to all subscription invoices
)
```

### Company-Level Tables
```sql
-- Per-company payment configurations
company_payment_integrations (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  provider TEXT, -- 'paystack' | 'paypal' | 'eft'
  is_enabled BOOLEAN,
  is_primary BOOLEAN,
  -- Each company has their own configs
)
```

---

## Testing Checklist

### SaaS/Platform Level
- [ ] Super admin can access `/admin/billing#payment-integrations`
- [ ] Super admin can access `/admin/billing#invoice-settings`
- [ ] Super admin can configure Paystack/PayPal/EFT for subscriptions
- [ ] Super admin can upload platform logo
- [ ] Super admin can set invoice prefix
- [ ] Property admin CANNOT access these settings (should get 403)
- [ ] Regular user CANNOT access these settings (should get 403)

### Company/Property Level
- [ ] Property owner can access `/manage/settings/payments`
- [ ] Property owner can configure their own payment methods
- [ ] Property owner can only see/edit their own company settings
- [ ] Property owner CANNOT see other companies' settings
- [ ] Property owner CANNOT access platform settings

---

## Summary

The architecture is now correctly separated:

✅ **Platform payment/invoice settings** → Super admin only → For subscription billing
✅ **Company payment settings** → Property owners → For guest booking payments

The two systems are completely independent and serve different purposes, ensuring proper separation of concerns and security.
