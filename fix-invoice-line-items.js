/**
 * Fix line items for invoices that were generated with incorrect pricing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseServiceKey = 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInvoice(invoiceId, bookingId) {
  console.log(`\n📄 Fixing invoice: ${invoiceId}`);

  // Get booking with rooms and addons
  const { data: booking } = await supabase
    .from('bookings')
    .select('booking_reference, total_nights, total_amount, currency')
    .eq('id', bookingId)
    .single();

  const { data: rooms } = await supabase
    .from('booking_rooms')
    .select('room_id, room_name, room_subtotal, adults, children, pricing_mode')
    .eq('booking_id', bookingId);

  // Get room descriptions
  const roomIds = rooms.map(r => r.room_id);
  const { data: roomDetails } = await supabase
    .from('rooms')
    .select('id, description')
    .in('id', roomIds);

  // Map descriptions to rooms
  const roomDescMap = {};
  roomDetails?.forEach(rd => {
    roomDescMap[rd.id] = rd.description;
  });

  const { data: addons } = await supabase
    .from('booking_addons')
    .select('addon_name, quantity, unit_price, addon_total')
    .eq('booking_id', bookingId);

  console.log(`   Booking: ${booking.booking_reference}`);
  console.log(`   Total: R ${booking.total_amount.toFixed(2)}`);
  console.log(`   Rooms: ${rooms.length}, Addons: ${addons?.length || 0}`);

  // Build correct line items
  const lineItems = [];

  // Add room line items
  for (const room of rooms || []) {
    const roomDesc = roomDescMap[room.room_id];
    const guestInfo = room.pricing_mode === 'per_person_sharing'
      ? ` (${room.adults} adults${room.children > 0 ? `, ${room.children} children` : ''})`
      : '';

    // Build description: Room Name (guests) - Description - Nights
    let description = `${room.room_name}${guestInfo}`;
    if (roomDesc) {
      description += ` - ${roomDesc}`;
    }
    description += ` - ${booking.total_nights} night(s)`;

    lineItems.push({
      description,
      quantity: 1,
      unit_price_cents: Math.round(room.room_subtotal * 100),
      total_cents: Math.round(room.room_subtotal * 100),
    });
  }

  // Add addon line items
  for (const addon of addons || []) {
    lineItems.push({
      description: addon.addon_name,
      quantity: addon.quantity,
      unit_price_cents: Math.round(addon.unit_price * 100),
      total_cents: Math.round(addon.addon_total * 100),
    });
  }

  const totalCents = Math.round(booking.total_amount * 100);

  console.log(`   Line items created: ${lineItems.length}`);
  lineItems.forEach((item, i) => {
    console.log(`     ${i + 1}. ${item.description} - R ${(item.total_cents / 100).toFixed(2)}`);
  });

  // Update invoice
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      line_items: lineItems,
      subtotal_cents: totalCents,
      total_cents: totalCents,
    })
    .eq('id', invoiceId);

  if (updateError) {
    console.error(`   ❌ Failed to update invoice: ${updateError.message}`);
    return false;
  }

  console.log(`   ✅ Invoice updated successfully`);
  return true;
}

async function main() {
  console.log('==========================================');
  console.log('  Fix Invoice Line Items');
  console.log('==========================================');

  const invoices = [
    {
      invoiceId: '1f0c5c78-933f-4033-9b73-9f3cd754165f',
      bookingId: '535730f2-7a32-467f-85e5-586d75c32ab9',
      invoiceNumber: 'INV-2026-0001',
    },
    {
      invoiceId: 'b0b41abf-de95-4bf8-b2e1-61b74c895d22',
      bookingId: '7e474bd6-0068-48aa-ad51-dbacd4683ce7',
      invoiceNumber: 'INV-2026-0002',
    },
  ];

  let successCount = 0;
  for (const inv of invoices) {
    const success = await fixInvoice(inv.invoiceId, inv.bookingId);
    if (success) successCount++;
  }

  console.log('\n==========================================');
  console.log('  Summary');
  console.log('==========================================\n');
  console.log(`✅ Fixed: ${successCount} / ${invoices.length} invoices\n`);

  if (successCount === invoices.length) {
    console.log('🎉 All invoices fixed! PDFs will be regenerated when downloaded.\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
