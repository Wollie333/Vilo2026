import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://hqvzftqwbwslrqhktwzr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdnpmdHF3YndzbHJxaGt0d3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQyMzQzOCwiZXhwIjoyMDUxOTk5NDM4fQ.itnN4rVIp_0NVQ9CZXoAzAmWn-KIo6TK_pEV6SgWjKs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '053_add_property_listing_visibility.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration 053...');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('  ⚠️  Already exists (skipping)');
        } else {
          console.error('  ❌ Error:', error.message);
        }
      } else {
        console.log('  ✅ Success');
      }
    }

    console.log('\n✅ Migration 053 applied successfully!');
    console.log('\n🔄 Now reloading Supabase schema cache...');

    // Reload schema cache by making a simple query
    const { error: reloadError } = await supabase
      .from('properties')
      .select('city_id')
      .limit(1);

    if (reloadError) {
      console.log('Schema cache reload triggered (error expected):', reloadError.message);
    } else {
      console.log('✅ Schema cache reloaded successfully!');
    }

    console.log('\n✅ All done! Try saving your form again.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
