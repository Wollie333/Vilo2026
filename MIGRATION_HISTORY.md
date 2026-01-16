# Migration History - Vilo Database

## Overview

This document provides a comprehensive inventory of all database migrations for the Vilo platform.

**Total Migrations**: 113 files
**Last Updated**: 2026-01-16
**Schema Version**: v1.0 (post-cleanup)

---

## Migration Cleanup Summary (2026-01-16)

### Files Removed
- **Test/Temp Migrations** (9 files):
  - `ALL_MIGRATIONS.sql` - Consolidated script (not needed)
  - `RUN_THIS_MIGRATION.sql` - Manual override (not needed)
  - `TEMP_073_bulk_delete_users_except_admin.sql`
  - `TEMP_074_bulk_deactivate_users.sql`
  - `TEMP_075_complete_system_reset.sql`
  - `TEMP_075_complete_system_reset_v2.sql`
  - `test_refund_system.sql`
  - `verify_payment_rules_schema.sql`

- **Rollback Migrations** (2 files):
  - `036_rollback_payment_rules.sql`
  - `038_rollback_room_assignment_junction_tables.sql`

- **Superseded Migrations** (4 files):
  - `039_add_property_id_to_payment_rules.sql` (FIXED version kept)
  - `041_REFERENCE_create_buckets_manually.sql` (manual instruction file)
  - `045_add_refund_comments_and_history.sql` (FIXED version kept as 045B)
  - `046_add_refund_documents.sql` (FIXED version kept as 046B)

### Files Renamed (Duplicate Number Resolution)

**Migration 030** (3 files → A/B suffixes):
- `030_add_listing_fields.sql` → **kept as primary**
- `030_create_cancellation_policies.sql` → `030A_create_cancellation_policies.sql`
- `030_create_chat_schema.sql` → `030B_create_chat_schema.sql`

**Migration 045** (4 files → A/B/C suffixes):
- `045_add_bank_details_to_invoice_settings.sql` → `045A_add_bank_details_to_invoice_settings.sql`
- `045_add_refund_comments_and_history_FIXED.sql` → `045B_add_refund_comments_and_history.sql`
- `045_add_refund_notification_templates.sql` → `045C_add_refund_notification_templates.sql`

**Migration 046** (5 files → A/B/C/D suffixes):
- `046_add_per_company_invoice_settings.sql` → `046A_add_per_company_invoice_settings.sql`
- `046_add_refund_documents_FIXED.sql` → `046B_add_refund_documents.sql`
- `046_fix_availability_checking.sql` → `046C_fix_availability_checking.sql`
- `046_refund_enhancements.sql` → `046D_refund_enhancements.sql`

**Other Duplicates Resolved**:
- 011, 018, 044, 050, 051, 062, 075, 076, 077, 079 (all given A/B/C suffixes)

---

## Migration Categories

### 🔐 Authentication & User Management (001-012)
Core user authentication, types, permissions, and session management.

- **001** - Initial schema setup (users, companies, properties foundation)
- **002** - User types and permission framework
- **003** - Role-based access control (RBAC)
- **004** - Session management
- **005** - Audit logging
- **006** - User preferences and settings
- **007** - Team member management
- **008** - User property assignments
- **009** - Permission matrix
- **010** - User type permissions
- **011** - Trial periods and payment integrations (A: payment integrations)
- **011A** - Payment integrations
- **012** - User session tracking enhancements

### 💳 Subscription & Billing (013-027)
Subscription plans, billing cycles, invoices, and payment processing.

