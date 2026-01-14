/**
 * Seed Payment Integrations
 * Initializes payment provider configurations (Paystack, PayPal, EFT)
 *
 * Usage:
 *   cd backend
 *   ts-node seeds/seed-payment-integrations.ts
 *
 * Environment Variables Required:
 *   - PAYSTACK_PUBLIC_KEY
 *   - PAYSTACK_SECRET_KEY
 *   - PAYSTACK_WEBHOOK_SECRET
 *   - PAYPAL_CLIENT_ID
 *   - PAYPAL_CLIENT_SECRET
 *   - PAYPAL_WEBHOOK_ID
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getAdminClient } from '../src/config/supabase';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function seedPaymentIntegrations() {
  console.log('🔧 Seeding payment integrations...\n');

  const supabase = getAdminClient();

  const integrations = [
    {
      provider: 'paystack',
      display_name: 'Paystack',
      description: 'Card payments, bank transfers, and mobile money (Africa)',
      is_enabled: true, // Enable by default
      is_primary: true, // Set as primary
      environment: process.env.PAYSTACK_ENVIRONMENT || 'test',
      config: {
        public_key: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_...',
        secret_key: process.env.PAYSTACK_SECRET_KEY || 'sk_test_...',
      },
      webhook_secret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
      supported_currencies: ['ZAR', 'NGN', 'GHS', 'KES', 'USD'],
      verification_status: process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY ? 'pending' : 'unverified',
    },
    {
      provider: 'paypal',
      display_name: 'PayPal',
      description: 'Global payment processing with PayPal accounts and cards',
      is_enabled: true, // Enable by default
      is_primary: false,
      environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
      config: {
        client_id: process.env.PAYPAL_CLIENT_ID || 'sb_...',
        client_secret: process.env.PAYPAL_CLIENT_SECRET || 'secret_...',
      },
      webhook_secret: process.env.PAYPAL_WEBHOOK_ID || '', // PayPal webhook ID
      supported_currencies: ['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD'],
      verification_status: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? 'pending' : 'unverified',
    },
    {
      provider: 'eft',
      display_name: 'EFT / Bank Transfer',
      description: 'Direct bank transfer with manual verification',
      is_enabled: true,
      is_primary: false,
      environment: 'live',
      config: {
        bank_name: process.env.EFT_BANK_NAME || 'First National Bank',
        account_number: process.env.EFT_ACCOUNT_NUMBER || '62812345678',
        branch_code: process.env.EFT_BRANCH_CODE || '250655',
        account_holder: process.env.EFT_ACCOUNT_HOLDER || 'Vilo (Pty) Ltd',
        reference_prefix: 'VILO',
        instructions: 'Please use the reference number provided for payment identification.',
      },
      webhook_secret: null,
      supported_currencies: ['ZAR'],
      verification_status: 'verified', // EFT doesn't need API verification
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const integration of integrations) {
    try {
      const { error } = await supabase
        .from('payment_integrations')
        .upsert(integration, { onConflict: 'provider' });

      if (error) {
        console.error(`❌ Error seeding ${integration.provider}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded ${integration.provider} (${integration.display_name})`);
        console.log(`   Environment: ${integration.environment}`);
        console.log(`   Enabled: ${integration.is_enabled}`);
        console.log(`   Verification: ${integration.verification_status}`);
        console.log('');
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${integration.provider}:`, error);
      errorCount++;
    }
  }

  console.log('='.repeat(70));
  console.log('SEEDING SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total: ${integrations.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('');

  if (errorCount === 0) {
    console.log('🎉 Payment integrations seeded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Configure API credentials in admin UI (/admin/settings/billing)');
    console.log('2. Test connections for each provider');
    console.log('3. Register webhook URLs with providers:');
    console.log('   - Paystack: https://dashboard.paystack.com/#/settings/developer');
    console.log('   - PayPal: https://developer.paypal.com/dashboard/webhooks');
  } else {
    console.log('⚠️  Some integrations failed to seed. Check errors above.');
    process.exit(1);
  }
}

// Run the seed
seedPaymentIntegrations()
  .then(() => {
    console.log('✨ Seeding complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
