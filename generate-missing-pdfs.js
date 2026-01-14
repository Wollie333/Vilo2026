/**
 * Generate PDFs for invoices that are missing them
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseServiceKey = 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The invoice IDs that need PDFs
const INVOICE_IDS = [
  '1f0c5c78-933f-4033-9b73-9f3cd754165f', // INV-2026-0001
  'b0b41abf-de95-4bf8-b2e1-61b74c895d22', // INV-2026-0002
];

async function generatePDFViaAPI(invoiceId) {
  try {
    // Since we need authentication, we'll use the admin client to trigger PDF generation directly
    // by calling the stored procedure or updating the record

    console.log(`\n📄 Generating PDF for invoice: ${invoiceId}`);

    // Get the invoice data
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      throw new Error(`Failed to fetch invoice: ${fetchError?.message}`);
    }

    console.log(`   Invoice Number: ${invoice.invoice_number}`);
    console.log(`   Current PDF URL: ${invoice.pdf_url || 'None'}`);

    // For now, we'll note that PDFs need to be generated via the backend endpoint
    // since PDF generation requires the backend service with pdfkit
    console.log(`   ⚠️  PDF generation requires backend service`);
    console.log(`   💡 Call: POST http://localhost:3001/api/invoices/admin/${invoiceId}/regenerate-pdf`);

    return { invoiceId, invoiceNumber: invoice.invoice_number, needsBackend: true };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { invoiceId, error: error.message };
  }
}

async function main() {
  console.log('==========================================');
  console.log('  Generate Missing Invoice PDFs');
  console.log('==========================================\n');

  console.log('Checking invoices for missing PDFs...\n');

  // Check which invoices need PDFs
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, pdf_url')
    .in('id', INVOICE_IDS);

  if (error) {
    console.error('❌ Failed to fetch invoices:', error);
    process.exit(1);
  }

  const needsPDF = invoices.filter(inv => !inv.pdf_url);

  if (needsPDF.length === 0) {
    console.log('✅ All invoices already have PDFs generated!\n');
    return;
  }

  console.log(`Found ${needsPDF.length} invoice(s) needing PDF generation:\n`);
  needsPDF.forEach(inv => {
    console.log(`  - ${inv.invoice_number} (${inv.id})`);
  });

  console.log('\n==========================================');
  console.log('PDF Generation Options:');
  console.log('==========================================\n');

  console.log('Option 1: Use Backend API (Recommended)');
  console.log('-'.repeat(50));
  console.log('Start the backend server and use these curl commands:\n');

  needsPDF.forEach(inv => {
    console.log(`# ${inv.invoice_number}`);
    console.log(`curl -X POST "http://localhost:3001/api/invoices/admin/${inv.id}/regenerate-pdf" \\`);
    console.log(`  -H "Authorization: Bearer {YOUR_ADMIN_TOKEN}" \\`);
    console.log(`  -H "Content-Type: application/json"\n`);
  });

  console.log('\nOption 2: Use Frontend');
  console.log('-'.repeat(50));
  console.log('If backend is running, the View/Download buttons will automatically');
  console.log('trigger PDF generation when clicked for the first time.\n');

  console.log('==========================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
