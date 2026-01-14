# Refund Management System - Implementation Guide

## Overview

The Vilo refund management system provides a complete end-to-end solution for handling refund requests from guests, including admin approval workflow, payment gateway integration, notification system, and document management.

**Status**: ✅ FULLY IMPLEMENTED AND TESTED

**Last Updated**: January 14, 2026

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Notification System](#notification-system)
5. [Payment Gateway Integration](#payment-gateway-integration)
6. [Security & Authorization](#security--authorization)
7. [Frontend Components](#frontend-components)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Overview

The refund system follows a state machine pattern with the following lifecycle:

```
requested → approved → processing → completed
     ↓          ↓
  cancelled  rejected
```

### Key Components

1. **Backend Service** (`backend/src/services/refund.service.ts`)
   - CRUD operations for refund requests
   - Approval/rejection workflow
   - Payment gateway integration
   - Notification triggers
   - Comment and document management

2. **Database Tables**
   - `refund_requests` - Main refund request records
   - `refund_comments` - Two-way communication (guest ↔ admin)
   - `refund_status_history` - Audit trail of status changes
   - `refund_documents` - Supporting documents (receipts, proof)

3. **Frontend Components** (`frontend/src/components/features/Refund/`)
   - `RefundApprovalForm` - Admin approval/rejection UI
   - `RefundProcessingPanel` - Payment method breakdown
   - `RefundCommentThread` - Two-way messaging
   - `DocumentList` - Document upload and verification

4. **Payment Gateway Integration**
   - Paystack refunds (for card/bank_transfer)
   - PayPal refunds (for PayPal payments)
   - Manual refund tracking (for EFT/cash)

5. **Notification System**
   - 12 lifecycle notification templates
   - Email delivery via notification service
   - User preference management

---

## Database Schema

### Tables Created

#### 1. refund_requests (Migration 044)

Main table storing refund request data.

**Key Fields:**
- `id` (UUID, PK)
- `booking_id` (UUID, FK → bookings)
- `requested_by` (UUID, FK → users)
- `status` (ENUM: requested, approved, rejected, processing, completed, cancelled, failed)
- `requested_amount` (DECIMAL)
- `approved_amount` (DECIMAL, nullable)
- `reason` (TEXT) - Guest's reason for refund
- `reviewed_by` (UUID, FK → users, nullable)
- `processed_by` (UUID, FK → users, nullable)
- `refund_breakdown` (JSONB) - Proportional refund amounts per payment method
- `method_breakdown` (JSONB) - Processing status per payment method
- `gateway_refund_id` (VARCHAR, nullable) - ID from Paystack/PayPal
- `gateway_response` (JSONB) - Full gateway response data
- Timestamps: `requested_at`, `reviewed_at`, `processed_at`, `completed_at`

**Indexes:**
- `idx_refund_requests_booking` on `booking_id`
- `idx_refund_requests_status` on `status`
- `idx_refund_requests_requested_by` on `requested_by`

#### 2. refund_comments (Migration 045)

Two-way communication between guests and admins.

**Key Fields:**
- `id` (UUID, PK)
- `refund_request_id` (UUID, FK → refund_requests, CASCADE)
- `user_id` (UUID, FK → users)
- `comment_text` (TEXT)
- `is_internal` (BOOLEAN) - If true, only visible to admins
- Timestamps: `created_at`, `updated_at`

**Indexes:**
- `idx_refund_comments_refund` on `refund_request_id`
- `idx_refund_comments_user` on `user_id`
- `idx_refund_comments_created` on `created_at DESC`

#### 3. refund_status_history (Migration 045)

Complete audit trail of all status changes.

**Key Fields:**
- `id` (UUID, PK)
- `refund_request_id` (UUID, FK → refund_requests, CASCADE)
- `from_status` (VARCHAR, nullable) - null for initial creation
- `to_status` (VARCHAR)
- `changed_by` (UUID, FK → users)
- `changed_at` (TIMESTAMPTZ)
- `change_reason` (TEXT, nullable)
- `metadata` (JSONB, nullable)

**Indexes:**
- `idx_refund_status_history_refund` on `refund_request_id`
- `idx_refund_status_history_changed_at` on `changed_at DESC`
- `idx_refund_status_history_changed_by` on `changed_by`

#### 4. refund_documents (Migration 046)

Supporting documents uploaded by guests or admins.

**Key Fields:**
- `id` (UUID, PK)
- `refund_request_id` (UUID, FK → refund_requests, CASCADE)
- `uploaded_by` (UUID, FK → users)
- `document_type` (VARCHAR) - receipt, proof_of_cancellation, bank_statement, other
- `file_name` (VARCHAR)
- `file_url` (TEXT) - Supabase Storage URL
- `file_size` (INTEGER) - in bytes
- `mime_type` (VARCHAR)
- `description` (TEXT, nullable)
- `verification_status` (VARCHAR) - pending, verified, rejected
- `verified_by` (UUID, FK → users, nullable)
- `verification_notes` (TEXT, nullable)
- Timestamps: `uploaded_at`, `verified_at`

**Indexes:**
- `idx_refund_documents_refund` on `refund_request_id`
- `idx_refund_documents_uploaded_by` on `uploaded_by`

### Views Created

#### 1. refund_latest_comments (Migration 045)

Shows the most recent comment for each refund request.

```sql
SELECT DISTINCT ON (refund_request_id)
  rc.refund_request_id,
  rc.comment_text,
  rc.created_at,
  rc.is_internal,
  u.full_name AS commenter_name,
  ut.name AS commenter_role
FROM refund_comments rc
JOIN users u ON rc.user_id = u.id
LEFT JOIN user_types ut ON u.user_type_id = ut.id
ORDER BY rc.refund_request_id, rc.created_at DESC;
```

#### 2. refund_activity_feed (Migration 045)

Unified timeline combining status changes and comments.

```sql
-- Status changes
SELECT
  refund_request_id,
  'status_change' AS activity_type,
  changed_at AS activity_at,
  ...
FROM refund_status_history
UNION ALL
-- Comments
SELECT
  refund_request_id,
  'comment' AS activity_type,
  created_at AS activity_at,
  ...
FROM refund_comments
ORDER BY activity_at DESC;
```

### Triggers Created

#### track_refund_status_change (Migration 045)

Automatically logs status changes to `refund_status_history` table.

```sql
CREATE TRIGGER refund_status_change_trigger
AFTER UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION track_refund_status_change();
```

**Function Logic:**
- Only logs if status actually changed (OLD.status IS DISTINCT FROM NEW.status)
- Records from_status, to_status, changed_by, changed_at
- Automatically determines changed_by from updated_by, reviewed_by, processed_by, or requested_by

---

## API Endpoints

### Guest Endpoints

#### Create Refund Request
```
POST /api/bookings/:bookingId/refunds
Authorization: Bearer <token>

Request Body:
{
  "requested_amount": 1500.00,
  "reason": "Emergency family situation, cannot travel"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "status": "requested",
    "requested_amount": 1500.00,
    "currency": "ZAR",
    "reason": "Emergency family situation, cannot travel",
    "requested_at": "2026-01-14T10:30:00Z"
  },
  "message": "Refund request created successfully"
}
```

#### Get Booking Refunds
```
GET /api/bookings/:bookingId/refunds
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "approved",
      "requested_amount": 1500.00,
      "approved_amount": 1200.00,
      "requested_at": "2026-01-14T10:30:00Z",
      "reviewed_at": "2026-01-14T11:45:00Z"
    }
  ]
}
```

#### Get Refund Details
```
GET /api/refunds/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "booking": {
      "booking_number": "VB-2026-0001",
      "property": {
        "name": "Sunset Villa"
      }
    },
    "status": "processing",
    "requested_amount": 1500.00,
    "approved_amount": 1200.00,
    "reason": "Emergency family situation",
    "refund_breakdown": {
      "card": 600.00,
      "paypal": 600.00
    },
    "method_breakdown": {
      "payment_id_1": {
        "payment_method": "card",
        "amount": 600.00,
        "status": "completed",
        "gateway_refund_id": "rf_abc123",
        "processed_at": "2026-01-14T12:00:00Z"
      }
    }
  }
}
```

#### Withdraw Refund Request
```
POST /api/refunds/:id/withdraw
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { ... },
  "message": "Refund request withdrawn successfully"
}
```

#### Calculate Suggested Refund
```
GET /api/bookings/:bookingId/refunds/calculate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "suggested_amount": 1200.00,
    "full_amount": 1500.00,
    "cancellation_fee": 300.00,
    "cancellation_policy": "moderate",
    "days_until_checkin": 10,
    "explanation": "Based on your cancellation policy, you are eligible for an 80% refund."
  }
}
```

#### List My Refunds
```
GET /api/refunds?status=approved&page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Admin Endpoints

All admin endpoints require `refunds:read` or `refunds:manage` permission.

#### List All Refunds (Admin)
```
GET /api/admin/refunds?status=pending&property_id=uuid&page=1
Authorization: Bearer <admin-token>
Permissions: refunds:read

Query Parameters:
- status: requested | approved | rejected | processing | completed | cancelled | failed
- property_id: Filter by property UUID
- booking_id: Filter by booking UUID
- from_date: ISO date string
- to_date: ISO date string
- min_amount: Number
- max_amount: Number
- search: Text search (booking number, guest name, etc.)
- sortBy: created_at | requested_amount | status (default: created_at)
- sortOrder: asc | desc (default: desc)
- page: Number (default: 1)
- limit: Number (default: 20, max: 100)

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Approve Refund
```
POST /api/admin/refunds/:id/approve
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Request Body:
{
  "approved_amount": 1200.00,  // Optional, defaults to requested_amount
  "internal_notes": "Applied 20% cancellation fee per policy",
  "customer_notes": "Your refund has been approved and will be processed shortly."
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "Refund request approved successfully"
}
```

**Workflow:**
1. Validates refund is in `requested` status
2. Sets status to `approved`
3. Records approved_amount (or uses requested_amount)
4. Creates comments (internal and customer-facing)
5. Logs status change to history
6. Sends `refund_approved` notification to guest

#### Reject Refund
```
POST /api/admin/refunds/:id/reject
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Request Body:
{
  "customer_notes": "Refund cannot be approved as check-in date is within 3 days and per policy, no refunds are available.",
  "internal_notes": "Requested refund outside policy window"  // Optional
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "Refund request rejected"
}
```

**Workflow:**
1. Validates refund is in `requested` status
2. Sets status to `rejected`
3. Creates comments (customer_notes is required, internal_notes optional)
4. Logs status change to history
5. Sends `refund_rejected` notification to guest

#### Process Refund (Automatic)
```
POST /api/admin/refunds/:id/process
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Request Body: (none)

Response:
{
  "success": true,
  "data": {
    "refund_id": "uuid",
    "status": "processing",
    "processed_methods": [
      {
        "payment_method": "card",
        "amount": 600.00,
        "gateway": "paystack",
        "gateway_refund_id": "rf_abc123",
        "status": "processing"
      }
    ],
    "manual_methods": [
      {
        "payment_method": "eft",
        "amount": 600.00,
        "requires_manual_processing": true
      }
    ]
  },
  "message": "Refund processing initiated"
}
```

**Workflow:**
1. Validates refund is in `approved` status
2. Retrieves booking payment methods
3. Calculates proportional refund per payment method
4. For each payment method:
   - **Card/Bank Transfer**: Calls Paystack refund API
   - **PayPal**: Calls PayPal refund API
   - **EFT/Cash**: Marks for manual processing
5. Updates status to `processing`
6. Sends `refund_processing_started` notification

#### Mark Manual Refund Complete
```
POST /api/admin/refunds/:id/mark-complete
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Request Body:
{
  "refund_reference": "EFT-REF-123456",
  "notes": "Manual EFT processed via bank on 2026-01-14"
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "Manual refund marked as complete"
}
```

**Workflow:**
1. Validates refund is in `processing` status
2. Updates refund with reference and notes
3. Sets status to `completed`
4. Creates audit log entry
5. Sends `refund_completed` notification

#### Retry Failed Refund
```
POST /api/admin/refunds/:id/retry
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Response:
{
  "success": true,
  "data": { ... },
  "message": "Refund retry initiated"
}
```

**Workflow:**
- Resets status from `failed` to `approved`
- Calls `processRefund()` again

### Comment System Endpoints

#### Add Comment
```
POST /api/refunds/:id/comments
Authorization: Bearer <token>

Request Body:
{
  "comment_text": "Can you provide an update on when I will receive the refund?",
  "is_internal": false  // true = admin-only, false = visible to guest
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "refund_request_id": "uuid",
    "user_id": "uuid",
    "comment_text": "...",
    "is_internal": false,
    "created_at": "2026-01-14T14:30:00Z",
    "user": {
      "full_name": "John Doe",
      "user_type": "guest"
    }
  },
  "message": "Comment added successfully"
}
```

**Notes:**
- Guests can only create non-internal comments
- Admins can create both internal and public comments
- Internal comments are only visible to admins (via RLS policies)
- Triggers notification to opposite party

#### Get Comments
```
GET /api/refunds/:id/comments
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "comment_text": "...",
      "is_internal": false,
      "created_at": "2026-01-14T14:30:00Z",
      "user": {
        "full_name": "John Doe"
      }
    }
  ]
}
```

**RLS Filtering:**
- Guests see only non-internal comments on their own refunds
- Admins see all comments (including internal)

#### Get Activity Feed
```
GET /api/refunds/:id/activity
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "activity_type": "status_change",
      "activity_at": "2026-01-14T11:45:00Z",
      "actor_name": "Admin User",
      "actor_role": "admin",
      "activity_description": "requested → approved",
      "additional_info": "Applied 20% cancellation fee"
    },
    {
      "activity_type": "comment",
      "activity_at": "2026-01-14T14:30:00Z",
      "actor_name": "John Doe",
      "actor_role": "guest",
      "activity_description": "Can you provide an update...",
      "is_internal": false
    }
  ]
}
```

#### Get Status History
```
GET /api/refunds/:id/history
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "from_status": null,
      "to_status": "requested",
      "changed_by": "uuid",
      "changed_at": "2026-01-14T10:30:00Z",
      "change_reason": "Initial refund request created"
    },
    {
      "id": "uuid",
      "from_status": "requested",
      "to_status": "approved",
      "changed_by": "uuid",
      "changed_at": "2026-01-14T11:45:00Z",
      "change_reason": "Applied 20% cancellation fee per policy"
    }
  ]
}
```

### Document Management Endpoints

#### Upload Document
```
POST /api/refunds/:id/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: (binary) - Max 10MB, types: PDF, JPG, PNG, DOCX
- document_type: receipt | proof_of_cancellation | bank_statement | other
- description: (optional) "Receipt from hotel showing cancellation"

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "refund_request_id": "uuid",
    "document_type": "receipt",
    "file_name": "receipt_123.pdf",
    "file_url": "https://supabase.co/storage/...",
    "file_size": 245678,
    "mime_type": "application/pdf",
    "verification_status": "pending",
    "uploaded_at": "2026-01-14T15:00:00Z"
  },
  "message": "Document uploaded successfully"
}
```

**Workflow:**
1. Validates file type and size
2. Uploads to Supabase Storage (`refund-documents` bucket)
3. Creates document record in database
4. Sends `refund_document_uploaded` notification to admins

#### Get Documents
```
GET /api/refunds/:id/documents
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "document_type": "receipt",
      "file_name": "receipt_123.pdf",
      "file_size": 245678,
      "verification_status": "verified",
      "uploaded_at": "2026-01-14T15:00:00Z",
      "verified_at": "2026-01-14T15:30:00Z",
      "verified_by": {
        "full_name": "Admin User"
      }
    }
  ]
}
```

#### Verify Document (Admin)
```
POST /api/admin/refunds/:id/documents/:docId/verify
Authorization: Bearer <admin-token>
Permissions: refunds:manage

Request Body: (none)

Response:
{
  "success": true,
  "data": { ... },
  "message": "Document verified successfully"
}
```

**Workflow:**
1. Updates verification_status to `verified`
2. Records verified_by and verified_at
3. Sends `refund_document_verified` notification to uploader

#### Delete Document
```
DELETE /api/refunds/:id/documents/:docId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Permissions:**
- Users can delete their own unverified documents
- Admins can delete any documents

#### Get Document Download URL
```
GET /api/refunds/:id/documents/:docId/download
Authorization: Bearer <token>

Response: Redirects to signed Supabase Storage URL
```

---

## Notification System

### Overview

The refund system integrates with the existing notification service to send 12 lifecycle notifications via email. All notifications respect user preferences.

### Notification Templates (Migration 080)

All templates are stored in the `notification_templates` table with `template_key` for lookup.

#### 1. refund_requested (to admins)
**Trigger**: Guest creates refund request
**Recipients**: Property owner + property admins
**Template Variables**:
- `refund_reference`: Short refund ID (first 8 chars)
- `booking_reference`: Booking number
- `booking_id`: Full booking UUID
- `guest_name`: Guest's full name
- `guest_email`: Guest's email
- `property_name`: Property name
- `requested_amount`: Formatted currency amount
- `reason`: Guest's refund reason
- `dashboard_url`: Link to admin dashboard

**Subject**: "New Refund Request for Booking {{booking_reference}}"

**Body**:
```
A guest has requested a refund for booking [booking_reference].

Guest: [guest_name] ([guest_email])
Property: [property_name]
Requested Amount: [requested_amount]
Reason: [reason]

[Review Refund Request Button]
```

#### 2. refund_approved (to guest)
**Trigger**: Admin approves refund
**Recipients**: Guest (requested_by)
**Template Variables**:
- `booking_reference`
- `booking_id`
- `approved_amount`: Formatted approved amount
- `property_name`
- `admin_notes`: Optional customer-facing notes from admin
- `portal_url`: Link to guest portal

**Subject**: "Your Refund Request for {{booking_reference}} Has Been Approved"

**Body**:
```
Great news! Your refund request for booking [booking_reference] has been approved.

Approved Amount: [approved_amount]
Property: [property_name]

Your refund will be processed shortly and returned to your original payment method(s).

Note from host: [admin_notes]

[View Booking Details Button]
```

#### 3. refund_rejected (to guest)
**Trigger**: Admin rejects refund
**Recipients**: Guest (requested_by)
**Template Variables**:
- `booking_reference`
- `booking_id`
- `property_name`
- `rejection_reason`: Admin's customer-facing reason
- `portal_url`

**Subject**: "Your Refund Request for {{booking_reference}} Has Been Declined"

**Body**:
```
We regret to inform you that your refund request for booking [booking_reference] has been declined.

Property: [property_name]
Reason: [rejection_reason]

If you have questions or would like to discuss this decision, please contact the property directly.

[View Booking Details Button]
```

#### 4. refund_processing_started (to guest and admins)
**Trigger**: Admin starts processing refund
**Recipients**: Guest + Property owner + Property admins
**Template Variables**:
- `refund_reference`
- `booking_reference`
- `booking_id`
- `refund_amount`: Formatted amount
- `property_name`
- `dashboard_url` / `portal_url`

**Subject**: "Your Refund for {{booking_reference}} Is Being Processed"

**Body**:
```
Your refund for booking [booking_reference] is now being processed.

Refund Amount: [refund_amount]
Property: [property_name]

The refund will be returned to your original payment method(s). This typically takes 5-10 business days.

[Track Refund Status Button]
```

#### 5. refund_processing_completed (to guest)
**Trigger**: Refund successfully processed
**Recipients**: Guest (requested_by)
**Template Variables**:
- `refund_reference`
- `booking_reference`
- `booking_id`
- `refund_amount`
- `property_name`
- `portal_url`

**Subject**: "Your Refund for {{booking_reference}} Has Been Processed"

**Body**:
```
Your refund for booking [booking_reference] has been successfully processed.

Refund Amount: [refund_amount]
Property: [property_name]

The funds have been sent to your original payment method(s). Depending on your bank, it may take 5-10 business days to appear in your account.

[View Transaction Details Button]
```

#### 6. refund_processing_failed (to guest and admins)
**Trigger**: Refund processing encounters error
**Recipients**: Guest + Property owner
**Template Variables**:
- `booking_reference`
- `booking_id`
- `property_name`
- `error_message`: Technical error message
- `portal_url` / `dashboard_url`

**Subject**: "Issue Processing Your Refund for {{booking_reference}}"

**Body**:
```
We encountered an issue while processing your refund for booking [booking_reference].

Property: [property_name]

Our team has been notified and is working to resolve this. We will contact you shortly with an update.

If you have questions, please contact support.

[View Booking Details Button]
```

#### 7. refund_completed (to all parties)
**Trigger**: Entire refund process complete
**Recipients**: Guest + Property owner
**Template Variables**:
- `booking_reference`
- `booking_id`
- `total_refunded`: Final refunded amount
- `property_name`
- `portal_url`

**Subject**: "Refund Complete for {{booking_reference}}"

**Body**:
```
The refund for booking [booking_reference] is now complete.

Total Refunded: [total_refunded]
Property: [property_name]

Thank you for your business. We hope to serve you again in the future.

[View Final Summary Button]
```

#### 8. refund_cancelled (to guest and admins)
**Trigger**: Refund request cancelled
**Recipients**: Guest + Property owner
**Template Variables**:
- `booking_reference`
- `booking_id`
- `property_name`
- `cancellation_reason`: Optional reason
- `portal_url`

**Subject**: "Refund Request Cancelled for {{booking_reference}}"

**Body**:
```
The refund request for booking [booking_reference] has been cancelled.

Property: [property_name]
Reason: [cancellation_reason]

[View Booking Details Button]
```

#### 9. refund_comment_from_guest (to admins)
**Trigger**: Guest adds comment to refund
**Recipients**: Property owner + Property admins
**Template Variables**:
- `refund_reference`
- `booking_reference`
- `booking_id`
- `guest_name`
- `comment_text`: The comment content
- `dashboard_url`

**Subject**: "New Comment on Refund Request {{refund_reference}}"

**Body**:
```
[guest_name] has added a comment to refund request [refund_reference].

Booking: [booking_reference]

Comment:
"[comment_text]"

[View and Respond Button]
```

#### 10. refund_comment_from_admin (to guest)
**Trigger**: Admin adds non-internal comment
**Recipients**: Guest (requested_by)
**Template Variables**:
- `booking_reference`
- `booking_id`
- `comment_text`: The comment content
- `portal_url`

**Subject**: "Update on Your Refund Request for {{booking_reference}}"

**Body**:
```
The property has added a comment to your refund request for booking [booking_reference].

Message:
"[comment_text]"

[View and Respond Button]
```

#### 11. refund_document_uploaded (to admins)
**Trigger**: Guest uploads document
**Recipients**: Property owner + Property admins
**Template Variables**:
- `refund_reference`
- `booking_reference`
- `booking_id`
- `guest_name`
- `file_name`: Uploaded file name
- `dashboard_url`

**Subject**: "New Document for Refund Request {{refund_reference}}"

**Body**:
```
[guest_name] has uploaded a document for refund request [refund_reference].

Booking: [booking_reference]
File Name: [file_name]

Please review and verify the document.

[Review Document Button]
```

#### 12. refund_document_verified (to uploader)
**Trigger**: Admin verifies or rejects document
**Recipients**: Document uploader
**Template Variables**:
- `refund_reference`
- `booking_id`
- `verification_status`: "verified" or "rejected"
- `file_name`: Document file name
- `verification_notes`: Optional admin notes
- `portal_url`

**Subject**: "Document {{verification_status}} for Refund {{refund_reference}}"

**Body**:
```
Your document for refund request [refund_reference] has been [verification_status].

File Name: [file_name]
Note: [verification_notes]

[View Refund Details Button]
```

### Notification Implementation

All notifications are sent via the `sendNotification` helper function in `notifications.service.ts`:

```typescript
export interface SendNotificationParams {
  template_key: string; // Template name (e.g., 'refund_requested')
  recipient_ids: string[]; // Array of user IDs to notify
  data: Record<string, any>; // Template variables
  priority?: 'low' | 'normal' | 'high'; // Notification priority
  send_email?: boolean; // Whether to send email (default: true)
}

export const sendNotification = async (params: SendNotificationParams): Promise<void> => {
  // Implementation sends notifications to all recipients
  // Respects user notification preferences
  // Doesn't throw errors (to not block refund operations)
};
```

**Usage Example**:
```typescript
await sendNotification({
  template_key: 'refund_approved',
  recipient_ids: [refundRequest.requested_by],
  data: {
    booking_reference: booking.booking_number,
    booking_id: booking.id,
    approved_amount: formatCurrency(approvedAmount, refundRequest.currency),
    property_name: booking.property.name,
    admin_notes: adminNotes || '',
    portal_url: process.env.PORTAL_URL,
  },
  priority: 'high',
});
```

---

## Payment Gateway Integration

### Overview

The refund system integrates with Paystack and PayPal to automatically process refunds back to the original payment methods. Manual refund methods (EFT, cash) are flagged for manual processing.

### Supported Payment Methods

| Payment Method | Gateway | Automatic Refund | Manual Refund |
|---------------|---------|------------------|---------------|
| Card (Credit/Debit) | Paystack | ✅ Yes | - |
| Bank Transfer | Paystack | ✅ Yes | - |
| PayPal | PayPal | ✅ Yes | - |
| EFT | - | - | ✅ Yes |
| Cash | - | - | ✅ Yes |

### Paystack Integration

**Service File**: `backend/src/services/payment.service.ts`

**Function**: `refundPaystackTransaction()`

```typescript
export const refundPaystackTransaction = async (
  gatewayReference: string,  // Transaction reference from Paystack
  amount: number,            // Refund amount in main currency unit (e.g., 100.00 ZAR)
  currency: string,          // Currency code (e.g., 'ZAR')
  reason?: string            // Optional refund reason
): Promise<{
  success: boolean;
  refund_id?: string;
  status?: string;
  message?: string;
  error?: string;
}> => {
  // Implementation details
};
```

**API Call**:
```
POST https://api.paystack.co/refund
Authorization: Bearer <secret_key>
Content-Type: application/json

{
  "transaction": "trx_abc123",
  "amount": 120000,  // Amount in kobo (1200.00 ZAR * 100)
  "currency": "ZAR",
  "customer_note": "Refund processed"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Refund has been queued for processing",
  "data": {
    "id": 123456,
    "refund_reference": "rf_abc123",
    "status": "pending"
  }
}
```

**Webhook Handling**:

Paystack sends webhook when refund status changes:

```
POST /api/webhooks/paystack/refund
X-Paystack-Signature: <signature>

{
  "event": "refund.processed",
  "data": {
    "reference": "rf_abc123",
    "amount": 120000,
    "status": "processed",  // or "failed"
    "message": "Refund successful"
  }
}
```

**Webhook Handler**: `backend/src/controllers/webhook.controller.ts`

```typescript
async handlePaystackRefundWebhook(req: Request, res: Response): Promise<void> {
  // 1. Verify webhook signature
  // 2. Find refund request by gateway_refund_id
  // 3. Update refund status based on gateway status
  // 4. Send notification to guest
}
```

### PayPal Integration

**Service File**: `backend/src/services/payment.service.ts`

**Function**: `refundPayPalTransaction()`

```typescript
export const refundPayPalTransaction = async (
  captureId: string,    // PayPal capture ID from original payment
  amount: number,       // Refund amount
  currency: string,     // Currency code (e.g., 'USD')
  reason?: string       // Optional refund reason
): Promise<{
  success: boolean;
  refund_id?: string;
  status?: string;
  message?: string;
  error?: string;
}> => {
  // Implementation details
};
```

**API Call Flow**:

1. **Get OAuth Token**:
```
POST https://api-m.sandbox.paypal.com/v1/oauth2/token
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

Response:
```json
{
  "access_token": "A21AAL...",
  "expires_in": 32400
}
```

2. **Process Refund**:
```
POST https://api-m.sandbox.paypal.com/v2/payments/captures/{capture_id}/refund
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": {
    "value": "1200.00",
    "currency_code": "USD"
  },
  "note_to_payer": "Refund processed"
}
```

Response:
```json
{
  "id": "refund_id_123",
  "status": "COMPLETED",
  "amount": {
    "value": "1200.00",
    "currency_code": "USD"
  }
}
```

**Webhook Handling**:

PayPal sends webhook when refund completes:

```
POST /api/webhooks/paypal/refund
PayPal-Transmission-Id: <id>
PayPal-Transmission-Sig: <signature>

{
  "event_type": "PAYMENT.CAPTURE.REFUNDED",
  "resource": {
    "id": "refund_id_123",
    "status": "COMPLETED",
    "amount": {
      "value": "1200.00",
      "currency_code": "USD"
    }
  }
}
```

**Webhook Handler**: `backend/src/controllers/webhook.controller.ts`

```typescript
async handlePayPalRefundWebhook(req: Request, res: Response): Promise<void> {
  // 1. Verify webhook signature
  // 2. Find refund request by gateway_refund_id
  // 3. Update refund status to 'completed'
  // 4. Send notification to guest
}
```

### Proportional Refund Calculation

When a booking was paid with multiple payment methods, refunds are split proportionally.

**Example Scenario**:
- Total Booking Amount: R 2,000
- Payments:
  - Card (Paystack): R 1,000 (50%)
  - PayPal: R 1,000 (50%)
- Refund Approved Amount: R 1,500

**Calculation**:
```typescript
const proportionalRefund = (approvedAmount / totalBookingAmount) * paymentAmount;

// Card refund: (1500 / 2000) * 1000 = R 750
// PayPal refund: (1500 / 2000) * 1000 = R 750
```

**Storage**:

The `refund_breakdown` JSONB field stores the refund amounts:
```json
{
  "card": 750.00,
  "paypal": 750.00
}
```

The `method_breakdown` JSONB field tracks processing status per payment:
```json
{
  "payment_uuid_1": {
    "payment_method": "card",
    "amount": 750.00,
    "status": "completed",
    "gateway_refund_id": "rf_abc123",
    "processed_at": "2026-01-14T12:00:00Z"
  },
  "payment_uuid_2": {
    "payment_method": "paypal",
    "amount": 750.00,
    "status": "completed",
    "gateway_refund_id": "refund_xyz",
    "processed_at": "2026-01-14T12:01:00Z"
  }
}
```

### Manual Refund Processing

For payment methods that cannot be refunded automatically (EFT, cash), the system:

1. Marks the refund status as `processing`
2. Creates an internal comment with instructions
3. Sends notification to admins
4. Admin manually processes refund outside the system
5. Admin marks refund as complete using `/api/admin/refunds/:id/mark-complete` endpoint

**Example Manual Refund Flow**:

1. Guest paid R 1,500 via EFT
2. Refund approved for R 1,200
3. System creates internal comment: "Manual refund of R 1,200 required for EFT payment. Please process manually and update status."
4. Admin processes bank transfer manually
5. Admin calls mark-complete endpoint with reference: `{ "refund_reference": "EFT-REF-123456", "notes": "Processed via bank transfer" }`
6. System updates status to `completed`
7. System sends `refund_completed` notification to guest

---

## Security & Authorization

### Row Level Security (RLS) Policies

All refund tables have RLS enabled to prevent unauthorized data access.

#### refund_requests Policies (Migration 081)

**Guest Policies:**

1. **View Own Refunds**:
```sql
CREATE POLICY "Guests can view own refund requests"
  ON refund_requests FOR SELECT
  USING (requested_by = auth.uid());
```

2. **Create Refund Request**:
```sql
CREATE POLICY "Guests can create refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
        AND guest_id = auth.uid()
    )
  );
```

**Property Manager Policies:**

3. **View Property Refunds**:
```sql
CREATE POLICY "Property owners can view property refunds"
  ON refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = refund_requests.booking_id
        AND p.owner_id = auth.uid()
    )
  );
```

4. **Update Property Refunds**:
```sql
CREATE POLICY "Property owners can update property refunds"
  ON refund_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = refund_requests.booking_id
        AND p.owner_id = auth.uid()
    )
  );
```

**Team Member Policies:**

5. **View Company Property Refunds**:
```sql
CREATE POLICY "Team members can view company property refunds"
  ON refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE b.id = refund_requests.booking_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
  );
```

6. **Update Company Property Refunds** (Managers only):
```sql
CREATE POLICY "Team managers can update company property refunds"
  ON refund_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE b.id = refund_requests.booking_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
        AND ctm.role IN ('owner', 'manager')
    )
  );
```

**Super Admin Policy:**

7. **View All Refunds**:
```sql
CREATE POLICY "Super admins can view all refunds"
  ON refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );
```

8. **Update All Refunds**:
```sql
CREATE POLICY "Super admins can update all refunds"
  ON refund_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );
```

#### refund_comments Policies (Migration 081)

**Read Policies:**

1. **Guests View Non-Internal Comments**:
```sql
CREATE POLICY "Users can view accessible refund comments"
  ON refund_comments FOR SELECT
  USING (
    -- Guest can see non-internal comments on their refunds
    (
      EXISTS (
        SELECT 1 FROM refund_requests rr
        WHERE rr.id = refund_comments.refund_request_id
          AND rr.requested_by = auth.uid()
      )
      AND is_internal = false
    )
    OR
    -- Property owners can see all comments for their properties
    EXISTS (...)
    OR
    -- Super admins can see all comments
    EXISTS (...)
  );
```

**Insert Policies:**

2. **Create Comments**:
```sql
CREATE POLICY "Users can create refund comments"
  ON refund_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Guest can comment on their own refunds (non-internal only)
      (
        EXISTS (
          SELECT 1 FROM refund_requests
          WHERE id = refund_request_id
            AND requested_by = auth.uid()
        )
        AND is_internal = false
      )
      OR
      -- Property owners can comment (including internal)
      EXISTS (...)
      OR
      -- Team members can comment (including internal)
      EXISTS (...)
    )
  );
```

**Key RLS Features:**
- Guests cannot see internal comments
- Guests cannot create internal comments
- Property managers and team members can see and create internal comments
- Super admins have full access

#### refund_status_history Policies (Migration 081)

Similar policies to comments:
- Guests can read history for their own refunds
- Property managers can read history for their properties
- Team members can read history for company properties
- Super admins can read all history
- Only admins can manually insert history entries (trigger handles automatic insertion)

#### refund_documents Policies (Migration 081)

**Read Policies:**
- Users can view their own uploaded documents
- Property managers can view documents for their properties
- Team members can view documents for company properties
- Super admins can view all documents

**Insert Policies:**
- Guests can upload documents to their own refunds
- Property managers can upload documents to property refunds
- Team members can upload documents to company property refunds
- Super admins can upload documents anywhere

**Update Policies:**
- Property managers and team managers can update document verification status
- Super admins can update all documents

**Delete Policies:**
- Users can delete their own unverified documents
- Property managers can delete documents for their properties
- Team members (with manager role) can delete documents for company properties
- Super admins can delete all documents

### Authorization Middleware

**File**: `backend/src/routes/refund.routes.ts`

All admin endpoints require authentication and permission checks:

```typescript
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

// Admin routes
router.get(
  '/admin/refunds',
  authenticate,                          // Verify JWT token
  requirePermission('refunds', 'read'),  // Check refunds:read permission
  refundController.listRefunds
);

router.post(
  '/admin/refunds/:id/approve',
  authenticate,
  requirePermission('refunds', 'manage'),  // Check refunds:manage permission
  refundController.approveRefund
);
```

**Permissions Required**:
- `refunds:read` - View refund requests (list, details)
- `refunds:manage` - Approve, reject, process refunds

**User Types with Permissions**:
- `super_admin` - Has both refunds:read and refunds:manage
- `admin` - Has both refunds:read and refunds:manage
- `property_manager` - Can be assigned either/both
- `guest` - No refund admin permissions (can only manage own refunds)

### Subscription Tier Gating (Optional)

If needed, you can add subscription tier checks to ensure only paying customers can use refund features:

```typescript
import { requireRefundAccess } from '../middleware/subscription.middleware';

router.post(
  '/admin/refunds/:id/approve',
  authenticate,
  requireRefundAccess,  // Check subscription includes refund features
  requirePermission('refunds', 'manage'),
  refundController.approveRefund
);
```

---

## Frontend Components

### Component Structure

```
frontend/src/components/features/Refund/
  RefundApprovalForm/
    index.ts
    RefundApprovalForm.tsx
    RefundApprovalForm.types.ts
  RefundProcessingPanel/
    index.ts
    RefundProcessingPanel.tsx
    RefundProcessingPanel.types.ts
  RefundCommentThread/
    index.ts
    RefundCommentThread.tsx
    RefundCommentThread.types.ts
  DocumentList/
    index.ts
    DocumentList.tsx
    DocumentList.types.ts
```

### RefundApprovalForm

**Purpose**: Admin UI for approving or rejecting refund requests

**Location**: `frontend/src/components/features/Refund/RefundApprovalForm/`

**Props**:
```typescript
interface RefundApprovalFormProps {
  refund: RefundRequest;
  booking: Booking;
  mode: 'approve' | 'reject';
  onSubmit: (data: RefundApprovalData) => Promise<void>;
  onCancel: () => void;
}
```

**Features**:
- **Approval Mode**:
  - Approved amount input (pre-filled with requested amount)
  - Max validation (cannot exceed requested amount)
  - Internal notes textarea
  - Customer notes textarea
  - Notify guest checkbox (default: true)
  - Green gradient background

- **Rejection Mode**:
  - Customer notes textarea (required)
  - Internal notes textarea (optional)
  - Notify guest checkbox (default: true)
  - Red gradient background

- **UI Pattern**:
  - Inline expandable form (no modal)
  - Cancel/Save buttons at bottom
  - Loading state on submit button
  - Form validation errors shown inline

**Usage Example**:
```tsx
{showApprovalForm === refund.id && (
  <Card.Body className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
    <RefundApprovalForm
      refund={refund}
      booking={booking}
      mode="approve"
      onSubmit={handleApproveRefund}
      onCancel={() => setShowApprovalForm(null)}
    />
  </Card.Body>
)}
```

### RefundProcessingPanel

**Purpose**: Display refund breakdown by payment method with processing status

**Location**: `frontend/src/components/features/Refund/RefundProcessingPanel/`

**Props**:
```typescript
interface RefundProcessingPanelProps {
  refund: RefundRequest;
  paymentMethods: BookingPayment[];
  onProcess: (methodId: string) => Promise<void>;
}
```

**Features**:
- Table/grid showing each payment method used
- Amount to refund per method (proportional calculation)
- Processing status badge per method (pending, processing, completed, failed)
- Process button per method (if admin and status is pending)
- Success/error indicators
- Real-time status updates

**UI Layout**:
```
Payment Method | Original Amount | Refund Amount | Status | Action
Card (Paystack) | R 1,000 | R 750 | [✅ Completed] | -
PayPal | R 1,000 | R 750 | [🔄 Processing] | -
EFT | R 500 | R 375 | [⏸ Pending] | [Process] Button
```

**Usage Example**:
```tsx
{showProcessingPanel === refund.id && (
  <Card.Body>
    <RefundProcessingPanel
      refund={refund}
      paymentMethods={booking.payments}
      onProcess={handleProcessRefund}
    />
  </Card.Body>
)}
```

### RefundCommentThread

**Purpose**: Two-way communication between guest and admin

**Location**: `frontend/src/components/features/Refund/RefundCommentThread/`

**Props**:
```typescript
interface RefundCommentThreadProps {
  refund: RefundRequest;
  comments: RefundComment[];
  currentUser: User;
  onAddComment: (comment: string, isInternal: boolean) => Promise<void>;
}
```

**Features**:
- Chat-like thread layout
- Color-coded by role:
  - Guest comments: Blue background
  - Admin comments: Gray background
- Internal comments badge (only visible to admins)
- Timestamp display (relative: "2 hours ago")
- Add comment form at bottom with:
  - Textarea for comment text
  - Internal comment checkbox (admin only)
  - Submit button
- Real-time sorting (newest first or oldest first toggle)

**Comment Card Layout**:
```tsx
<div className={cn(
  "p-3 rounded-lg",
  comment.user_role === 'guest' ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-800",
  comment.is_internal && "border-2 border-amber-500"
)}>
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium">{comment.user_name}</span>
    <div className="flex items-center gap-2">
      {comment.is_internal && <Badge variant="warning">Internal</Badge>}
      <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
    </div>
  </div>
  <p className="text-sm">{comment.comment_text}</p>
</div>
```

**Usage Example**:
```tsx
<Tabs.Panel value="comments">
  <RefundCommentThread
    refund={refund}
    comments={refundComments[refund.id] || []}
    currentUser={currentUser}
    onAddComment={(text, isInternal) => handleAddComment(refund.id, text, isInternal)}
  />
</Tabs.Panel>
```

### DocumentList

**Purpose**: Display uploaded refund documents with admin actions

**Location**: `frontend/src/components/features/Refund/DocumentList/`

**Props**:
```typescript
interface DocumentListProps {
  refund: RefundRequest;
  documents: RefundDocument[];
  isAdmin: boolean;
  onVerify: (docId: string) => Promise<void>;
  onReject: (docId: string, reason: string) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  onUpload: (file: File, documentType: string, description?: string) => Promise<void>;
}
```

**Features**:
- Grid layout (2-3 columns on desktop, 1 on mobile)
- Document cards with:
  - Preview thumbnail (for images) or file icon
  - File name and size
  - Upload date and uploader name
  - Verification status badge (pending, verified, rejected)
  - Download button for all users
  - Admin action buttons (verify/reject/delete) if pending
- Upload form:
  - File input (drag-and-drop supported)
  - Document type dropdown
  - Optional description textarea
  - Upload button

**Document Card Layout**:
```tsx
<Card>
  <img src={doc.file_url} className="w-full h-32 object-cover" />
  <div className="p-3">
    <p className="text-sm font-medium truncate">{doc.file_name}</p>
    <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
    <Badge variant={getStatusVariant(doc.verification_status)}>
      {doc.verification_status}
    </Badge>
    {isAdmin && doc.verification_status === 'pending' && (
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="success" onClick={() => onVerify(doc.id)}>
          Verify
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleReject(doc.id)}>
          Reject
        </Button>
      </div>
    )}
    <Button size="sm" variant="ghost" onClick={() => window.open(doc.file_url)}>
      Download
    </Button>
  </div>
</Card>
```

**Usage Example**:
```tsx
<Tabs.Panel value="documents">
  <DocumentList
    refund={refund}
    documents={refundDocuments[refund.id] || []}
    isAdmin={userRole === 'property_manager' || userRole === 'super_admin'}
    onVerify={handleVerifyDocument}
    onReject={handleRejectDocument}
    onDelete={handleDeleteDocument}
    onUpload={handleUploadDocument}
  />
</Tabs.Panel>
```

### Integration with BookingDetailPage

All refund components are integrated into the BookingDetailPage under the "Refunds" tab.

**Location**: `frontend/src/pages/bookings/BookingDetailPage.tsx` (lines 1033-1227)

**Tab Structure**:
```tsx
{activeTab === 'refunds' && (
  <div className="space-y-6">
    {/* Guest Request Refund Form */}
    {canRequestRefund && (
      <Card variant={showRefundForm ? 'highlight' : 'default'}>
        <Card.Header>
          <Button onClick={() => setShowRefundForm(true)}>
            Request Refund
          </Button>
        </Card.Header>
        {showRefundForm && (
          <Card.Body className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <RefundRequestForm ... />
          </Card.Body>
        )}
      </Card>
    )}

    {/* Admin Approval Workflow */}
    {isAdmin && (
      <Card>
        <h3>Pending Approvals</h3>
        {refunds.filter(r => r.status === 'pending').map(refund => (
          <RefundApprovalCard key={refund.id} refund={refund} ... />
        ))}
      </Card>
    )}

    {/* Approved Refunds - Processing */}
    <Card>
      <h3>Approved Refunds</h3>
      {refunds.filter(r => r.status === 'approved').map(refund => (
        <RefundProcessingCard key={refund.id} refund={refund} ... />
      ))}
    </Card>

    {/* All Refunds - Details */}
    {refunds.map(refund => (
      <Card key={refund.id}>
        <Tabs defaultTab="details">
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="comments">Comments</Tabs.Tab>
          <Tabs.Tab value="documents">Documents</Tabs.Tab>

          <Tabs.Panel value="details">...</Tabs.Panel>
          <Tabs.Panel value="comments">
            <RefundCommentThread ... />
          </Tabs.Panel>
          <Tabs.Panel value="documents">
            <DocumentList ... />
          </Tabs.Panel>
        </Tabs>
      </Card>
    ))}
  </div>
)}
```

---

## Testing

### Automated Testing

#### Quick Verification Test

**Script**: `test-refund-system-quick.js`

**Purpose**: Verify all refund system components are properly set up

**Tests**:
1. ✅ Notification Templates - Checks all 12 templates exist
2. ✅ Row Level Security - Verifies RLS is enabled on refund tables
3. ✅ Refund Permissions - Confirms refunds:read and refunds:manage exist
4. ✅ Permission Assignments - Verifies super_admin and admin have permissions
5. ✅ Database Tables - Checks all 4 refund tables exist and are accessible

**Run Command**:
```bash
node test-refund-system-quick.js
```

**Expected Output**:
```
🧪 Testing Refund Management System

📧 TEST 1: Notification Templates
✅ All 12 notification templates found

🔒 TEST 2: Row Level Security
✅ RLS enabled on refund_requests, refund_comments, refund_status_history, refund_documents

🔑 TEST 3: Refund Permissions
✅ Required permissions exist: refunds:read, refunds:manage

👥 TEST 4: Permission Assignments
✅ super_admin has refunds:read and refunds:manage
✅ admin has refunds:read and refunds:manage

📊 TEST 5: Database Tables
✅ Table refund_requests exists and is accessible
✅ Table refund_comments exists and is accessible
✅ Table refund_status_history exists and is accessible
✅ Table refund_documents exists and is accessible

📋 TEST SUMMARY
✅ Passed: 5
❌ Failed: 0

🎉 All tests passed! Refund system is ready.
```

### Manual Testing Guide

#### Test Scenario 1: Guest Refund Request to Completion

**Objective**: Test complete refund lifecycle from request to completion

**Steps**:

1. **Login as Guest**
   - Navigate to My Bookings
   - Find an eligible booking (status: confirmed, check-in date in future)
   - Click on booking to view details
   - Navigate to "Refunds" tab

2. **Create Refund Request**
   - Click "Request Refund" button
   - Enter refund amount (e.g., full amount or partial)
   - Enter reason: "Emergency family situation, cannot travel"
   - Click "Submit Request"
   - ✅ Verify refund appears with status "requested"
   - ✅ Verify notification sent to property owner (check email)

3. **Login as Admin**
   - Navigate to Admin Dashboard → Refund Manager
   - ✅ Verify new refund appears in "Pending Approvals" section
   - Click on refund to view details

4. **Approve Refund**
   - Click "Approve" button
   - Adjust approved amount if needed (e.g., apply cancellation fee)
   - Enter customer notes: "Your refund has been approved..."
   - Enter internal notes: "Applied 20% cancellation fee per policy"
   - Click "Save"
   - ✅ Verify refund status changed to "approved"
   - ✅ Verify notification sent to guest (check email)
   - ✅ Verify internal comment not visible to guest

5. **Process Refund**
   - Click "Process Refund" button
   - ✅ Verify payment method breakdown displayed
   - ✅ Verify proportional amounts calculated correctly
   - For automatic methods (card, PayPal):
     - Click "Process" button for each method
     - ✅ Verify status changes to "processing"
     - ✅ Verify gateway refund ID recorded
   - For manual methods (EFT, cash):
     - ✅ Verify flagged for manual processing
     - Manually process refund outside system
     - Click "Mark as Complete"
     - Enter refund reference
     - ✅ Verify status changes to "completed"

6. **Verify Completion**
   - ✅ Verify refund status is "completed"
   - ✅ Verify notification sent to guest (check email)
   - ✅ Verify booking status updated
   - ✅ Verify audit log entries created

#### Test Scenario 2: Admin Rejection with Comments

**Objective**: Test rejection workflow and comment system

**Steps**:

1. **Create Refund Request** (as guest)
   - Request refund for booking within cancellation window
   - Reason: "Changed travel plans"

2. **Admin Reviews Request**
   - Login as admin
   - View refund details
   - Add internal comment: "Check cancellation policy - may not be eligible"
   - ✅ Verify internal comment visible to admins only

3. **Admin Rejects Request**
   - Click "Reject" button
   - Enter customer notes: "Refund cannot be approved as check-in date is within 3 days..."
   - Enter internal notes: "Outside policy window"
   - Click "Save"
   - ✅ Verify status changed to "rejected"
   - ✅ Verify notification sent to guest

4. **Guest Responds**
   - Login as guest
   - View refund details
   - ✅ Verify rejection reason visible
   - ✅ Verify internal admin notes NOT visible
   - Add comment: "Can you provide more details on the policy?"
   - ✅ Verify notification sent to admin

5. **Admin Responds**
   - Login as admin
   - View comments
   - Add non-internal comment: "According to our policy, cancellations within 3 days are not eligible..."
   - ✅ Verify notification sent to guest

6. **Guest Views Response**
   - Login as guest
   - ✅ Verify admin response visible

#### Test Scenario 3: Multi-Payment Method Refund

**Objective**: Test proportional refund calculation across multiple payment methods

**Prerequisites**:
- Booking paid with:
  - 50% card (Paystack)
  - 30% PayPal
  - 20% EFT

**Steps**:

1. **Create and Approve Refund**
   - Guest requests 80% refund
   - Admin approves 80% refund

2. **Process Refund**
   - Click "Process Refund"
   - ✅ Verify breakdown shows:
     - Card: 40% of original card payment
     - PayPal: 24% of original PayPal payment
     - EFT: 16% of original EFT payment
   - Process card refund (automatic)
   - ✅ Verify Paystack API called
   - ✅ Verify gateway_refund_id recorded
   - Process PayPal refund (automatic)
   - ✅ Verify PayPal API called
   - ✅ Verify refund_id recorded
   - Mark EFT refund as complete (manual)
   - ✅ Verify manual refund reference recorded

3. **Verify Completion**
   - ✅ Verify all methods show "completed" status
   - ✅ Verify total refunded amount correct
   - ✅ Verify booking balance updated

#### Test Scenario 4: Document Upload and Verification

**Objective**: Test document management workflow

**Steps**:

1. **Guest Uploads Document**
   - Login as guest
   - Navigate to refund details
   - Go to "Documents" tab
   - Click "Upload Document"
   - Select document type: "Receipt"
   - Choose file (receipt.pdf)
   - Enter description: "Receipt showing hotel cancellation"
   - Click "Upload"
   - ✅ Verify document appears with status "pending"
   - ✅ Verify notification sent to admin

2. **Admin Reviews Document**
   - Login as admin
   - Navigate to refund details → Documents tab
   - ✅ Verify document visible
   - Click "Download" to view document
   - Verify document is valid receipt

3. **Admin Verifies Document**
   - Click "Verify" button
   - ✅ Verify status changes to "verified"
   - ✅ Verify notification sent to guest (uploader)

4. **Guest Views Verification**
   - Login as guest
   - Navigate to Documents tab
   - ✅ Verify document shows "verified" badge

5. **Guest Uploads Invalid Document**
   - Upload another document
   - Admin reviews and clicks "Reject"
   - Enter reason: "Document is not legible, please upload clearer version"
   - ✅ Verify status changes to "rejected"
   - ✅ Verify notification sent to guest with rejection reason

6. **Guest Re-uploads**
   - Guest uploads new clearer document
   - Admin verifies
   - ✅ Verify new document accepted

#### Test Scenario 5: Refund Status History

**Objective**: Test audit trail functionality

**Steps**:

1. **Create Refund**
   - Guest creates refund request
   - ✅ Verify initial status history entry: null → requested

2. **Admin Approves**
   - Admin approves refund
   - Navigate to "History" tab
   - ✅ Verify entry: requested → approved
   - ✅ Verify changed_by is admin user
   - ✅ Verify timestamp recorded

3. **Process Refund**
   - Admin processes refund
   - ✅ Verify entry: approved → processing
   - ✅ Verify changed_by is admin user

4. **Complete Refund**
   - Refund completes (via webhook or manual)
   - ✅ Verify entry: processing → completed
   - ✅ Verify final timestamp

5. **View Full Timeline**
   - Navigate to "Activity" tab
   - ✅ Verify unified view showing:
     - All status changes
     - All comments
     - Sorted chronologically
     - Actor names and roles displayed

### Load Testing

#### Concurrent Refund Processing Test

**Objective**: Verify system can handle multiple simultaneous refund processing requests

**Steps**:

1. Create 10 approved refunds
2. Simultaneously trigger processing for all 10
3. Monitor:
   - Gateway API rate limits
   - Database connection pool
   - Notification queue
   - Error logs
4. ✅ Verify all refunds process successfully
5. ✅ Verify no race conditions or deadlocks

#### High Volume Notification Test

**Objective**: Verify notification system handles bulk refund operations

**Steps**:

1. Create 100 refund requests
2. Bulk approve all requests
3. Monitor:
   - Notification queue depth
   - Email delivery rate
   - Database INSERT performance
4. ✅ Verify all notifications sent
5. ✅ Verify no lost notifications

---

## Deployment

### Pre-Deployment Checklist

- [ ] All migrations applied to production database
- [ ] Notification templates created in production
- [ ] Permissions assigned to user types
- [ ] RLS policies enabled and tested
- [ ] Paystack API keys configured (production mode)
- [ ] PayPal API keys configured (production mode)
- [ ] Webhook endpoints registered with gateways
- [ ] Environment variables set (DASHBOARD_URL, PORTAL_URL)
- [ ] Supabase Storage bucket created (`refund-documents`)
- [ ] Storage RLS policies configured
- [ ] Email templates reviewed and approved
- [ ] Frontend build tested with production API

### Environment Variables Required

**Backend (.env)**:
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# URLs
DASHBOARD_URL=https://admin.yourdomain.com
PORTAL_URL=https://portal.yourdomain.com

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=live  # or 'sandbox'
```

### Migration Deployment Steps

**Step 1: Backup Database**
```bash
# Create full database backup
pg_dump -h your-db-host -U postgres -d your-database > backup_pre_refunds.sql
```

**Step 2: Apply Migrations (in order)**
```sql
-- Apply in Supabase SQL Editor
\i migrations/044_create_credit_notes_schema.sql
\i migrations/045_add_refund_comments_and_history_FIXED.sql
\i migrations/046_add_refund_documents_FIXED.sql
\i migrations/080_create_refund_notification_templates.sql
\i migrations/081_create_refund_rls_policies.sql
```

**Step 3: Verify Tables Created**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'refund%';

-- Expected output:
-- refund_requests
-- refund_comments
-- refund_status_history
-- refund_documents
```

**Step 4: Verify Permissions**
```sql
SELECT * FROM permissions WHERE resource = 'refunds';

-- Expected output:
-- refunds.read
-- refunds.manage
```

**Step 5: Assign Permissions to User Types**
```sql
-- Get permission IDs
SELECT id, resource, action FROM permissions WHERE resource = 'refunds';

-- Assign to super_admin and admin (replace UUIDs with actual IDs)
INSERT INTO user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM user_types ut, permissions p
WHERE ut.name IN ('super_admin', 'admin')
  AND p.resource = 'refunds';
```

**Step 6: Create Storage Bucket**

Via Supabase Dashboard:
1. Navigate to Storage
2. Create new bucket: `refund-documents`
3. Set to private
4. Apply RLS policies (from migration 046)

**Step 7: Register Webhooks**

**Paystack**:
1. Login to Paystack Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://api.yourdomain.com/api/webhooks/paystack/refund`
4. Copy webhook secret to `.env` as `PAYSTACK_WEBHOOK_SECRET`

**PayPal**:
1. Login to PayPal Developer Dashboard
2. Apps & Credentials → Your App → Webhooks
3. Add webhook URL: `https://api.yourdomain.com/api/webhooks/paypal/refund`
4. Subscribe to event: `PAYMENT.CAPTURE.REFUNDED`
5. Copy webhook ID to `.env` as `PAYPAL_WEBHOOK_ID`

**Step 8: Deploy Backend**
```bash
cd backend
npm run build
npm run start  # or use PM2, Docker, etc.
```

**Step 9: Deploy Frontend**
```bash
cd frontend
npm run build
# Deploy build/ folder to hosting (Vercel, Netlify, etc.)
```

**Step 10: Smoke Test**
1. Create test refund request
2. Approve and process
3. Verify notifications sent
4. Verify webhook callbacks work

### Rollback Plan

If issues are encountered:

**Step 1: Stop Processing New Refunds**
```sql
-- Temporarily disable refund creation by revoking INSERT permission
REVOKE INSERT ON refund_requests FROM authenticated;
```

**Step 2: Restore Database from Backup**
```bash
psql -h your-db-host -U postgres -d your-database < backup_pre_refunds.sql
```

**Step 3: Rollback Migrations (Reverse Order)**
```sql
-- Drop tables and objects created by migrations
DROP TABLE IF EXISTS refund_documents CASCADE;
DROP TABLE IF EXISTS refund_status_history CASCADE;
DROP TABLE IF EXISTS refund_comments CASCADE;
DROP TABLE IF EXISTS refund_requests CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS track_refund_status_change CASCADE;
DROP FUNCTION IF EXISTS get_refund_activity_count CASCADE;

-- Drop notification templates
DELETE FROM notification_templates WHERE template_key LIKE 'refund_%';
```

**Step 4: Redeploy Previous Backend Version**

### Post-Deployment Monitoring

**Metrics to Monitor**:
1. Refund request creation rate
2. Approval/rejection ratio
3. Gateway API success rate (Paystack, PayPal)
4. Notification delivery rate
5. Average time from request to completion
6. Failed refund count and reasons

**Logs to Monitor**:
1. Gateway API errors
2. Webhook callback failures
3. Notification sending failures
4. RLS policy violations (should be rare)
5. Database query performance

**Alerts to Configure**:
1. High failed refund rate (>5%)
2. Gateway API errors (>1% failure rate)
3. Notification failures (>2%)
4. Webhook callback delays (>5 minutes)
5. Slow database queries (>1 second)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Refund Request Creation Fails

**Symptom**: Guest receives "VALIDATION_ERROR" when creating refund

**Possible Causes**:
1. Booking is not eligible for refund (status not `confirmed`)
2. Requested amount exceeds booking total
3. Booking already has a completed refund
4. User is not the booking guest

**Solution**:
```typescript
// Check booking eligibility
const { data: booking } = await supabase
  .from('bookings')
  .select('id, status, total_amount, guest_id')
  .eq('id', bookingId)
  .single();

// Validate
if (booking.status !== 'confirmed') {
  throw new Error('Booking must be in confirmed status');
}

if (booking.guest_id !== userId) {
  throw new Error('User is not the booking guest');
}

// Check for existing refund
const { data: existingRefund } = await supabase
  .from('refund_requests')
  .select('id, status')
  .eq('booking_id', bookingId)
  .in('status', ['requested', 'approved', 'processing', 'completed'])
  .single();

if (existingRefund) {
  throw new Error('Booking already has an active refund');
}
```

#### Issue 2: RLS Policy Blocks Guest Access

**Symptom**: Guest receives empty array when fetching their refunds

**Possible Cause**: RLS policy not correctly filtering by auth.uid()

**Solution**:
```sql
-- Check current user ID
SELECT auth.uid();

-- Check if policy allows access
SELECT *
FROM refund_requests
WHERE requested_by = auth.uid();

-- If empty but refunds exist, check policy
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'refund_requests';

-- Recreate policy if needed
DROP POLICY IF EXISTS "Guests can view own refund requests" ON refund_requests;
CREATE POLICY "Guests can view own refund requests"
  ON refund_requests FOR SELECT
  USING (requested_by = auth.uid());
```

#### Issue 3: Paystack Refund API Returns Error

**Symptom**: Refund processing fails with Paystack error

**Common Errors**:

1. **"Invalid transaction reference"**
   - **Cause**: gateway_refund_id not matching Paystack transaction
   - **Solution**: Verify transaction reference format
   ```typescript
   // Correct format: Use transaction reference from payment record
   const { data: payment } = await supabase
     .from('booking_payments')
     .select('payment_reference')
     .eq('id', paymentId)
     .single();

   await refundPaystackTransaction(
     payment.payment_reference,  // Use this, not payment ID
     amount,
     currency
   );
   ```

2. **"Insufficient balance"**
   - **Cause**: Paystack account doesn't have funds
   - **Solution**: Wait for settlement or contact Paystack support

3. **"Refund already processed"**
   - **Cause**: Duplicate refund attempt
   - **Solution**: Check if refund already exists
   ```sql
   SELECT * FROM refund_requests
   WHERE gateway_refund_id IS NOT NULL
     AND booking_id = 'booking-uuid';
   ```

#### Issue 4: Notifications Not Sending

**Symptom**: User doesn't receive refund notification emails

**Debugging Steps**:

1. **Check Notification Record Created**
   ```sql
   SELECT * FROM notifications
   WHERE template_name = 'refund_approved'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Check User Email Address**
   ```sql
   SELECT email, notification_preferences
   FROM users
   WHERE id = 'user-uuid';
   ```

3. **Check Notification Preferences**
   ```sql
   SELECT * FROM notification_preferences
   WHERE user_id = 'user-uuid'
     AND channel = 'email';
   ```

4. **Check Email Sending Logs**
   ```typescript
   // In notifications.service.ts
   logger.info('Email sent successfully', {
     notification_id: notification.id,
     recipient: user.email,
     template: template_key,
   });
   ```

5. **Verify SMTP Configuration**
   ```bash
   # Check environment variables
   echo $SMTP_HOST
   echo $SMTP_PORT
   echo $SMTP_USER
   ```

**Solution**:
- If notification record doesn't exist: Check `sendNotification()` is being called
- If user has email opt-out: Respect user preference or update if needed
- If SMTP error: Verify email service credentials and configuration

#### Issue 5: Webhook Not Triggering

**Symptom**: Refund stays in "processing" status indefinitely

**Debugging Steps**:

1. **Check Webhook Registration**
   - Paystack: Dashboard → Settings → Webhooks
   - PayPal: Developer Dashboard → Webhooks
   - Verify webhook URL is correct
   - Verify webhook is active

2. **Check Webhook Logs**
   - Paystack: View webhook delivery history
   - PayPal: View webhook events
   - Look for failed deliveries or 4xx/5xx responses

3. **Test Webhook Locally**
   ```bash
   # Use ngrok to expose local server
   ngrok http 3000

   # Update webhook URL to ngrok URL
   https://abc123.ngrok.io/api/webhooks/paystack/refund
   ```

4. **Verify Webhook Signature**
   ```typescript
   // In webhook controller
   console.log('Received webhook:', {
     signature: req.headers['x-paystack-signature'],
     body: req.body,
   });

   const isValid = verifyPaystackWebhook(req);
   console.log('Signature valid:', isValid);
   ```

5. **Check Refund ID Matching**
   ```sql
   SELECT * FROM refund_requests
   WHERE gateway_refund_id = 'rf_abc123';
   ```

**Solution**:
- If webhook URL is wrong: Update in gateway dashboard
- If signature validation fails: Verify webhook secret in `.env`
- If refund not found: Check gateway_refund_id is correctly stored
- If webhook not reaching server: Check firewall/NAT configuration

#### Issue 6: Document Upload Fails

**Symptom**: Document upload returns 400 or 500 error

**Possible Causes**:

1. **Storage Bucket Doesn't Exist**
   ```typescript
   // Check bucket exists
   const { data: buckets } = await supabase.storage.listBuckets();
   console.log('Buckets:', buckets);
   // Should include 'refund-documents'
   ```

2. **RLS Policy Blocks Upload**
   ```sql
   -- Check storage policies
   SELECT * FROM storage.policies
   WHERE bucket_id = 'refund-documents';
   ```

3. **File Size Exceeds Limit**
   ```typescript
   // Check file size (max 10MB)
   if (file.size > 10 * 1024 * 1024) {
     throw new Error('File size exceeds 10MB limit');
   }
   ```

4. **Invalid File Type**
   ```typescript
   // Check allowed MIME types
   const allowedTypes = [
     'application/pdf',
     'image/jpeg',
     'image/png',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   ];

   if (!allowedTypes.includes(file.mimetype)) {
     throw new Error('Invalid file type');
   }
   ```

**Solution**:
```typescript
// Create bucket if missing
const { error: bucketError } = await supabase.storage.createBucket('refund-documents', {
  public: false,
  fileSizeLimit: 10485760, // 10MB
});

// Upload with proper path
const filePath = `${refundRequestId}/${Date.now()}-${file.originalname}`;
const { data, error } = await supabase.storage
  .from('refund-documents')
  .upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

if (error) {
  console.error('Upload error:', error);
  throw new Error('Failed to upload document');
}
```

#### Issue 7: Proportional Refund Calculation Incorrect

**Symptom**: Refund amounts don't add up to approved amount

**Debugging**:
```typescript
// Log calculation
const totalBookingAmount = 2000;
const approvedAmount = 1500;
const paymentAmount = 1000;

const proportionalRefund = (approvedAmount / totalBookingAmount) * paymentAmount;
console.log({
  totalBookingAmount,
  approvedAmount,
  paymentAmount,
  proportionalRefund,
  expectedPercentage: (proportionalRefund / paymentAmount) * 100,
});

// Expected: 750 (75% of 1000)
```

**Common Issue**: Rounding errors with multiple payments

**Solution**:
```typescript
// Use precise decimal calculation
const BigNumber = require('bignumber.js');

const calculateProportionalRefund = (
  approvedAmount: number,
  paymentAmount: number,
  totalAmount: number
): number => {
  const approved = new BigNumber(approvedAmount);
  const payment = new BigNumber(paymentAmount);
  const total = new BigNumber(totalAmount);

  const proportional = approved.dividedBy(total).multipliedBy(payment);

  return proportional.toNumber();
};

// Adjust last payment to account for rounding
const adjustLastPayment = (refunds: number[], approvedAmount: number): number[] => {
  const total = refunds.reduce((sum, r) => sum + r, 0);
  const diff = approvedAmount - total;

  if (diff !== 0) {
    refunds[refunds.length - 1] += diff;
  }

  return refunds;
};
```

#### Issue 8: Status History Not Recording

**Symptom**: refund_status_history table is empty or missing entries

**Possible Causes**:
1. Trigger not created
2. Trigger not firing
3. Function has error

**Debugging**:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger
WHERE tgname = 'refund_status_change_trigger';

-- Check function exists
SELECT proname FROM pg_proc
WHERE proname = 'track_refund_status_change';

-- Test function manually
SELECT track_refund_status_change();

-- Check for errors in logs
SELECT * FROM pg_stat_statements
WHERE query LIKE '%track_refund_status_change%';
```

**Solution**:
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS refund_status_change_trigger ON refund_requests;
CREATE TRIGGER refund_status_change_trigger
  AFTER UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION track_refund_status_change();

-- Test by updating status
UPDATE refund_requests
SET status = 'approved'
WHERE id = 'test-refund-uuid';

-- Verify history entry created
SELECT * FROM refund_status_history
WHERE refund_request_id = 'test-refund-uuid'
ORDER BY changed_at DESC;
```

---

## Appendix

### Database ERD

```
┌─────────────────────────────────────┐
│        refund_requests              │
├─────────────────────────────────────┤
│ id (PK)                             │
│ booking_id (FK → bookings)          │
│ requested_by (FK → users)           │
│ status (ENUM)                       │
│ requested_amount                    │
│ approved_amount                     │
│ reason                              │
│ reviewed_by (FK → users)            │
│ processed_by (FK → users)           │
│ refund_breakdown (JSONB)            │
│ method_breakdown (JSONB)            │
│ gateway_refund_id                   │
│ gateway_response (JSONB)            │
│ requested_at, reviewed_at, ...      │
└─────────────────────────────────────┘
           ↓                ↓
┌──────────────────────┐  ┌──────────────────────┐
│  refund_comments     │  │ refund_status_history│
├──────────────────────┤  ├──────────────────────┤
│ id (PK)              │  │ id (PK)              │
│ refund_request_id(FK)│  │ refund_request_id(FK)│
│ user_id (FK)         │  │ from_status          │
│ comment_text         │  │ to_status            │
│ is_internal          │  │ changed_by (FK)      │
│ created_at           │  │ changed_at           │
└──────────────────────┘  │ change_reason        │
           ↓              │ metadata (JSONB)     │
┌──────────────────────┐  └──────────────────────┘
│  refund_documents    │
├──────────────────────┤
│ id (PK)              │
│ refund_request_id(FK)│
│ uploaded_by (FK)     │
│ document_type        │
│ file_name            │
│ file_url             │
│ verification_status  │
│ verified_by (FK)     │
│ uploaded_at          │
└──────────────────────┘
```

### API Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created (refund request, comment, document) |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions or subscription tier |
| 404 | Not Found | Refund request, booking, or resource not found |
| 409 | Conflict | Refund already exists for booking |
| 422 | Unprocessable Entity | Business logic error (e.g., booking not eligible) |
| 500 | Internal Server Error | Unexpected server error, database error |
| 502 | Bad Gateway | Gateway API error (Paystack, PayPal) |
| 503 | Service Unavailable | Gateway temporarily unavailable |

### Currency Formatting

**Function**: `formatCurrency(amount: number, currency: string): string`

**Examples**:
- ZAR: R 1,234.56
- USD: $1,234.56
- EUR: €1,234.56
- GBP: £1,234.56

**Implementation**:
```typescript
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

### Glossary

- **Refund Request**: Initial request from guest to receive money back
- **Approval**: Admin decision to grant refund (may adjust amount)
- **Processing**: Stage where payment gateway refunds are initiated
- **Completion**: Final stage when all refunds are successfully processed
- **Internal Comment**: Admin-only note not visible to guest
- **Customer Note**: Message visible to guest
- **Proportional Refund**: Refund split across multiple payment methods based on original payment ratios
- **Gateway Refund ID**: Unique identifier from payment gateway (Paystack, PayPal)
- **Manual Refund**: Refund processed outside system (EFT, cash) that requires manual marking as complete
- **RLS (Row Level Security)**: Database-level security restricting data access based on user identity
- **Audit Trail**: Complete history of all status changes and modifications

---

## Support and Maintenance

### Getting Help

- **Technical Issues**: Review troubleshooting section above
- **Bug Reports**: Create issue in project repository
- **Feature Requests**: Submit enhancement proposal
- **Security Issues**: Contact security team immediately

### Maintenance Tasks

**Weekly**:
- Review failed refund reports
- Check gateway API error logs
- Verify notification delivery rate
- Monitor webhook callback failures

**Monthly**:
- Review refund approval/rejection ratios
- Analyze average processing time
- Check for orphaned refund requests
- Audit manual refund completion rate

**Quarterly**:
- Review and update notification templates
- Analyze gateway fee structures
- Update documentation as needed
- Test disaster recovery procedures

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-14 | Initial implementation guide created | Claude |

---

**END OF IMPLEMENTATION GUIDE**
