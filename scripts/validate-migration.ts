#!/usr/bin/env ts-node

/**
 * Migration Validation Script
 *
 * Validates that migration files follow DATABASE_STANDARDS.md conventions.
 *
 * Checks:
 * - File naming convention (###_descriptive_name.sql)
 * - Required header sections
 * - Idempotent patterns (IF EXISTS, IF NOT EXISTS)
 * - Rollback instructions included
 * - Pre-flight checks present for HIGH/MEDIUM risk migrations
 *
 * Exit codes:
 * - 0: All migrations valid
 * - 1: Validation failures found
 * - 2: Error occurred
 *
 * Usage:
 *   npm run migration:validate
 *   npm run migration:validate <migration-file>
 *   ts-node scripts/validate-migration.ts
 *   ts-node scripts/validate-migration.ts backend/migrations/096_*.sql
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Check file naming convention: ###_descriptive_name.sql
 */
function validateFileName(fileName: string): string[] {
  const errors: string[] = [];
  const namePattern = /^\d{3}_[a-z_]+\.sql$/;

  if (!namePattern.test(fileName)) {
    errors.push(
      `Invalid file name format. Expected: ###_descriptive_name.sql (e.g., 096_remove_legacy_columns.sql)`
    );
  }

  // Check that number is 3 digits
  const numberMatch = fileName.match(/^(\d+)_/);
  if (numberMatch && numberMatch[1].length !== 3) {
    errors.push(`Migration number must be 3 digits (e.g., 096, not 96 or 0096)`);
  }

  // Check that description is snake_case
  const descMatch = fileName.match(/^\d{3}_([a-z0-9_]+)\.sql$/);
  if (descMatch && descMatch[1].includes('-')) {
    errors.push(`Description must use snake_case, not kebab-case`);
  }

  return errors;
}

/**
 * Check required header section
 */
function validateHeader(content: string): string[] {
  const errors: string[] = [];
  const requiredFields = [
    { pattern: /--\s*Migration:\s*\d{3}_\w+\.sql/i, name: 'Migration name' },
    { pattern: /--\s*Description:/i, name: 'Description' },
    { pattern: /--\s*Date:/i, name: 'Date' },
    { pattern: /--\s*Author:/i, name: 'Author' },
  ];

  for (const { pattern, name } of requiredFields) {
    if (!pattern.test(content)) {
      errors.push(`Missing required header field: ${name}`);
    }
  }

  // Check for risk level (optional but recommended)
  if (!/--\s*Risk:\s*(LOW|MEDIUM|HIGH)/i.test(content)) {
    // This is a warning, not an error
  }

  return errors;
}

/**
 * Check for idempotent patterns
 */
function validateIdempotency(content: string): string[] {
  const warnings: string[] = [];

  // Check for CREATE TABLE without IF NOT EXISTS
  const createTablePattern = /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)([a-z_]+)/gi;
  const createMatches = content.match(createTablePattern);

  if (createMatches && createMatches.length > 0) {
    warnings.push(
      `Found CREATE TABLE without IF NOT EXISTS. Consider using: CREATE TABLE IF NOT EXISTS ... for idempotency`
    );
  }

  // Check for ALTER TABLE ADD COLUMN without existence check
  const addColumnPattern = /ALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)\w+/gi;
  const addColumnMatches = content.match(addColumnPattern);

  if (addColumnMatches && addColumnMatches.length > 0) {
    warnings.push(
      `Found ALTER TABLE ADD COLUMN without IF NOT EXISTS or DO $$ existence check. Migration may fail if run twice.`
    );
  }

  return warnings;
}

/**
 * Check for rollback instructions
 */
function validateRollback(content: string): string[] {
  const errors: string[] = [];

  // Check for rollback section
  const hasRollbackSection =
    /ROLLBACK|rollback|Rollback/i.test(content) &&
    (/Rollback\s+Instructions/i.test(content) || /ROLLBACK\s+INSTRUCTIONS/i.test(content));

  if (!hasRollbackSection) {
    errors.push(
      `Missing rollback instructions section. All migrations should document how to reverse changes.`
    );
  }

  return errors;
}

/**
 * Check for pre-flight checks on destructive operations
 */
function validatePreflightChecks(content: string): string[] {
  const warnings: string[] = [];

  // Check for destructive operations
  const hasDropColumn = /DROP\s+COLUMN/i.test(content);
  const hasDropTable = /DROP\s+TABLE/i.test(content);
  const hasAlterColumn = /ALTER\s+COLUMN/i.test(content);

  const hasPreflightChecks = /PRE-?FLIGHT\s+CHECK/i.test(content) || /DO\s+\$\$/i.test(content);

  if ((hasDropColumn || hasDropTable || hasAlterColumn) && !hasPreflightChecks) {
    warnings.push(
      `Migration has destructive operations (DROP COLUMN, DROP TABLE, ALTER COLUMN) but no pre-flight checks. Consider adding validation logic.`
    );
  }

  return warnings;
}

/**
 * Check for backup creation on destructive operations
 */
