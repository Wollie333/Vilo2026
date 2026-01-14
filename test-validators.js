/**
 * Validator Testing Script
 * Tests validation logic without requiring database
 */

const { z } = require('zod');

console.log('🧪 Testing Payment Rules Validators\n');
console.log('=' .repeat(70));

// Define schemas (copied from validators)
const paymentRuleTypeSchema = z.enum(['deposit', 'payment_schedule', 'flexible']);
const amountTypeSchema = z.enum(['percentage', 'fixed_amount']);
const dueTimingSchema = z.enum([
  'at_booking',
  'days_before_checkin',
  'days_after_booking',
  'on_checkin',
  'specific_date',
]);

const scheduleMilestoneConfigSchema = z.object({
  sequence: z.number().int().positive(),
  name: z.string().min(1).max(100),
  amount_type: amountTypeSchema,
  amount: z.number().positive(),
  due: dueTimingSchema,
  days: z.number().int().nonnegative().optional(),
  specific_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => {
    if (data.due === 'days_before_checkin' || data.due === 'days_after_booking') {
      return data.days !== undefined;
    }
    if (data.due === 'specific_date') {
      return !!data.specific_date;
    }
    return true;
  },
  { message: 'Days or specific_date required based on due timing' }
).refine(
  (data) => {
    if (data.amount_type === 'percentage') {
      return data.amount <= 100;
    }
    return true;
  },
  { message: 'Percentage amount cannot exceed 100' }
);

const createPaymentRuleSchema = z.object({
  body: z.object({
    property_id: z.string().uuid(),
    room_ids: z.array(z.string().uuid()).optional(),
    rule_name: z.string().min(1).max(100),
    description: z.string().optional(),
    rule_type: paymentRuleTypeSchema,
    deposit_type: amountTypeSchema.optional(),
    deposit_amount: z.number().positive().optional(),
    deposit_due: dueTimingSchema.optional(),
    deposit_due_days: z.number().int().nonnegative().optional(),
    balance_due: dueTimingSchema.optional(),
    balance_due_days: z.number().int().nonnegative().optional(),
    schedule_config: z.array(scheduleMilestoneConfigSchema).optional(),
    allowed_payment_methods: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
    applies_to_dates: z.boolean().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    priority: z.number().int().optional(),
  })
  .refine(
    (data) => {
      if (data.rule_type === 'deposit') {
        return data.deposit_type && data.deposit_amount && data.deposit_due && data.balance_due;
      }
      return true;
    },
    { message: 'Deposit configuration required for deposit rule type' }
  )
  .refine(
    (data) => {
      if (data.rule_type === 'payment_schedule') {
        return data.schedule_config && data.schedule_config.length > 0;
      }
      return true;
    },
    { message: 'Payment schedule configuration required for payment_schedule rule type' }
  )
  .refine(
    (data) => {
      if (data.schedule_config && data.schedule_config.length > 0) {
        const allPercentages = data.schedule_config.every(m => m.amount_type === 'percentage');
        if (allPercentages) {
          const total = data.schedule_config.reduce((sum, m) => sum + m.amount, 0);
          return Math.abs(total - 100) < 0.01;
        }
      }
      return true;
    },
    { message: 'Milestone percentages must sum to 100%' }
  )
  .refine(
    (data) => {
      if (data.deposit_type === 'percentage' && data.deposit_amount) {
        return data.deposit_amount <= 100;
      }
      return true;
    },
    { message: 'Deposit percentage cannot exceed 100' }
  )
});

// Test cases
const tests = [
  {
    id: 'VAL-001',
    name: 'Valid deposit rule (50% deposit)',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: '50% Deposit Rule',
        rule_type: 'deposit',
        deposit_type: 'percentage',
        deposit_amount: 50,
        deposit_due: 'at_booking',
        balance_due: 'on_checkin',
        is_active: true
      }
    },
    shouldPass: true
  },
  {
    id: 'VAL-002',
    name: 'Invalid: Deposit amount > 100%',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: 'Invalid Rule',
        rule_type: 'deposit',
        deposit_type: 'percentage',
        deposit_amount: 150,
        deposit_due: 'at_booking',
        balance_due: 'on_checkin'
      }
    },
    shouldPass: false
  },
  {
    id: 'VAL-003',
    name: 'Invalid: Missing deposit configuration',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: 'Incomplete Rule',
        rule_type: 'deposit',
        // Missing deposit_type, deposit_amount, etc.
      }
    },
    shouldPass: false
  },
  {
    id: 'VAL-004',
    name: 'Valid payment schedule (3 milestones totaling 100%)',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: '3-Part Payment Schedule',
        rule_type: 'payment_schedule',
        schedule_config: [
          {
            sequence: 1,
            name: 'First Payment',
            amount_type: 'percentage',
            amount: 33.33,
            due: 'at_booking'
          },
          {
            sequence: 2,
            name: 'Second Payment',
            amount_type: 'percentage',
            amount: 33.33,
            due: 'days_before_checkin',
            days: 30
          },
          {
            sequence: 3,
            name: 'Final Payment',
            amount_type: 'percentage',
            amount: 33.34,
            due: 'on_checkin'
          }
        ]
      }
    },
    shouldPass: true
  },
  {
    id: 'VAL-005',
    name: 'Invalid: Schedule milestones total 95%',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: 'Invalid Schedule',
        rule_type: 'payment_schedule',
        schedule_config: [
          {
            sequence: 1,
            name: 'Payment 1',
            amount_type: 'percentage',
            amount: 45,
            due: 'at_booking'
          },
          {
            sequence: 2,
            name: 'Payment 2',
            amount_type: 'percentage',
            amount: 50,
            due: 'on_checkin'
          }
        ]
      }
    },
    shouldPass: false
  },
  {
    id: 'VAL-006',
    name: 'Invalid: Empty rule name',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: '',
        rule_type: 'flexible'
      }
    },
    shouldPass: false
  },
  {
    id: 'VAL-007',
    name: 'Invalid: Invalid UUID format',
    data: {
      body: {
        property_id: 'not-a-valid-uuid',
        rule_name: 'Test Rule',
        rule_type: 'flexible'
      }
    },
    shouldPass: false
  },
  {
    id: 'VAL-008',
    name: 'Valid: Flexible rule (no requirements)',
    data: {
      body: {
        property_id: '123e4567-e89b-12d3-a456-426614174000',
        rule_name: 'Flexible Payment',
        rule_type: 'flexible',
        is_active: true
      }
    },
    shouldPass: true
  }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('\n📝 Running Validation Tests\n');

tests.forEach(test => {
  try {
    const result = createPaymentRuleSchema.safeParse(test.data);
    const actualPass = result.success;

    if (actualPass === test.shouldPass) {
      console.log(`✅ ${test.id}: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.id}: ${test.name}`);
      console.log(`   Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
      console.log(`   Actual: ${actualPass ? 'PASS' : 'FAIL'}`);
      if (!result.success) {
        console.log(`   Errors:`, result.error.errors.map(e => e.message).join(', '));
      }
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.id}: ${test.name} - EXCEPTION`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n📊 Validation Test Summary\n');
console.log(`Total Tests: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

process.exit(failed > 0 ? 1 : 0);
