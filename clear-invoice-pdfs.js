/**
 * Clear invoice PDF URLs to force regeneration with new template
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseServiceKey = 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('==========================================');
  console.log('  Clear Invoice PDFs for Regeneration');
  console.log('==========================================\n');

  // Check current state
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, line_items, pdf_url, pdf_generated_at')
    .in('id', ['1f0c5c78-933f-4033-9b73-9f3cd754165f', 'b0b41abf-de95-4bf8-b2e1-61b74c895d22']);

  console.log('Current invoice state:\n');
  invoices.forEach(inv => {
    console.log(`${inv.invoice_number}:`);
    console.log(`  PDF URL: ${inv.pdf_url || 'None'}`);
    console.log(`  PDF Generated: ${inv.pdf_generated_at || 'Never'}`);
    console.log(`  Line Items Count: ${inv.line_items.length}`);
    inv.line_items.forEach((item, i) => {
      console.log(`    ${i+1}. ${item.description}`);
      console.log(`       Qty: ${item.quantity} x R${(item.unit_price_cents/100).toFixed(2)} = R${(item.total_cents/100).toFixed(2)}`);
    });
    console.log('');
  });

  // Clear PDF URLs to force regeneration
  console.log('Clearing PDF URLs to force regeneration...\n');
  const { error } = await supabase
    .from('invoices')
    .update({ pdf_url: null, pdf_generated_at: null })
    .in('id', ['1f0c5c78-933f-4033-9b73-9f3cd754165f', 'b0b41abf-de95-4bf8-b2e1-61b74c895d22']);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ PDF URLs cleared successfully!');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Make sure backend server is running (npm run dev)');
  console.log('2. Click "View Invoice" or "Download PDF" in the UI');
  console.log('3. PDF will be regenerated with new template and line items');
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
