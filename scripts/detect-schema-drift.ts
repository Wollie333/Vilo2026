#!/usr/bin/env ts-node

/**
 * Schema Drift Detection Tool
 *
 * Compares actual database schema with expected schema from migration files.
 * Detects:
 * - Tables in DB but not defined in migrations
 * - Columns in DB but not defined in migrations
 * - Tables/columns defined in migrations but missing in DB
 *
 * Exit codes:
 * - 0: No drift detected
 * - 1: Drift detected
 * - 2: Error occurred
 *
 * Usage:
 *   npm run schema:drift
 *   ts-node scripts/detect-schema-drift.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TableInfo {
  table_name: string;
  columns: Set<string>;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface DriftReport {
  unexpectedTables: string[];
  unexpectedColumns: Array<{ table: string; column: string }>;
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
}

// ============================================================================
// Database Schema Inspection
// ============================================================================

/**
 * Get all tables and columns from the database
 */
async function getActualSchema(): Promise<Map<string, TableInfo>> {
  const tables = new Map<string, TableInfo>();

  // Query information_schema to get all tables and columns
  const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `
  });

  if (tableError) {
    // Fallback: Use direct query (requires proper permissions)
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Error fetching schema:', error.message);
      console.error('💡 Ensure SUPABASE_SERVICE_KEY has admin permissions');
      process.exit(2);
    }

    // Build table map
    if (columns) {
      for (const col of columns as ColumnInfo[]) {
        if (!tables.has(col.table_name)) {
          tables.set(col.table_name, {
            table_name: col.table_name,
            columns: new Set(),
          });
        }
        tables.get(col.table_name)!.columns.add(col.column_name);
      }
    }
  } else {
    // Parse RPC result
    for (const col of tableData as ColumnInfo[]) {
      if (!tables.has(col.table_name)) {
        tables.set(col.table_name, {
          table_name: col.table_name,
          columns: new Set(),
        });
      }
      tables.get(col.table_name)!.columns.add(col.column_name);
    }
  }

  return tables;
}

// ============================================================================
// Migration File Parsing
// ============================================================================

/**
 * Parse migration files to extract expected schema
 * This is a simplified parser - it looks for CREATE TABLE and ADD COLUMN statements
 */
function parseExpectedSchema(): Map<string, TableInfo> {
  const tables = new Map<string, TableInfo>();
  const migrationsDir = path.join(__dirname, '../backend/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(2);
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Parsing ${migrationFiles.length} migration files...`);

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)\s*\(/gi;
    let match;

    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      if (!tables.has(tableName)) {
        tables.set(tableName, {
          table_name: tableName,
          columns: new Set(),
        });
      }

      // Extract columns for this table (simplified - looks for lines with column definitions)
      // This is a basic parser and may not catch all edge cases
      const tableDefStart = match.index + match[0].length;
      const tableDefEnd = content.indexOf(');', tableDefStart);
      const tableDef = content.substring(tableDefStart, tableDefEnd);

      // Match column definitions (e.g., "column_name TYPE")
      const columnRegex = /^\s*([a-z_]+)\s+(?:UUID|TEXT|INTEGER|BOOLEAN|DECIMAL|TIMESTAMPTZ|TIMESTAMP|JSONB|JSON|VARCHAR)/gim;
      let colMatch;

      while ((colMatch = columnRegex.exec(tableDef)) !== null) {
        const columnName = colMatch[1];
        // Skip SQL keywords
        if (!['constraint', 'primary', 'foreign', 'unique', 'check', 'default'].includes(columnName.toLowerCase())) {
          tables.get(tableName)!.columns.add(columnName);
        }
      }
    }

    // Extract ADD COLUMN statements
    const addColumnRegex = /ALTER\s+TABLE\s+([a-z_]+)\s+ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi;

    while ((match = addColumnRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnName = match[2];

      if (!tables.has(tableName)) {
        tables.set(tableName, {
          table_name: tableName,
          columns: new Set(),
        });
      }

      tables.get(tableName)!.columns.add(columnName);
    }

    // Extract DROP COLUMN statements (remove from expected schema)
    const dropColumnRegex = /ALTER\s+TABLE\s+([a-z_]+)\s+DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?([a-z_]+)/gi;

    while ((match = dropColumnRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columnName = match[2];

      if (tables.has(tableName)) {
        tables.get(tableName)!.columns.delete(columnName);
      }
    }

    // Extract DROP TABLE statements
    const dropTableRegex = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-z_]+)/gi;

    while ((match = dropTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      tables.delete(tableName);
    }

    // Extract ALTER TABLE ... SET SCHEMA statements (migration 097 pattern)
    const setSchemaRegex = /ALTER\s+TABLE\s+(?:public\.)?([a-z_]+)\s+SET\s+SCHEMA\s+([a-z_]+)/gi;

    while ((match = setSchemaRegex.exec(content)) !== null) {
      const tableName = match[1];
      const targetSchema = match[2];

      // If moved out of public schema, remove from expected
      if (targetSchema !== 'public') {
        tables.delete(tableName);
      }
    }
  }

  return tables;
}

// ============================================================================
// Drift Detection
// ============================================================================

/**
 * Compare actual vs expected schema and report drift
 */
