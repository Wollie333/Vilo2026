# VAT Percentage Save Issue - Debugging Summary

## Problem
VAT percentage field in company settings (http://localhost:5173/manage/companies/{id}#legal) is not persisting to the database. After saving and refreshing the page, the old value returns.

## Changes Made to Add Comprehensive Logging

### 1. Frontend - CompanyDetailPage.tsx
**Location**: `frontend/src/pages/companies/CompanyDetailPage.tsx`

**Added Logging** (lines 191-203):
- Logs full `formData` object before saving
- Logs specific `vat_percentage` value
- Logs refreshed company data after save
- Logs VAT percentage from refreshed data

**Console Output to Look For**:
```
🔵 [CompanyDetailPage] Saving company with data: {...}
🔵 [CompanyDetailPage] VAT Percentage value: 20
✅ [CompanyDetailPage] Company updated successfully
🔵 [CompanyDetailPage] Refreshed company data: {...}
🔵 [CompanyDetailPage] VAT Percentage after refresh: 20
```

### 2. Frontend - API Service
**Location**: `frontend/src/services/api.service.ts`

**Added Logging** (lines 251-259):
- Logs PATCH requests to companies endpoint
- Logs full request body as JSON
- Logs VAT percentage value and its type

**Console Output to Look For**:
```
📡 API PATCH Request to Company: /companies/91cf1762-1b66-4503-a242-d18c2c0d399e
  - Body: {
    "vat_percentage": 20,
    ...
  }
  - VAT Percentage in request: 20
  - VAT Percentage type: number
```

### 3. Backend - Company Controller
**Location**: `backend/src/controllers/company.controller.ts`

**Added Logging** (lines 124-132):
- Logs incoming PATCH request
- Logs company ID and request body
- Logs VAT percentage from request
- Logs returned company data

**Console Output to Look For**:
```
🟢 [CompanyController] PATCH /companies/:id - Received update request
🟢 [CompanyController] Company ID: 91cf1762-1b66-4503-a242-d18c2c0d399e
🟢 [CompanyController] Request body: {...}
🟢 [CompanyController] VAT Percentage in request: 20
✅ [CompanyController] Company updated, returning: {...}
```

### 4. Backend - Company Service (CRITICAL)
**Location**: `backend/src/services/company.service.ts`

**Added Type Conversion & Validation** (lines 257-275):
- Explicitly converts string to number if needed
- Validates the converted value
- Only updates if value is valid
- Logs input type, value, and converted value

**Added Database Verification** (lines 302-324):
- Queries database immediately after update
- Compares expected vs actual value
- Reports any mismatches

**Console Output to Look For**:
```
🟡 [CompanyService] updateCompany called
🟡 [CompanyService] Input received: {...}
🟡 [CompanyService] VAT Percentage in input: 20
🟡 [CompanyService] VAT Percentage input type: number
🟡 [CompanyService] VAT Percentage input value: 20
🟡 [CompanyService] VAT Percentage converted value: 20
🟡 [CompanyService] VAT Percentage is valid number: true
🟡 [CompanyService] VAT Percentage is being updated to: 20
🟡 [CompanyService] Update data being sent to Supabase: {...}
✅ [CompanyService] Supabase update successful, returned data: {...}
✅ [CompanyService] VAT Percentage in returned data: 20
🔍 [CompanyService] Database verification - VAT Percentage: 20
✅ [CompanyService] VAT Percentage verified in database: 20
```

**OR if there's a problem**:
```
❌ [CompanyService] VAT MISMATCH! Expected: 20 Got: 15
```

### 5. Frontend - Company Service
**Location**: `frontend/src/services/company.service.ts`

**Added Cache-Busting** (lines 48-51):
- Adds timestamp parameter to GET request
- Prevents browser from returning cached company data

## How to Test

1. **Open Browser Console** (F12 → Console tab)
2. **Clear Console** (to see only new logs)
3. **Navigate to Company Settings**:
   ```
   http://localhost:5173/manage/companies/91cf1762-1b66-4503-a242-d18c2c0d399e#legal
   ```
4. **Change VAT Percentage** (e.g., from 15 to 20)
5. **Click "Save Changes"**
6. **Observe Console Logs** - You should see logs in this order:
   - 🔵 CompanyDetailPage logs
   - 📡 API Service logs
   - 🟢 CompanyController logs
   - 🟡 CompanyService logs (multiple lines)
   - 🔍 Database verification logs
   - ✅ Success confirmation
7. **Check the page** - Does VAT percentage show the new value?
8. **Refresh the page** (F5)
9. **Check again** - Does VAT percentage still show the new value?

## What the Logs Will Tell Us

### Scenario 1: Frontend Not Sending Value
**Symptoms**:
- 🔵 CompanyDetailPage shows VAT percentage in formData
- 📡 API Service does NOT show vat_percentage in request body

**Root Cause**: Frontend service is filtering out the field
**Fix**: Check `UpdateCompanyData` interface or service logic

### Scenario 2: Backend Not Receiving Value
**Symptoms**:
- 📡 API Service shows vat_percentage in request
- 🟢 CompanyController does NOT show vat_percentage in request body

**Root Cause**: Middleware or route issue
**Fix**: Check route validation or middleware

### Scenario 3: Value Has Wrong Type
**Symptoms**:
- 🟡 CompanyService shows `VAT Percentage input type: string`
- 🟡 Shows `VAT Percentage converted value: NaN`
- ⚠️ Shows `Invalid VAT Percentage value, skipping update`

**Root Cause**: Type conversion issue
**Fix**: Already fixed with explicit parseFloat conversion

### Scenario 4: Supabase Not Saving Value
**Symptoms**:
- 🟡 CompanyService shows value being updated
- ✅ Supabase update successful
- ❌ Database verification shows MISMATCH

**Root Cause**: Database constraint, trigger, or RLS policy blocking update
**Fix**: Check Supabase logs and database constraints

### Scenario 5: Everything Works But Refresh Shows Old Value
**Symptoms**:
- 🟡 CompanyService verification shows correct value
- ✅ Save successful
- 🔵 After refresh, old value appears

**Root Cause**: Browser caching
**Fix**: Already fixed with cache-busting timestamp

## Expected Successful Flow

```
🔵 [CompanyDetailPage] Saving company with data: {vat_percentage: 20, ...}
🔵 [CompanyDetailPage] VAT Percentage value: 20

📡 API PATCH Request to Company: /companies/xxx
  - Body: {"vat_percentage": 20, ...}
  - VAT Percentage in request: 20
  - VAT Percentage type: number

🟢 [CompanyController] PATCH /companies/:id - Received update request
🟢 [CompanyController] VAT Percentage in request: 20

🟡 [CompanyService] VAT Percentage input type: number
🟡 [CompanyService] VAT Percentage input value: 20
🟡 [CompanyService] VAT Percentage converted value: 20
🟡 [CompanyService] VAT Percentage is being updated to: 20

✅ [CompanyService] Supabase update successful
✅ [CompanyService] VAT Percentage in returned data: 20

🔍 [CompanyService] Database verification - VAT Percentage: 20
✅ [CompanyService] VAT Percentage verified in database: 20

✅ [CompanyDetailPage] Company updated successfully
🔵 [CompanyDetailPage] VAT Percentage after refresh: 20
```

## Database Schema Verification

**Column Definition** (from migration 115):
```sql
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS vat_percentage DECIMAL(5,2)
DEFAULT 15.00
CHECK (vat_percentage >= 0 AND vat_percentage <= 100);
```

**Valid Values**:
- Any decimal number between 0 and 100
- Up to 2 decimal places
- Examples: 0, 15, 15.50, 20, 20.00, 100

**To Manually Check Database**:
1. Open Supabase Dashboard
2. Go to Table Editor → companies
3. Find your company row (id: 91cf1762-1b66-4503-a242-d18c2c0d399e)
4. Check the `vat_percentage` column value
5. After save, refresh the table view and check again

## Next Steps

1. Run the test outlined above
2. Copy all console logs
3. Share the logs to identify exactly where the issue is occurring
4. Based on the logs, we'll know which scenario applies and can fix accordingly