function validateBackups(content: string): string[] {
  const warnings: string[] = [];

  const hasDropColumn = /DROP\s+COLUMN/i.test(content);
  const hasDropTable = /DROP\s+TABLE/i.test(content);

  const hasBackup =
    /CREATE\s+TABLE\s+\w+_backup/i.test(content) ||
    /BACKUP/i.test(content) ||
    /backup\s+table/i.test(content);

  if ((hasDropColumn || hasDropTable) && !hasBackup) {
    warnings.push(
      `Migration has destructive operations but no backup table creation. Consider backing up data before DROP operations.`
    );
  }

  return warnings;
}

/**
 * Check for proper commenting
 */
function validateComments(content: string): string[] {
  const warnings: string[] = [];

  // Count lines
  const lines = content.split('\\n');
  const sqlLines = lines.filter(
    (l) => l.trim() && !l.trim().startsWith('--') && !l.trim().startsWith('/*')
  );
  const commentLines = lines.filter(
    (l) => l.trim().startsWith('--') || l.trim().startsWith('/*')
  );

  // If less than 20% of non-empty lines are comments, warn
  const commentRatio = commentLines.length / (sqlLines.length + commentLines.length);

  if (commentRatio < 0.2 && sqlLines.length > 20) {
    warnings.push(
      `Low comment ratio (${(commentRatio * 100).toFixed(0)}%). Complex migrations should have explanatory comments.`
    );
  }

  return warnings;
}

/**
 * Check for proper section structure
 */
function validateStructure(content: string): string[] {
  const warnings: string[] = [];

  // Check for section markers
  const hasSections = /={10,}/.test(content); // At least 10 equals signs

  if (!hasSections && content.length > 1000) {
    warnings.push(
      `Large migration (>1000 chars) without section markers. Consider using section dividers for readability.`
    );
  }

  return warnings;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a single migration file
 */
function validateMigration(filePath: string): ValidationResult {
  const fileName = path.basename(filePath);
  const result: ValidationResult = {
    file: fileName,
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check file exists
  if (!fs.existsSync(filePath)) {
    result.valid = false;
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');

  // Run validation checks
  result.errors.push(...validateFileName(fileName));
  result.errors.push(...validateHeader(content));
  result.errors.push(...validateRollback(content));

  result.warnings.push(...validateIdempotency(content));
  result.warnings.push(...validatePreflightChecks(content));
  result.warnings.push(...validateBackups(content));
  result.warnings.push(...validateComments(content));
  result.warnings.push(...validateStructure(content));

  // Mark as invalid if there are errors
  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

/**
 * Validate all migrations in directory
 */
function validateAllMigrations(migrationsDir: string): ValidationResult[] {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(2);
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const results: ValidationResult[] = [];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    results.push(validateMigration(filePath));
  }

  return results;
}

// ============================================================================
// Reporting
// ============================================================================

/**
 * Print validation results
 */
function printResults(results: ValidationResult[]): void {
  console.log('\\n' + '='.repeat(70));
  console.log('Migration Validation Report');
  console.log('='.repeat(70) + '\\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.errors.length > 0 || result.warnings.length > 0) {
      const icon = result.valid ? '⚠️' : '❌';
      console.log(`${icon} ${result.file}`);

      if (result.errors.length > 0) {
        console.log(`\\n  Errors (${result.errors.length}):`);
        for (const error of result.errors) {
          console.log(`    - ${error}`);
        }
      }

      if (result.warnings.length > 0) {
        console.log(`\\n  Warnings (${result.warnings.length}):`);
        for (const warning of result.warnings) {
          console.log(`    - ${warning}`);
        }
      }

      console.log('');
    }
  }

  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.length - validCount;

  console.log('='.repeat(70));
  console.log(`\\nSummary:`);
  console.log(`  Total migrations: ${results.length}`);
  console.log(`  ✅ Valid: ${validCount}`);
  console.log(`  ❌ Invalid: ${invalidCount}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);
  console.log('\\n' + '='.repeat(70) + '\\n');

  if (invalidCount === 0) {
    console.log('✅ All migrations passed validation!\\n');
  } else {
    console.log('❌ Some migrations failed validation. Please fix errors before merging.\\n');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Validate specific file(s)
    const results: ValidationResult[] = [];

    for (const filePath of args) {
      // Expand glob patterns if needed
      if (filePath.includes('*')) {
        const dir = path.dirname(filePath);
        const pattern = path.basename(filePath);
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.match(pattern.replace('*', '.*')))
          .map((f) => path.join(dir, f));

        for (const file of files) {
          results.push(validateMigration(file));
        }
      } else {
        results.push(validateMigration(filePath));
      }
    }

    printResults(results);

    const hasFailures = results.some((r) => !r.valid);
    process.exit(hasFailures ? 1 : 0);
  } else {
    // Validate all migrations
    const migrationsDir = path.join(process.cwd(), 'backend/migrations');
    const results = validateAllMigrations(migrationsDir);

    printResults(results);

    const hasFailures = results.some((r) => !r.valid);
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run main
main().catch((error) => {
  console.error('\\n❌ Error during validation:', error);
  process.exit(2);
});
