/**
 * Frontend Structure and Compilation Test
 * Verifies all payment rules and promo codes pages exist and TypeScript compiles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🎨 FRONTEND STRUCTURE TESTING\n');
console.log('='.repeat(70));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(id, name, status, message = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${id}: ${name}`);
  if (message) console.log(`   ${message}`);

  results.tests.push({ id, name, status, message });
  results.total++;
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

// ============================================================================
// FILE STRUCTURE TESTS
// ============================================================================

console.log('\n📋 Test Suite 1: Payment Rules Pages\n');

const paymentRulesPages = [
  { path: 'frontend/src/pages/rooms/PaymentRulesManagementPage.tsx', name: 'Management Page' },
  { path: 'frontend/src/pages/rooms/CreatePaymentRulePage.tsx', name: 'Create Page' },
  { path: 'frontend/src/pages/rooms/EditPaymentRulePage.tsx', name: 'Edit Page' },
];

paymentRulesPages.forEach((page, index) => {
  const fullPath = path.join(__dirname, page.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasExport = content.includes('export') && (content.includes('const') || content.includes('function'));

    if (hasExport) {
      logTest(`PR-UI-FILE-${index + 1}`, `Payment Rules ${page.name}`, 'PASS',
        `File exists and exports component`);
    } else {
      logTest(`PR-UI-FILE-${index + 1}`, `Payment Rules ${page.name}`, 'FAIL',
        `File exists but missing export`);
    }
  } else {
    logTest(`PR-UI-FILE-${index + 1}`, `Payment Rules ${page.name}`, 'FAIL',
      `File not found: ${page.path}`);
  }
});

console.log('\n📋 Test Suite 2: Promo Codes Pages\n');

const promoCodesPages = [
  { path: 'frontend/src/pages/rooms/PromoCodesManagementPage.tsx', name: 'Management Page' },
  { path: 'frontend/src/pages/rooms/CreatePromoCodePage.tsx', name: 'Create Page' },
  { path: 'frontend/src/pages/rooms/EditPromoCodePage.tsx', name: 'Edit Page' },
];

promoCodesPages.forEach((page, index) => {
  const fullPath = path.join(__dirname, page.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasExport = content.includes('export') && (content.includes('const') || content.includes('function'));

    if (hasExport) {
      logTest(`PM-UI-FILE-${index + 1}`, `Promo Codes ${page.name}`, 'PASS',
        `File exists and exports component`);
    } else {
      logTest(`PM-UI-FILE-${index + 1}`, `Promo Codes ${page.name}`, 'FAIL',
        `File exists but missing export`);
    }
  } else {
    logTest(`PM-UI-FILE-${index + 1}`, `Promo Codes ${page.name}`, 'FAIL',
      `File not found: ${page.path}`);
  }
});

console.log('\n📋 Test Suite 3: Form Components\n');

const formComponents = [
  { path: 'frontend/src/components/features/PaymentRuleForm/PaymentRuleForm.tsx', name: 'Payment Rule Form' },
  { path: 'frontend/src/components/features/PromoCodeForm/PromoCodeForm.tsx', name: 'Promo Code Form' },
];

formComponents.forEach((component, index) => {
  const fullPath = path.join(__dirname, component.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasExport = content.includes('export') && (content.includes('const') || content.includes('function'));

    if (hasExport) {
      logTest(`FORM-${index + 1}`, component.name, 'PASS',
        `Component exists and exports`);
    } else {
      logTest(`FORM-${index + 1}`, component.name, 'FAIL',
        `Component exists but missing export`);
    }
  } else {
    logTest(`FORM-${index + 1}`, component.name, 'FAIL',
      `Component not found: ${component.path}`);
  }
});

console.log('\n📋 Test Suite 4: Service Files\n');

const serviceFiles = [
  { path: 'frontend/src/services/payment-rules.service.ts', name: 'Payment Rules Service' },
  { path: 'frontend/src/services/promotions.service.ts', name: 'Promotions Service' },
];

serviceFiles.forEach((service, index) => {
  const fullPath = path.join(__dirname, service.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasServiceExport = content.includes('export') &&
                            (content.includes('Service') || content.includes('service'));

    if (hasServiceExport) {
      logTest(`SVC-${index + 1}`, service.name, 'PASS',
        `Service exists and exports API methods`);
    } else {
      logTest(`SVC-${index + 1}`, service.name, 'FAIL',
        `Service exists but missing exports`);
    }
  } else {
    logTest(`SVC-${index + 1}`, service.name, 'FAIL',
      `Service not found: ${service.path}`);
  }
});

console.log('\n📋 Test Suite 5: Route Configuration\n');

const appPath = path.join(__dirname, 'frontend/src/App.tsx');
if (fs.existsSync(appPath)) {
  const content = fs.readFileSync(appPath, 'utf8');

  const routes = [
    { path: '/rooms/payment-rules', name: 'Payment Rules List Route' },
    { path: '/rooms/payment-rules/new', name: 'Create Payment Rule Route' },
    { path: '/rooms/payment-rules/:id/edit', name: 'Edit Payment Rule Route' },
    { path: '/rooms/promo-codes', name: 'Promo Codes List Route' },
    { path: '/rooms/promo-codes/new', name: 'Create Promo Code Route' },
    { path: '/rooms/promo-codes/:id/edit', name: 'Edit Promo Code Route' },
  ];

  routes.forEach((route, index) => {
    // Remove parameter syntax for search
    const searchPath = route.path.replace('/:id', '');
    if (content.includes(searchPath)) {
      logTest(`ROUTE-${index + 1}`, route.name, 'PASS',
        `Route configured in App.tsx`);
    } else {
      logTest(`ROUTE-${index + 1}`, route.name, 'FAIL',
        `Route not found in App.tsx: ${route.path}`);
    }
  });
} else {
  logTest('ROUTE-ERROR', 'App.tsx', 'FAIL', 'App.tsx not found');
}

// ============================================================================
// TYPESCRIPT COMPILATION TEST
// ============================================================================

console.log('\n📋 Test Suite 6: TypeScript Compilation\n');

console.log('Running: cd frontend && npx tsc --noEmit');
console.log('(This may take 30-60 seconds...)\n');

try {
  execSync('cd frontend && npx tsc --noEmit', {
    stdio: 'pipe',
    encoding: 'utf8'
  });

  logTest('TS-COMPILE', 'Frontend TypeScript Compilation', 'PASS',
    'No type errors found');
} catch (error) {
  const output = error.stdout || error.stderr || error.message;
  const errorCount = (output.match(/error TS/g) || []).length;

  logTest('TS-COMPILE', 'Frontend TypeScript Compilation', 'FAIL',
    `Found ${errorCount} TypeScript errors`);

  // Show first 10 errors
  const lines = output.split('\n');
  const errorLines = lines.filter(line => line.includes('error TS')).slice(0, 10);

  if (errorLines.length > 0) {
    console.log('\n   First 10 errors:');
    errorLines.forEach(line => console.log(`   ${line.trim()}`));
  }

  if (errorCount > 10) {
    console.log(`   ... and ${errorCount - 10} more errors\n`);
  }
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('\n📊 FRONTEND STRUCTURE TEST RESULTS\n');

console.log('Test Summary:');
console.log(`  Total Tests: ${results.total}`);
console.log(`  ✅ Passed: ${results.passed}`);
console.log(`  ❌ Failed: ${results.failed}`);

const passRate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`  Success Rate: ${passRate}%`);

console.log('\n' + '='.repeat(70));

if (results.failed === 0) {
  console.log('\n🎉 ALL FRONTEND STRUCTURE TESTS PASSED!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED\n');
  console.log('Failed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.id}: ${t.name}`);
    if (t.message) console.log(`    ${t.message}`);
  });
  console.log('\n');
  process.exit(1);
}
