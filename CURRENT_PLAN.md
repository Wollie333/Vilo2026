# Current Plans - Ready for Implementation

## ✅ COMPLETED FEATURES

### Subscription Manager Enhancement (2026-01-12)
**Status:** 100% Production-Ready and Tested
- ✅ Multi-billing support (monthly + annual + one-off simultaneously)
- ✅ Unlimited resource toggles (checkbox UI storing -1)
- ✅ 131 granular permissions across 8 categories
- ✅ Tabbed UI interface (Basic Info | Pricing | Limits | Permissions)

### Phase 1: Booking Status Management (2026-01-14)
**Status:** 100% Complete - All cron jobs working
- ✅ Automated status transitions (pending → confirmed → checked_in → checked_out)
- ✅ 4 cron jobs running (auto-checkout, no-show detection, failed checkout, EFT verification)

### Phase 2: EFT Payment Flow & Failed Checkout Recovery (2026-01-14)
**Status:** 100% Complete - All 9 tasks done
- ✅ Payment proof upload and verification
- ✅ Guest booking status pages
- ✅ Failed checkout analytics dashboard
- ✅ Automated recovery email campaigns
- ✅ Partial payment support

### PDF Invoice Templates (2026-01-14)
**Status:** 100% Complete - Professional redesign done
- ✅ Corporate design (black, white, gray)
- ✅ FROM/TO sender/receiver structure
- ✅ Credit notes with outstanding balance calculation
- ✅ Bank details section on all documents
- ✅ Full CRUD for credit notes (backend + frontend)
- ✅ Shared PDF component library

---

## Status: IN_PROGRESS - Calendar System Production Upgrade 🚀
## Updated: 2026-01-14 (Current Session)
## Next Action: Phase 1, Step 1 - Update Calendar.types.ts

---

## 🎯 Current Focus: Calendar System Production Upgrade

### Plan Details: See `.claude/plans/calendar-system-upgrade.md`
### Status: Phase 1 of 12 (Type System & Data Models)
### Current Step: 1 of 64

### 💰 Refund Manager System (World-Class)

**Summary:**
- Property owner autonomy for refund management
- Guest self-service cancellation with auto-calculation
- SaaS platform mediation for disputes
- Credit notes, VAT handling, multi-currency
- Financial compliance (7-year retention)
- Better UX than Booking.com
- Escalation framework (guest → owner → SaaS)

**Effort:** Major feature (estimated multiple days)
**Files:** 65+ files (backend + frontend + migrations)

---

## Plan Details

### Plan 1: PDF Invoice Templates

**File:** `C:\Users\Wollie\.claude\plans\mighty-riding-aho.md`
**Size:** 29 KB
**Last Updated:** 2026-01-10

#### What You'll Get:
- ✅ Professional invoice templates (FROM/TO structure)
- ✅ Professional receipt templates
- ✅ Credit note implementation (with outstanding balance)
- ✅ Bank details section on all documents
- ✅ Shared PDF component library (reusable)
- ✅ White-label ready (minimal branding)
- ✅ Accounting compliance (tax breakdown, terms)

#### Implementation Phases:
1. **Phase 1:** Foundation - Shared PDF library (2-3 hours)
2. **Phase 2:** Database migrations (30 minutes)
3. **Phase 3:** Credit note backend (3-4 hours)
4. **Phase 4:** Refactor invoice service (2-3 hours)
5. **Phase 5:** Refactor receipt service (1-2 hours)
6. **Phase 6:** Visual testing script (1 hour)
7. **Phase 7:** Bank details UI (1-2 hours)
8. **Phase 8:** Credit note UI (3-4 hours)
9. **Phase 9:** End-to-end testing (2-3 hours)
10. **Phase 10:** Documentation & deployment (1-2 hours)

#### Key Features:
```
Document Layout:
┌────────────────────────────────────────┐
│ [LOGO]  Company Name        [STATUS]  │
│ Address                     INVOICE   │
│ Email | Phone          INV-202601-0001│
│ VAT: XXX                    Date: ... │
├────────────────────────────────────────┤
│ ┌──────────┐      ┌──────────┐       │
│ │ FROM     │      │ TO       │       │
│ │ Company  │      │ Guest    │       │
│ └──────────┘      └──────────┘       │
├────────────────────────────────────────┤
│ [Line Items Table]                     │
│ [Financial Summary]                    │
│ [Bank Details Section]                 │
├────────────────────────────────────────┤
│         Powered by Vilo                │
└────────────────────────────────────────┘
```

#### Files to Create:
- `backend/src/utils/pdf-templates.ts` - Shared library
- `backend/migrations/044_create_credit_notes_schema.sql`
- `backend/migrations/045_add_bank_details_to_invoice_settings.sql`
- `backend/src/types/credit-note.types.ts`
- `backend/src/services/credit-note.service.ts`
- `backend/src/controllers/credit-note.controller.ts`
- `backend/src/routes/credit-note.routes.ts`
- `backend/src/validators/credit-note.validators.ts`
- Plus 5 more files (tests, scripts, frontend pages)

