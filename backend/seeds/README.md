# Database Seeds

This directory contains seed scripts to populate the database with initial data.

## Available Seeds

### Payment Integrations

**File:** `seed-payment-integrations.ts`

**Purpose:** Initialize payment provider configurations (Paystack, PayPal, EFT)

**Usage:**
```bash
cd backend
ts-node seeds/seed-payment-integrations.ts
```

**Environment Variables:**

Create a `.env` file in the `backend` directory with the following variables:

```env
# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
PAYSTACK_ENVIRONMENT=test  # or 'live' for production

# PayPal Configuration
PAYPAL_CLIENT_ID=sb_...
PAYPAL_CLIENT_SECRET=secret_...
PAYPAL_WEBHOOK_ID=...  # Webhook ID from PayPal dashboard
PAYPAL_ENVIRONMENT=sandbox  # or 'live' for production

# EFT (Bank Transfer) Configuration (Optional)
EFT_BANK_NAME=First National Bank
EFT_ACCOUNT_NUMBER=62812345678
EFT_BRANCH_CODE=250655
EFT_ACCOUNT_HOLDER=Vilo (Pty) Ltd
```

**What it seeds:**
- Paystack integration with test/live credentials
- PayPal integration with sandbox/live credentials
- EFT (manual bank transfer) integration

**After seeding:**
1. Navigate to `/admin/settings/billing` → Payment Integrations tab
2. Verify credentials are loaded
3. Click "Test Connection" for each provider
4. Configure webhook URLs in provider dashboards:
   - **Paystack:** https://dashboard.paystack.com/#/settings/developer
   - **PayPal:** https://developer.paypal.com/dashboard/webhooks

---

## Creating New Seeds

To create a new seed script:

1. Create a new file: `backend/seeds/seed-<name>.ts`
2. Import Supabase client: `import { getAdminClient } from '../src/config/supabase';`
3. Write seed logic with error handling
4. Export main function and call it
5. Document in this README

**Template:**
```typescript
import { getAdminClient } from '../src/config/supabase';

async function seedMyData() {
  const supabase = getAdminClient();

  // Your seeding logic here

  console.log('✅ Seeding complete');
}

seedMyData().catch(console.error);
```

---

## Notes

- Seeds use `upsert` to avoid duplicate entries
- Always use environment variables for sensitive credentials
- Seeds are idempotent - safe to run multiple times
- Use `getAdminClient()` for admin-level database access
