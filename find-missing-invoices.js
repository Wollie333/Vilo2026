/**
 * Simple script to find bookings with missing invoices
 * Run this first to identify the bookings that need fixing
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from command line args or use defaults from backend/.env
const supabaseUrl = process.argv[2] || 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseServiceKey = process.argv[3] || 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Usage: node find-missing-invoices.js [SUPABASE_URL] [SERVICE_KEY]');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('==========================================');
  console.log('  Find Bookings with Missing Invoices');
  console.log('==========================================\n');

  console.log('🔍 Querying database...\n');

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_name,
      guest_email,
      check_in_date,
      check_out_date,
      total_amount,
      payment_status,
      invoice_id,
      created_at,
      property:properties!inner(id, name, owner_id, company_id)
    `)
    .eq('payment_status', 'paid')
    .is('invoice_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying bookings:', error);
    process.exit(1);
  }

  if (!bookings || bookings.length === 0) {
    console.log('✅ No bookings found with missing invoices!');
    console.log('   All paid bookings have invoices generated.\n');
    return;
  }

  console.log(`📊 Found ${bookings.length} paid booking(s) without invoices:\n`);
  console.log('==========================================\n');

  bookings.forEach((booking, index) => {
    console.log(`${index + 1}. Booking Reference: ${booking.booking_reference}`);
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   Guest: ${booking.guest_name} (${booking.guest_email})`);
    console.log(`   Dates: ${booking.check_in_date} to ${booking.check_out_date}`);
    console.log(`   Amount: R ${booking.total_amount.toFixed(2)}`);
    console.log(`   Property: ${booking.property.name} (ID: ${booking.property.id})`);
    console.log(`   Company ID: ${booking.property.company_id || 'None'}`);
    console.log(`   Owner ID: ${booking.property.owner_id}`);
    console.log(`   Created: ${new Date(booking.created_at).toLocaleString()}`);
    console.log(`   Status: ${booking.payment_status}`);
    console.log('');
  });

  console.log('==========================================');
  console.log('Next Steps:');
  console.log('==========================================\n');
  console.log('Option 1: Use the manual generation endpoint');
  console.log('  For each booking ID above, call:');
  console.log('  POST http://localhost:3001/api/invoices/admin/bookings/{BOOKING_ID}/generate\n');

  console.log('Option 2: Run the fix script');
  console.log('  node fix-missing-invoices-direct.js\n');

  // Generate curl commands for easy copy-paste
  console.log('==========================================');
  console.log('Quick Fix Commands (if backend is running):');
  console.log('==========================================\n');
  console.log('Copy and paste these commands (replace {TOKEN} with your admin JWT):\n');

  bookings.forEach((booking) => {
    console.log(`# ${booking.booking_reference} - ${booking.guest_name}`);
    console.log(`curl -X POST "http://localhost:3001/api/invoices/admin/bookings/${booking.id}/generate" \\`);
    console.log(`  -H "Authorization: Bearer {TOKEN}" \\`);
    console.log(`  -H "Content-Type: application/json"\n`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
