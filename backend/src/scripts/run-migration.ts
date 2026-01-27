/**
 * Run Migration Script
 * Executes a SQL migration file using Supabase RPC
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getAdminClient } from '../config/supabase';

async function runMigration(migrationFile: string) {
  const supabase = getAdminClient();

  try {
    console.log(`📂 Reading migration file: ${migrationFile}\n`);

    const sqlPath = join(__dirname, '../../migrations', migrationFile);
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🔧 Executing migration SQL...\n');

    // Split SQL into individual statements and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`  Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.error(`  ❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: tsx run-migration.ts <migration-file.sql>');
  console.error('Example: tsx run-migration.ts 115_create_website_templates_schema.sql');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
