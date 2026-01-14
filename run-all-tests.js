/**
 * Comprehensive Test Runner
 * Run all tests that can execute without database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 VILO TEST SUITE - Payment Rules & Promo Codes\n');
console.log('=' .repeat(70));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: []
};

// Test Suite 1: Validators
console.log('\n📋 Test Suite 1: Validation Logic\n');
try {
  execSync('node test-validators.js', { stdio: 'inherit' });
  results.suites.push({ name: 'Validators', status: 'PASSED', tests: 8 });
  results.passed += 8;
  results.total += 8;
} catch (error) {
  results.suites.push({ name: 'Validators', status: 'FAILED', tests: 8 });
  results.failed += 8;
  results.total += 8;
}

// Test Suite 2: Type Checking
console.log('\n\n📋 Test Suite 2: TypeScript Type Checking\n');
console.log('Checking backend types...');
try {
  execSync('cd backend && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ Backend: No type errors');
  results.suites.push({ name: 'Backend Types', status: 'PASSED', tests: 1 });
  results.passed += 1;
  results.total += 1;
} catch (error) {
  console.log('❌ Backend: Type errors found');
  console.log(error.stdout?.toString() || error.message);
  results.suites.push({ name: 'Backend Types', status: 'FAILED', tests: 1 });
  results.failed += 1;
  results.total += 1;
}

console.log('\nChecking frontend types...');
try {
  execSync('cd frontend && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ Frontend: No type errors');
  results.suites.push({ name: 'Frontend Types', status: 'PASSED', tests: 1 });
  results.passed += 1;
  results.total += 1;
} catch (error) {
  console.log('❌ Frontend: Type errors found');
  console.log(error.stdout?.toString() || error.message);
  results.suites.push({ name: 'Frontend Types', status: 'FAILED', tests: 1 });
  results.failed += 1;
  results.total += 1;
}

// Test Suite 3: File Structure
console.log('\n\n📋 Test Suite 3: File Structure & Imports\n');

const filesToCheck = [
  { path: 'backend/src/services/payment-rules.service.ts', name: 'Payment Rules Service' },
  { path: 'backend/src/controllers/payment-rules.controller.ts', name: 'Payment Rules Controller' },
  { path: 'backend/src/routes/payment-rules.routes.ts', name: 'Payment Rules Routes' },
  { path: 'backend/src/validators/payment-rules.validators.ts', name: 'Payment Rules Validators' },
  { path: 'backend/src/services/room.service.ts', name: 'Room Service (Promotions)' },
  { path: 'frontend/src/services/payment-rules.service.ts', name: 'Frontend Payment Rules Service' },
  { path: 'frontend/src/services/promotions.service.ts', name: 'Frontend Promotions Service' },
  { path: 'frontend/src/pages/rooms/PaymentRulesManagementPage.tsx', name: 'Payment Rules Page' },
  { path: 'frontend/src/pages/rooms/PromoCodesManagementPage.tsx', name: 'Promo Codes Page' },
  { path: 'backend/migrations/036_create_payment_rules_schema.sql', name: 'Migration 036' },
  { path: 'backend/migrations/038_create_room_assignment_junction_tables.sql', name: 'Migration 038' },
  { path: 'backend/migrations/039_add_property_id_to_payment_rules.sql', name: 'Migration 039' },
];

let fileChecksPassed = 0;
let fileChecksFailed = 0;

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file.name}`);
    fileChecksPassed++;
  } else {
    console.log(`❌ ${file.name} - FILE NOT FOUND`);
    fileChecksFailed++;
  }
});

results.suites.push({
  name: 'File Structure',
  status: fileChecksFailed === 0 ? 'PASSED' : 'FAILED',
  tests: filesToCheck.length
});
results.passed += fileChecksPassed;
results.failed += fileChecksFailed;
results.total += filesToCheck.length;

// Test Suite 4: Migration Files
console.log('\n\n📋 Test Suite 4: Migration File Validation\n');

const migrationFile = path.join(__dirname, 'backend/migrations/039_add_property_id_to_payment_rules.sql');
const migrationContent = fs.readFileSync(migrationFile, 'utf8');

const migrationChecks = [
  { test: 'ALTER TABLE.*room_payment_rules.*ADD COLUMN.*property_id', name: 'Adds property_id to payment_rules' },
  { test: 'ALTER TABLE.*room_promotions.*ADD COLUMN.*property_id', name: 'Adds property_id to promotions' },
  { test: 'UPDATE.*room_payment_rules', name: 'Backfills payment_rules data' },
  { test: 'UPDATE.*room_promotions', name: 'Backfills promotions data' },
  { test: 'CREATE INDEX.*property_id', name: 'Creates indexes' },
  { test: 'DROP POLICY.*room_payment_rules', name: 'Drops old RLS policies' },
  { test: 'CREATE POLICY.*room_payment_rules.*property_id', name: 'Creates new RLS policies' },
];

let migrationPassed = 0;
let migrationFailed = 0;

migrationChecks.forEach(check => {
  const regex = new RegExp(check.test, 'i');
  if (regex.test(migrationContent)) {
    console.log(`✅ ${check.name}`);
    migrationPassed++;
  } else {
    console.log(`❌ ${check.name}`);
    migrationFailed++;
  }
});

results.suites.push({
  name: 'Migration Validation',
  status: migrationFailed === 0 ? 'PASSED' : 'FAILED',
  tests: migrationChecks.length
});
results.passed += migrationPassed;
results.failed += migrationFailed;
results.total += migrationChecks.length;

// Test Suite 5: API Endpoint Connectivity (Basic)
console.log('\n\n📋 Test Suite 5: Basic API Connectivity\n');
try {
  execSync('node test-api.js', { stdio: 'inherit' });
  results.suites.push({ name: 'API Connectivity', status: 'PASSED', tests: 2 });
  results.passed += 2;
  results.total += 2;
} catch (error) {
  results.suites.push({ name: 'API Connectivity', status: 'FAILED', tests: 2 });
  results.failed += 2;
  results.total += 2;
}

// Test Suite 6: Code Syntax Check
console.log('\n\n📋 Test Suite 6: Code Syntax & Linting\n');

const syntaxChecks = [
  { pattern: /\\!/g, exclude: /\\!inner|\\!left|\\!right/, file: 'backend/src/controllers/room.controller.ts', name: 'Room Controller: No escaped !' },
  { pattern: /\\!/g, exclude: /\\!inner|\\!left|\\!right/, file: 'backend/src/services/room.service.ts', name: 'Room Service: No escaped !' },
];

let syntaxPassed = 0;
let syntaxFailed = 0;

syntaxChecks.forEach(check => {
  const fullPath = path.join(__dirname, check.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.match(check.pattern) || [];
    const validMatches = matches.filter(match => {
      // Check surrounding context to see if it's valid Supabase syntax
      return !check.exclude || !check.exclude.test(content);
    });

    // More precise check: look for \! not followed by "inner", "left", "right"
    const invalidEscapes = content.match(/\\!(?!inner|left|right)/g) || [];

    if (invalidEscapes.length === 0) {
      console.log(`✅ ${check.name}`);
      syntaxPassed++;
    } else {
      console.log(`❌ ${check.name} - Found ${invalidEscapes.length} invalid escapes`);
      syntaxFailed++;
    }
  } else {
    console.log(`⚠️  ${check.name} - File not found`);
    syntaxFailed++;
  }
});

results.suites.push({
  name: 'Syntax Checks',
  status: syntaxFailed === 0 ? 'PASSED' : 'FAILED',
  tests: syntaxChecks.length
});
results.passed += syntaxPassed;
results.failed += syntaxFailed;
results.total += syntaxChecks.length;

// Final Summary
console.log('\n\n' + '='.repeat(70));
console.log('\n📊 FINAL TEST RESULTS\n');

console.log('Test Suites:');
results.suites.forEach(suite => {
  const icon = suite.status === 'PASSED' ? '✅' : '❌';
  console.log(`  ${icon} ${suite.name}: ${suite.status} (${suite.tests} tests)`);
});

console.log('\nOverall:');
console.log(`  Total Tests: ${results.total}`);
console.log(`  ✅ Passed: ${results.passed}`);
console.log(`  ❌ Failed: ${results.failed}`);
console.log(`  ⏭️  Skipped: ${results.skipped}`);

const passRate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`  Success Rate: ${passRate}%`);

console.log('\n' + '='.repeat(70));

if (results.failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!\n');
  console.log('✅ System is ready for API testing (after migration 039)');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED\n');
  console.log('❌ Please review failed tests above');
  process.exit(1);
}
