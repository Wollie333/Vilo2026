/**
 * Direct script to fix bookings with missing invoices
 * This calls the invoice generation function directly via Supabase RPC
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from command line args or use defaults from backend/.env
const supabaseUrl = process.argv[2] || 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseServiceKey = process.argv[3] || 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Usage: node fix-missing-invoices-direct.js [SUPABASE_URL] [SERVICE_KEY]');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateInvoiceDirectly(booking) {
  console.log(`\n📄 Processing: ${booking.booking_reference}`);
  console.log(`   Guest: ${booking.guest_name}`);
  console.log(`   Amount: R ${booking.total_amount.toFixed(2)}`);

  try {
    // Get full booking details
    const { data: fullBooking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties!inner(id, name, company_id, owner_id)
      `)
      .eq('id', booking.id)
      .single();

    // Get booking rooms separately
    const { data: bookingRooms } = await supabase
      .from('booking_rooms')
      .select('*, room:rooms(name)')
      .eq('booking_id', booking.id);

    // Get addons separately (if table exists)
    let addons = [];
    try {
      const { data: addonsData } = await supabase
        .from('booking_addons')
        .select('addon_id, quantity, unit_price, total_price')
        .eq('booking_id', booking.id);
      if (addonsData) addons = addonsData;
    } catch (e) {
      console.log('   ℹ️  No addons table or no addons for this booking');
    }

    if (fetchError) {
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    // Re-check if invoice was created (race condition)
    if (fullBooking.invoice_id) {
      console.log(`   ℹ️  Invoice already exists (${fullBooking.invoice_id})`);
      return { success: true, alreadyExists: true };
    }

    // Get company/invoice settings
    const companyId = fullBooking.property.company_id;
    const { data: settings } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (!settings) {
      // Try global settings
      const { data: globalSettings } = await supabase
        .from('invoice_settings')
        .select('*')
        .is('company_id', null)
        .single();

      if (!globalSettings) {
        throw new Error('No invoice settings found (neither company nor global)');
      }
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    // Calculate line items
    const lineItems = [];

    // Add rooms
    for (const room of bookingRooms || []) {
      const roomName = room.room?.name || 'Room';
      const nights = fullBooking.total_nights || 1;
      const subtotal = room.price_per_night * nights || 0;

      lineItems.push({
        description: `${roomName} - ${nights} night(s)`,
        quantity: 1,
        unit_price_cents: Math.round(subtotal * 100),
        total_cents: Math.round(subtotal * 100),
      });
    }

    // Add addons
    for (const addon of addons) {
      lineItems.push({
        description: 'Add-on',
        quantity: addon.quantity,
        unit_price_cents: Math.round((addon.unit_price || 0) * 100),
        total_cents: Math.round((addon.total_price || 0) * 100),
      });
    }

    const totalCents = Math.round(fullBooking.total_amount * 100);

    // Get company details
    let companyName = settings?.company_name || 'Vilo';
    let companyAddress = settings?.company_address;
    let companyEmail = settings?.company_email;
    let companyPhone = settings?.company_phone;
    let vatNumber = settings?.vat_number;
    let regNumber = settings?.registration_number;

    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (company) {
        companyName = company.display_name || company.name;
        const fullAddress = [
          company.address_street,
          company.address_city,
          company.address_state,
          company.address_postal_code,
          company.address_country,
        ].filter(Boolean).join(', ');
        if (fullAddress) companyAddress = fullAddress;
        if (company.contact_email) companyEmail = company.contact_email;
        if (company.contact_phone) companyPhone = company.contact_phone;
        if (company.vat_number) vatNumber = company.vat_number;
        if (company.registration_number) regNumber = company.registration_number;
      }
    }

    // Create invoice (minimal fields based on migration 026)
    // Use property owner's ID as user_id since bookings don't have user_id
    const userId = fullBooking.user_id || fullBooking.property.owner_id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        company_id: companyId,
        user_id: userId,
        status: 'paid',

        // Customer info
        customer_name: fullBooking.guest_name,
        customer_email: fullBooking.guest_email,

        // Company info
        company_name: companyName,
        company_address: companyAddress,
        company_email: companyEmail,
        company_phone: companyPhone,
        company_vat_number: vatNumber,
        company_registration_number: regNumber,

        // Financial
        line_items: lineItems,
        subtotal_cents: totalCents,
        tax_cents: 0,
        tax_rate: 0,
        total_cents: totalCents,
        currency: fullBooking.currency || 'ZAR',

        // Notes
        notes: `Generated for booking: ${fullBooking.booking_reference} | Property: ${fullBooking.property.name}`,
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        invoice_id: invoice.id,
        invoice_generated_at: new Date().toISOString(),
      })
      .eq('id', fullBooking.id);

    if (updateError) {
      console.warn(`   ⚠️  Invoice created but failed to update booking: ${updateError.message}`);
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: fullBooking.property.owner_id,
      action: 'invoice.manually_generated',
      entity_type: 'invoice',
      entity_id: invoice.id,
      new_data: {
        booking_id: fullBooking.id,
        booking_reference: fullBooking.booking_reference,
        invoice_number: invoiceNumber,
        generated_by: 'fix_script',
      },
    });

    console.log(`   ✅ Invoice created: ${invoiceNumber} (${invoice.id})`);
    console.log(`   📋 Booking updated with invoice reference`);

    return { success: true, invoiceNumber, invoiceId: invoice.id };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Fix Missing Invoices (Direct Mode)');
  console.log('==========================================\n');

  // Find bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_name,
      guest_email,
      total_amount,
      payment_status,
      invoice_id,
      property:properties!inner(id, name)
    `)
    .eq('payment_status', 'paid')
    .is('invoice_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to query bookings:', error);
    process.exit(1);
  }

  if (!bookings || bookings.length === 0) {
    console.log('✅ No bookings need fixing!\n');
    return;
  }

  console.log(`Found ${bookings.length} booking(s) to fix\n`);

  // Process each booking
  const results = [];
  for (const booking of bookings) {
    const result = await generateInvoiceDirectly(booking);
    results.push({ booking: booking.booking_reference, ...result });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n==========================================');
  console.log('  Summary');
  console.log('==========================================\n');

  const successful = results.filter(r => r.success && !r.alreadyExists).length;
  const alreadyExisted = results.filter(r => r.alreadyExists).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully generated: ${successful}`);
  if (alreadyExisted > 0) console.log(`ℹ️  Already existed: ${alreadyExisted}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}\n`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.booking}: ${r.error}`);
    });
  }

  console.log('\n✅ Complete!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
