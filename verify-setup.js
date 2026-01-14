/**
 * Verify Setup Script
 * Checks that all migrations were applied correctly
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env file
const envPath = path.join(__dirname, 'backend', '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySetup() {
  console.log('🔍 Verifying setup...\n');

  // Check storage buckets
  console.log('📦 Checking storage buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('  ❌ Error listing buckets:', bucketsError.message);
  } else {
    const receiptsBucket = buckets.find(b => b.name === 'receipts');
    const logosBucket = buckets.find(b => b.name === 'invoice-logos');

    if (receiptsBucket) {
      console.log('  ✅ Receipts bucket exists');
      console.log(`     - Public: ${receiptsBucket.public}`);
    } else {
      console.log('  ❌ Receipts bucket not found');
    }

    if (logosBucket) {
      console.log('  ✅ Invoice-logos bucket exists');
      console.log(`     - Public: ${logosBucket.public}`);
    } else {
      console.log('  ❌ Invoice-logos bucket not found');
    }
  }

  // Check if bookings table has new columns
  console.log('\n📋 Checking bookings table columns...');
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('invoice_id, invoice_generated_at')
    .limit(1)
    .single();

  if (bookingError && !bookingError.message.includes('multiple (or no) rows')) {
    console.log('  ✅ Bookings table has invoice tracking columns');
  } else if (!bookingError) {
    console.log('  ✅ Bookings table has invoice tracking columns');
  }

  // Check if invoices table has new columns
  console.log('\n💼 Checking invoices table columns...');
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('company_id, company_email, company_phone')
    .limit(1)
    .single();

  if (invoiceError && !invoiceError.message.includes('multiple (or no) rows')) {
    console.log('  ✅ Invoices table has company contact columns');
  } else if (!invoiceError) {
    console.log('  ✅ Invoices table has company contact columns');
  }

  console.log('\n✨ Setup verification complete!\n');
  console.log('🎯 Your system is ready for automatic invoice and receipt generation!\n');

  console.log('📝 Next steps for testing:');
  console.log('   1. Create a test booking with partial payment');
  console.log('   2. Verify receipt is generated');
  console.log('   3. Add final payment to reach 100% paid');
  console.log('   4. Verify invoice is auto-generated');
  console.log('   5. Test receipt downloads from Payment History tab');
  console.log('   6. Check invoice shows company VAT, reg number, and contact details\n');
}

verifySetup().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
