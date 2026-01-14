/**
 * Script to fix bookings with missing invoices
 * Finds paid bookings without invoices and generates them
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findBookingsWithoutInvoices() {
  console.log('🔍 Searching for paid bookings without invoices...\n');

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
      property:properties!inner(id, name, owner_id)
    `)
    .eq('payment_status', 'paid')
    .is('invoice_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying bookings:', error);
    throw error;
  }

  return bookings || [];
}

async function generateInvoiceForBooking(booking) {
  console.log(`\n📄 Generating invoice for booking: ${booking.booking_reference}`);
  console.log(`   Guest: ${booking.guest_name} (${booking.guest_email})`);
  console.log(`   Dates: ${booking.check_in_date} to ${booking.check_out_date}`);
  console.log(`   Amount: R ${booking.total_amount.toFixed(2)}`);
  console.log(`   Property: ${booking.property.name}`);

  try {
    // Call the RPC function to generate invoice
    // We'll use a direct approach by calling the invoice generation logic

    // First, get the booking with full details
    const { data: fullBooking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties!inner(id, name, company_id, owner_id),
        rooms:booking_rooms(
          room_id,
          unit_number,
          guest_count,
          room_subtotal,
          room:rooms(id, name, price_per_night)
        ),
        addons:booking_addons(
          addon_id,
          quantity,
          unit_price,
          total_price,
          addon:addons(id, name)
        ),
        payments:booking_payments(
          id,
          amount,
          payment_method,
          payment_date,
          payment_reference
        )
      `)
      .eq('id', booking.id)
      .single();

    if (fetchError || !fullBooking) {
      throw new Error(`Failed to fetch full booking details: ${fetchError?.message}`);
    }

    // Check if invoice was already created (race condition check)
    if (fullBooking.invoice_id) {
      console.log(`   ℹ️  Invoice already exists: ${fullBooking.invoice_id}`);
      return { success: true, alreadyExists: true, invoiceId: fullBooking.invoice_id };
    }

    // We need to call the backend endpoint or use the service directly
    // Since we're in a Node.js script, we'll make an HTTP request to the backend
    const backendUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // For this script, we'll need to authenticate as the property owner
    // Get the property owner's user to generate a JWT token
    const { data: ownerData, error: ownerError } = await supabase.auth.admin.getUserById(
      fullBooking.property.owner_id
    );

    if (ownerError) {
      throw new Error(`Failed to get owner user: ${ownerError.message}`);
    }

    // Generate a short-lived session for the owner
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerData.user.email,
    });

    if (sessionError) {
      throw new Error(`Failed to generate session: ${sessionError.message}`);
    }

    // Make HTTP request to the endpoint
    const fetch = require('node-fetch');
    const response = await fetch(
      `${backendUrl}/api/invoices/admin/bookings/${booking.id}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // We'll use service role key for admin access instead
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to generate invoice');
    }

    console.log(`   ✅ Invoice generated: ${result.data.invoice.invoice_number}`);
    console.log(`   📋 Invoice ID: ${result.data.invoice.id}`);

    return {
      success: true,
      invoiceId: result.data.invoice.id,
      invoiceNumber: result.data.invoice.invoice_number,
    };

  } catch (error) {
    console.error(`   ❌ Failed to generate invoice: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Fix Missing Invoices Script');
  console.log('==========================================\n');

  try {
    // Find bookings without invoices
    const bookings = await findBookingsWithoutInvoices();

    if (bookings.length === 0) {
      console.log('✅ No bookings found with missing invoices!');
      console.log('   All paid bookings have invoices generated.\n');
      return;
    }

    console.log(`📊 Found ${bookings.length} paid booking(s) without invoices:\n`);

    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.booking_reference} - ${booking.guest_name}`);
      console.log(`   Amount: R ${booking.total_amount.toFixed(2)} | Created: ${new Date(booking.created_at).toLocaleDateString()}`);
    });

    console.log('\n==========================================');
    console.log('Starting invoice generation...');
    console.log('==========================================');

    // Generate invoices for each booking
    const results = [];
    for (const booking of bookings) {
      const result = await generateInvoiceForBooking(booking);
      results.push({
        booking: booking.booking_reference,
        ...result,
      });
    }

    // Summary
    console.log('\n==========================================');
    console.log('  Summary');
    console.log('==========================================\n');

    const successful = results.filter(r => r.success && !r.alreadyExists).length;
    const alreadyExisted = results.filter(r => r.alreadyExists).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successfully generated: ${successful}`);
    if (alreadyExisted > 0) {
      console.log(`ℹ️  Already existed: ${alreadyExisted}`);
    }
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
      console.log('\nFailed bookings:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.booking}: ${r.error}`);
        });
    }

    console.log('\n✅ Script completed!\n');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
