# Manual Storage Bucket Creation

**IMPORTANT:** Storage buckets CANNOT be created via SQL in Supabase. You must create them manually through the Supabase Dashboard.

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Navigate to your project: https://supabase.com/dashboard
- Select your Vilo project

### 2. Open Storage Section
- Click **Storage** in the left sidebar
- Click **Create a new bucket** button

### 3. Configure the Bucket
**Bucket name:** `payment-proofs`

**Settings:**
- ✅ **Private bucket** (not public)
- ✅ File size limit: `5 MB` (5242880 bytes)
- ✅ Allowed MIME types:
  - `application/pdf`
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`

### 4. Click "Create bucket"

### 5. Then Run the RLS Policies Migration
After the bucket is created, run migration `079_create_payment_proofs_rls_policies.sql` in the SQL Editor to set up the security policies.

---

## Bucket Configuration Summary

```
Name: payment-proofs
Public: No (private, requires authentication)
File size limit: 5 MB
Allowed file types:
  - PDF files (application/pdf)
  - JPEG images (image/jpeg, image/jpg)
  - PNG images (image/png)
  - WebP images (image/webp)
```

---

## What This Bucket Is For

This bucket stores payment proof uploads for EFT (bank transfer) bookings:
- Guests upload proof of payment (bank transfer receipts, screenshots)
- Property owners can view and verify these proofs
- Files are secured with Row Level Security (RLS) policies
- Only authorized users (guest who made booking, property owner) can access files

---

## Security (RLS Policies)

After creating the bucket, the RLS policies (from migration 079) will ensure:
1. ✅ Guests can only upload proofs for their own bookings
2. ✅ Guests can only view their own payment proofs
3. ✅ Property owners can view proofs for bookings at their properties
4. ✅ Property owners can delete proofs (for re-upload scenarios)
5. ✅ Admins can view all payment proofs

---

## Verification

After bucket creation, verify it exists:
1. Go to Storage → Buckets
2. You should see `payment-proofs` in the list
3. Click on it to verify settings match above