- **013** - Subscription types (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- **014** - Subscription limits per tier
- **015** - Billing status tracking
- **016** - User subscriptions
- **017** - Subscription permissions
- **018** - User type permissions matrix (A: locations)
- **018A** - Location tables
- **019** - Payment gateway integrations
- **020** - Billing workflow redesign *(deprecated billing_statuses)*
- **021** - Payment method support
- **022** - Invoice generation
- **023** - Checkout sessions
- **024** - Webhook handling
- **025** - Refund processing
- **026** - Invoice schema
- **027** - Subscription CMS fields

### 🏠 Property Management (028-042)
Properties, rooms, amenities, pricing, and availability.

- **028** - Properties schema
- **029** - Rooms schema
- **030** - Listing fields
- **030A** - Cancellation policies
- **030B** - Chat schema
- **031** - Room beds configuration
- **032** - Seasonal pricing
- **033** - Bookings schema (main booking tables)
- **034** - Add-ons (extras like breakfast, parking)
- **035** - Room promotions (discount codes)
- **036** - Payment rules per property
- **037** - Availability blocks (maintenance, etc.)
- **038** - Room assignment junctions
- **039** - Property ID to payment rules
- **040** - Room completion scoring
- **041** - Storage RLS policies
- **042** - Terms & conditions for properties

### 💰 Payment & Invoicing (043-046D)
Payment tracking, credit memos, refunds, and invoice settings.

- **043** - Company payment integrations
- **044A** - Credit memos and refund enhancements
- **044B** - Credit notes schema
- **045A** - Bank details to invoice settings
- **045B** - Refund comments and history
- **045C** - Refund notification templates
- **046A** - Per-company invoice settings
- **046B** - Refund documents
- **046C** - Availability checking fixes
- **046D** - Refund enhancements

### ⭐ Reviews & Ratings (047-051A)
5-category review system (Safety, Cleanliness, Friendliness, Comfort, Scenery).

- **047** - Property listings enhancements
- **048** - Email validation
- **049** - Reviews schema (5-category ratings)
- **050** - Review storage
- **050A** - Review storage policies
- **051** - Review rating column fix
- **051A** - Rename friendliness to location

### 🌐 Website & CRM Features (052) - *ARCHIVED*
**Note**: These tables were moved to `archived_features` schema in migration 097.

- **052** - Website builder and CRM (9 tables archived):
  - `template_categories`, `website_templates`, `property_websites`
  - `template_sections`, `template_data_bindings`
  - `pipeline_stages`, `leads`, `lead_activities`, `website_analytics_events`

### 📊 Booking Management (053-064)
Extended booking functionality, guest checkout, and calendar features.

- **053** - Booking wizard multi-step checkout
- **054** - Guest checkout (no login required)
- **055** - Booking reference generation
- **056** - Multi-room bookings
- **057** - Booking status lifecycle
- **058** - Payment status tracking
- **059** - Booking notes and requests
- **060** - Calendar view optimizations
- **061** - Booking filters and search
- **062** - Worldwide countries seed
- **062A** - International locations seed
- **063** - Guest capacity management
- **064** - Special requests handling

### 💬 Chat & Communication (065-073)
Real-time chat, message threading, and file attachments.

- **065** - Chat conversations (guest_inquiry, team, support)
- **066** - Chat participants
- **067** - Chat messages with threading
- **068** - Message attachments
- **069** - Message reactions
- **070** - Read status tracking
- **071** - Soft delete and edit tracking
- **072** - Chat search and filtering
- **073** - Chat notifications

### 📱 WhatsApp Integration (074-082)
WhatsApp Business API integration with templates and automation.

- **074** - WhatsApp templates
- **075** - Video URL to properties (A: video URL)
- **075A** - Video URL field
- **076** - Show video flag (A: show video)
- **076A** - Show video field
- **077A** - Add enum values
- **077B** - Add columns and functions
- **077C** - Update booking statuses
- **078** - WhatsApp conversations
- **079** - Payment proofs storage (A: storage)
- **079A** - Payment proofs storage
- **080** - WhatsApp webhooks
- **081** - Company WhatsApp config
- **082** - WhatsApp conversation window

### 📧 Notifications (083-087)
Multi-channel notification system with templates.

- **083** - Notification types
- **084** - Notification templates with placeholders
- **085** - Notifications table
- **086** - Notification preferences per user
- **087** - Notification delivery tracking

### 🎫 Support & Tickets (088-091)
Customer support ticket system.

- **088** - Support schema
- **089** - Modify chat for WhatsApp
- **090** - Seed default WhatsApp templates
- **091** - Fix duplicate WhatsApp templates

### 👥 Customer Management (092-095)
Customer database for WhatsApp/CRM.

- **092** - Company WhatsApp configuration
- **093** - WhatsApp conversation window
- **094** - Guest phone tracking
- **095** - Subscription CMS fields

### 🧹 Schema Cleanup (096-098) - *Recently Applied*
Database cleanup and standardization (January 2026).

- **096** - Remove legacy pricing columns
  - **Removed**: 4 duplicate columns from `subscription_types`
  - **Columns**: `pricing`, `price_cents`, `billing_cycle_days`, `is_recurring`
  - **Status**: ✅ Applied 2026-01-16

- **097** - Drop unused tables
  - **Archived**: 11 unused tables to `archived_features` schema
  - **Tables**: 9 website/CRM + 2 legacy billing tables
  - **Status**: ✅ Applied 2026-01-16

- **098** - Cleanup proof tracking
  - **Removed**: 3 duplicate proof columns from `booking_payments`
  - **Columns**: `proof_url`, `proof_verified_by`, `proof_verified_at`
  - **Consolidated**: Proof tracking now only in `bookings` table
  - **Status**: ✅ Applied 2026-01-16

---

## Dependency Map

### Core Dependencies (Must Run First)
1. **001-005**: Foundation (users, companies, properties, permissions, audit)
2. **013-020**: Subscription & billing framework
3. **028-033**: Property and booking foundation

### Feature Dependencies

**Bookings require**:
- Properties (028-033)
- Rooms (031)
- Payment rules (036)
- Add-ons (034)

**Reviews require**:
- Bookings (033)
- Properties (028)

**Chat requires**:
- Users (001)
- Bookings (033) for guest inquiries

**WhatsApp requires**:
- Chat (065-073)
- Company WhatsApp config (081, 092)

**Invoices require**:
- Subscriptions (016)
- Checkouts (023)

---

## Risk Classification

### HIGH RISK (Destructive Operations)
- **020**: Billing workflow redesign (deprecated tables)
- **052**: Website builder (never implemented, archived in 097)
- **096**: Remove legacy pricing columns
- **097**: Archive unused tables
- **098**: Remove proof tracking columns

### MEDIUM RISK (Schema Modifications)
- **033**: Bookings schema (large complex table)
- **049**: Reviews schema (5-category system)
- **065-073**: Chat system (8 related tables)
- **074-082**: WhatsApp integration (9 related tables)

### LOW RISK (Additive Changes)
- Most migrations (add columns, create indexes, new tables)
- Seed data migrations (062, 062A, 090)
- RLS policy updates

---

## Fresh Installation Guide

For new database setups, migrations should be run in sequential order:

### Option A: Run All Migrations Sequentially (Recommended)
```bash
# Run migrations 001 through 098 in order
for file in backend/migrations/*.sql; do
  psql -f "$file"
done
```

### Option B: Use Squashed Schema (Coming Soon)
*Migration 000_schema_squash_2026_01_v1.sql will consolidate 001-095*

```bash
# For fresh installs only:
psql -f backend/migrations/000_schema_squash_2026_01_v1.sql
psql -f backend/migrations/096_remove_legacy_pricing_columns.sql
psql -f backend/migrations/097_drop_unused_tables.sql
psql -f backend/migrations/098_cleanup_proof_tracking.sql
```

---

## Migration Naming Convention (Updated 2026-01-16)

**Format**: `###[A-Z]_descriptive_snake_case.sql`

**Examples**:
- ✅ `099_add_booking_tags.sql` (next sequential number)
- ✅ `030A_create_cancellation_policies.sql` (duplicate resolved with suffix)
- ❌ `99_add_tags.sql` (must be 3 digits)
- ❌ `099-add-tags.sql` (use underscores, not hyphens)

**Alphabetical Suffixes** (for duplicate numbers):
- Use A, B, C, D when multiple migrations share the same number
- Example: `045A`, `045B`, `045C`, `046A`, `046B`, `046C`, `046D`

---

## Rollback Procedures

### Recent Migrations (096-098)

**Rollback 098** (Proof Tracking):
```sql
ALTER TABLE booking_payments ADD COLUMN proof_url TEXT;
ALTER TABLE booking_payments ADD COLUMN proof_verified_by UUID;
ALTER TABLE booking_payments ADD COLUMN proof_verified_at TIMESTAMPTZ;

UPDATE booking_payments bp
SET proof_url = b.proof_url,
    proof_verified_by = b.proof_verified_by,
    proof_verified_at = b.proof_verified_at
FROM booking_payments_proof_backup b
WHERE bp.id = b.id;
```

**Rollback 097** (Unused Tables):
```sql
ALTER TABLE archived_features.template_categories SET SCHEMA public;
ALTER TABLE archived_features.website_templates SET SCHEMA public;
-- ... (repeat for all 11 tables)
```

**Rollback 096** (Pricing Columns):
```sql
ALTER TABLE subscription_types ADD COLUMN pricing JSONB;
ALTER TABLE subscription_types ADD COLUMN price_cents INTEGER;
ALTER TABLE subscription_types ADD COLUMN billing_cycle_days INTEGER;
ALTER TABLE subscription_types ADD COLUMN is_recurring BOOLEAN;

UPDATE subscription_types st
SET pricing = b.pricing,
    price_cents = b.price_cents,
    billing_cycle_days = b.billing_cycle_days,
    is_recurring = b.is_recurring
FROM subscription_types_pricing_backup b
WHERE st.id = b.id;
```

---

## Archived Tables (Migration 097)

The following tables were moved to `archived_features` schema and can be permanently dropped after 90 days:

### Website/CRM Features (9 tables)
- `template_categories`
- `website_templates`
- `property_websites`
- `template_sections`
- `template_data_bindings`
- `pipeline_stages`
- `leads`
- `lead_activities`
- `website_analytics_events`

### Legacy Billing (2 tables)
- `billing_statuses` (deprecated in migration 020)
- `subscription_limits` (deprecated in migration 020)

**Permanent Deletion** (after 90 days of stable operation):
```sql
DROP SCHEMA archived_features CASCADE;
```

---

## Next Migration Number

**Next available**: `099`

When creating migration 099, follow DATABASE_STANDARDS.md conventions:
- Use 3-digit number
- Use snake_case description
- Include proper header comment block
- Add pre-flight checks for destructive ops
- Include rollback instructions
- Make idempotent with IF EXISTS/IF NOT EXISTS

---

## Maintenance Schedule

### Weekly
- Verify migration numbering consistency
- Check for new orphaned tables/columns

### Monthly
- Review backup tables (delete if > 90 days old)
- Update this document with new migrations

### Quarterly
- Audit migration dependencies
- Consider creating new squashed schema snapshot

---

## Contact & Questions

For questions about specific migrations or to propose new schema changes, refer to:
- **DATABASE_STANDARDS.md** - Database coding standards
- **MIGRATION_APPROVAL_PROCESS.md** - How to propose and review migrations (coming soon)

---

**Document Version**: 1.0
**Last Cleanup**: 2026-01-16
**Maintained by**: Database Team