#### Files to Modify:
- `backend/src/services/invoice.service.ts` (refactor PDF generation)
- `backend/src/services/payment-receipt.service.ts` (refactor PDF generation)
- `backend/src/routes/index.ts` (register routes)
- Plus 3 more files (types exports, billing settings UI)

---

### Plan 2: Refund Manager System

**File:** `C:\Users\Wollie\.claude\plans\quizzical-hopping-harp.md`
**Size:** 78 KB (1,952 lines)
**Last Updated:** 2026-01-10

#### What You'll Get:
- ✅ Property owner autonomy (full refund control)
- ✅ Guest self-service cancellation
- ✅ Policy-based refund calculation
- ✅ Escalation framework (3 levels)
- ✅ Credit note auto-generation
- ✅ Financial compliance (VAT, multi-currency)
- ✅ Fraud prevention
- ✅ Bank verification (OZOW AVS)
- ✅ 7-year data retention
- ✅ World-class UX (better than Booking.com)

#### Key Architecture:
```
Money Flow:
Guest → Property Owner (direct payment)
Property Owner → Vilo (subscription only)
Vilo NEVER touches refund money
```

#### Role Separation (5 Levels):
1. **Guests** - Cancel bookings, request refunds, dispute rejections
2. **Property Owners** - FULL CONTROL over refunds (approve/reject/override)
3. **SaaS Team Members** - READ-ONLY platform monitoring
4. **SaaS Admins** - Mediation role (non-binding recommendations)
5. **SaaS Super Admins** - Flag properties, suspend (extreme cases)

#### Escalation Triggers:
- Guest-initiated: Owner rejected valid refund, no response 7+ days
- Owner-initiated: Complex legal situation, request guidance
- System-initiated: Refund > R50,000, refund rate > 80%

#### Implementation Phases:
1. **Phase 1:** Backend core (migrations + services)
2. **Phase 2:** Property owner UI (refund manager)
3. **Phase 3:** SaaS platform UI (monitoring + escalation)
4. **Phase 4:** Guest UI (my refunds page)
5. **Phase 5:** Testing & polish

#### Files to Create/Modify:
- **Backend:** 14 new files (services, controllers, routes, types)
- **Frontend:** 21 new pages/components (3 separate UIs)
- **Migrations:** 2 new migrations (041-042)
- **Total:** 65+ files

#### Critical Features:
- Policy calculation using Legal Tab (cancellation_policies)
- Outstanding balance tracking
- Refund status banner (prominent on booking detail)
- Real-time updates (30-second polling)
- Credit note auto-generation
- VAT handling (configurable %)
- Multi-currency with exchange rate tracking
- Idempotent refund processing (no double refunds)

#### Test Scenarios (7 workflows):
1. Guest cancels with full refund (30+ days before check-in)
2. Property owner approves refund
3. Property owner processes refund (gateway + credit note)
4. Refund fails (gateway error → retry)
5. Property owner overrides amount (loyalty gesture)
6. Guest views refund status (real-time updates)
7. Guest escalates to Vilo Support (full workflow)

---

## How to Choose

### Choose PDF Invoice Templates if:
- ✅ You want professional-looking documents NOW
- ✅ You need credit notes for accounting
- ✅ You want to remove Vilo branding
- ✅ Smaller, focused feature (2-3 days)
- ✅ Can be implemented independently

### Choose Refund Manager if:
- ✅ You want to enable property owners to manage refunds
- ✅ You need guest self-service cancellations
- ✅ You want world-class refund UX
- ✅ Larger, comprehensive feature (multiple days)
- ✅ High priority for your business model

---

## Tomorrow's Workflow

### To Start PDF Invoice Templates:
Say: **"Let's implement the PDF invoice templates"**

I will:
1. Read the full plan from `mighty-riding-aho.md`
2. Start with Phase 1 (shared PDF library)
3. Track progress with todos
4. Update this CURRENT_PLAN.md with progress

### To Start Refund Manager:
Say: **"Let's implement the refund manager"**

I will:
1. Read the full plan from `quizzical-hopping-harp.md`
2. Start with Phase 1 (backend migrations)
3. Track progress with todos
4. Update this CURRENT_PLAN.md with progress

---

## Both Plans Are Independent

✅ Can be implemented in any order
✅ No dependencies between them
✅ Both are fully planned and ready
✅ Both have comprehensive testing strategies
✅ Both follow CLAUDE.md conventions

---

## Plan Status: BOTH READY FOR IMPLEMENTATION ✅

Choose whichever plan fits your priority for tomorrow!