function detectDrift(
  actual: Map<string, TableInfo>,
  expected: Map<string, TableInfo>
): DriftReport {
  const report: DriftReport = {
    unexpectedTables: [],
    unexpectedColumns: [],
    missingTables: [],
    missingColumns: [],
  };

  // Find unexpected tables (in DB but not in migrations)
  for (const tableName of actual.keys()) {
    // Ignore system tables
    if (tableName.startsWith('pg_') || tableName.startsWith('_')) {
      continue;
    }

    if (!expected.has(tableName)) {
      report.unexpectedTables.push(tableName);
    }
  }

  // Find missing tables (in migrations but not in DB)
  for (const tableName of expected.keys()) {
    if (!actual.has(tableName)) {
      report.missingTables.push(tableName);
    }
  }

  // Find unexpected/missing columns
  for (const [tableName, tableInfo] of actual.entries()) {
    if (!expected.has(tableName)) {
      continue; // Already reported as unexpected table
    }

    const expectedColumns = expected.get(tableName)!.columns;

    for (const columnName of tableInfo.columns) {
      if (!expectedColumns.has(columnName)) {
        report.unexpectedColumns.push({ table: tableName, column: columnName });
      }
    }
  }

  // Find missing columns (defined in migrations but not in DB)
  for (const [tableName, tableInfo] of expected.entries()) {
    if (!actual.has(tableName)) {
      continue; // Already reported as missing table
    }

    const actualColumns = actual.get(tableName)!.columns;

    for (const columnName of tableInfo.columns) {
      if (!actualColumns.has(columnName)) {
        report.missingColumns.push({ table: tableName, column: columnName });
      }
    }
  }

  return report;
}

// ============================================================================
// Reporting
// ============================================================================

/**
 * Print drift report
 */
function printReport(report: DriftReport): void {
  let hasDrift = false;

  console.log('\\n' + '='.repeat(70));
  console.log('Schema Drift Detection Report');
  console.log('='.repeat(70) + '\\n');

  if (report.unexpectedTables.length > 0) {
    hasDrift = true;
    console.log(`❌ Unexpected Tables (${report.unexpectedTables.length}):`);
    console.log('   Tables exist in database but not defined in migrations:\\n');
    for (const table of report.unexpectedTables) {
      console.log(`   - ${table}`);
    }
    console.log('');
  }

  if (report.missingTables.length > 0) {
    hasDrift = true;
    console.log(`⚠️  Missing Tables (${report.missingTables.length}):`);
    console.log('   Tables defined in migrations but missing from database:\\n');
    for (const table of report.missingTables) {
      console.log(`   - ${table}`);
    }
    console.log('');
  }

  if (report.unexpectedColumns.length > 0) {
    hasDrift = true;
    console.log(`❌ Unexpected Columns (${report.unexpectedColumns.length}):`);
    console.log('   Columns exist in database but not defined in migrations:\\n');

    // Group by table
    const byTable = new Map<string, string[]>();
    for (const { table, column } of report.unexpectedColumns) {
      if (!byTable.has(table)) {
        byTable.set(table, []);
      }
      byTable.get(table)!.push(column);
    }

    for (const [table, columns] of byTable.entries()) {
      console.log(`   ${table}:`);
      for (const column of columns) {
        console.log(`     - ${column}`);
      }
    }
    console.log('');
  }

  if (report.missingColumns.length > 0) {
    hasDrift = true;
    console.log(`⚠️  Missing Columns (${report.missingColumns.length}):`);
    console.log('   Columns defined in migrations but missing from database:\\n');

    // Group by table
    const byTable = new Map<string, string[]>();
    for (const { table, column } of report.missingColumns) {
      if (!byTable.has(table)) {
        byTable.set(table, []);
      }
      byTable.get(table)!.push(column);
    }

    for (const [table, columns] of byTable.entries()) {
      console.log(`   ${table}:`);
      for (const column of columns) {
        console.log(`     - ${column}`);
      }
    }
    console.log('');
  }

  console.log('='.repeat(70));

  if (!hasDrift) {
    console.log('✅ No schema drift detected! Database matches migration definitions.');
    console.log('='.repeat(70) + '\\n');
  } else {
    console.log('❌ Schema drift detected! Please review and resolve.');
    console.log('\\nRecommendations:');
    console.log('  1. Unexpected tables/columns: Create migration to remove them');
    console.log('  2. Missing tables/columns: Run pending migrations');
    console.log('='.repeat(70) + '\\n');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  try {
    console.log('🔍 Starting schema drift detection...\\n');

    console.log('📊 Fetching actual database schema...');
    const actualSchema = await getActualSchema();
    console.log(`✅ Found ${actualSchema.size} tables in database\\n`);

    console.log('📝 Parsing migration files for expected schema...');
    const expectedSchema = parseExpectedSchema();
    console.log(`✅ Found ${expectedSchema.size} tables defined in migrations\\n`);

    console.log('🔬 Comparing schemas...');
    const report = detectDrift(actualSchema, expectedSchema);

    printReport(report);

    // Exit with appropriate code
    const hasDrift =
      report.unexpectedTables.length > 0 ||
      report.unexpectedColumns.length > 0 ||
      report.missingTables.length > 0 ||
      report.missingColumns.length > 0;

    process.exit(hasDrift ? 1 : 0);
  } catch (error) {
    console.error('\\n❌ Error during drift detection:', error);
    process.exit(2);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { getActualSchema, parseExpectedSchema, detectDrift };
