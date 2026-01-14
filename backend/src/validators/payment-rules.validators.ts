/**
 * Payment Rules Validators
 *
 * Zod validation schemas for payment rules API requests.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

const paymentRuleTypeSchema = z.enum(['deposit', 'payment_schedule', 'flexible']);
const amountTypeSchema = z.enum(['percentage', 'fixed_amount']);
const dueTimingSchema = z.enum([
  'at_booking',
  'days_before_checkin',
  'days_after_booking',
  'on_checkin',
  'specific_date',
]);

// ============================================================================
// SCHEDULE MILESTONE SCHEMA
// ============================================================================

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
    // If due is days_before_checkin or days_after_booking, days must be provided
    if (data.due === 'days_before_checkin' || data.due === 'days_after_booking') {
      return data.days !== undefined;
    }
    // If due is specific_date, specific_date must be provided
    if (data.due === 'specific_date') {
      return !!data.specific_date;
    }
    return true;
  },
  {
    message: 'Days or specific_date required based on due timing',
  }
).refine(
  (data) => {
    // If amount_type is percentage, amount must be <= 100
    if (data.amount_type === 'percentage') {
      return data.amount <= 100;
    }
    return true;
  },
  {
    message: 'Percentage amount cannot exceed 100',
  }
);

// ============================================================================
// CREATE PAYMENT RULE SCHEMA
// ============================================================================

export const createPaymentRuleSchema = z.object({
  property_id: z.string().uuid(),
  room_ids: z.array(z.string().uuid()).optional(),
  rule_name: z.string().min(1).max(100),
  description: z.string().optional(),
  rule_type: paymentRuleTypeSchema,

  // Deposit configuration (required if rule_type = 'deposit')
  deposit_type: amountTypeSchema.optional(),
  deposit_amount: z.number().positive().optional(),
  deposit_due: dueTimingSchema.optional(),
  deposit_due_days: z.number().int().nonnegative().optional(),
  balance_due: dueTimingSchema.optional(),
  balance_due_days: z.number().int().nonnegative().optional(),

  // Schedule configuration (required if rule_type = 'payment_schedule')
  schedule_config: z.array(scheduleMilestoneConfigSchema).optional(),

  // Optional constraints
  allowed_payment_methods: z.array(z.string()).optional(),

  // Applicability
  is_active: z.boolean().optional(),
  applies_to_dates: z.boolean().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.number().int().optional(),
})
  .refine(
    (data) => {
      // If rule_type is deposit, deposit fields must be provided
      if (data.rule_type === 'deposit') {
        return (
          data.deposit_type &&
          data.deposit_amount &&
          data.deposit_due &&
          data.balance_due
        );
      }
      return true;
    },
    {
      message: 'Deposit configuration required for deposit rule type',
    }
  )
  .refine(
    (data) => {
      // If rule_type is payment_schedule, schedule_config must be provided
      if (data.rule_type === 'payment_schedule') {
        return data.schedule_config && data.schedule_config.length > 0;
      }
      return true;
    },
    {
      message: 'Payment schedule configuration required for payment_schedule rule type',
    }
  )
  .refine(
    (data) => {
      // If applies_to_dates is true, start_date and end_date must be provided
      if (data.applies_to_dates) {
        return data.start_date && data.end_date;
      }
      return true;
    },
    {
      message: 'Start and end dates required when rule applies to dates',
    }
  )
  .refine(
    (data) => {
      // If start_date and end_date are provided, start must be before or equal to end
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  )
  .refine(
    (data) => {
      // If schedule_config is provided and all milestones use percentage, they must sum to 100
      if (data.schedule_config && data.schedule_config.length > 0) {
        const allPercentages = data.schedule_config.every(
          (m) => m.amount_type === 'percentage'
        );
        if (allPercentages) {
          const total = data.schedule_config.reduce((sum, m) => sum + m.amount, 0);
          return Math.abs(total - 100) < 0.01; // Allow small floating point tolerance
        }
      }
      return true;
    },
    {
      message: 'Milestone percentages must sum to 100%',
    }
  )
  .refine(
    (data) => {
      // If deposit_type is percentage, deposit_amount must be <= 100
      if (data.deposit_type === 'percentage' && data.deposit_amount) {
        return data.deposit_amount <= 100;
      }
      return true;
    },
    {
      message: 'Deposit percentage cannot exceed 100',
    }
  )
  .refine(
    (data) => {
      // If deposit_due requires days, deposit_due_days must be provided
      if (
        (data.deposit_due === 'days_before_checkin' || data.deposit_due === 'days_after_booking') &&
        data.deposit_type
      ) {
        return data.deposit_due_days !== undefined;
      }
      return true;
    },
    {
      message: 'Deposit due days required for days-based due timing',
    }
  )
  .refine(
    (data) => {
      // If balance_due requires days, balance_due_days must be provided
      if (
        (data.balance_due === 'days_before_checkin' || data.balance_due === 'days_after_booking') &&
        data.deposit_type
      ) {
        return data.balance_due_days !== undefined;
      }
      return true;
    },
    {
      message: 'Balance due days required for days-based due timing',
    }
  );

// ============================================================================
// UPDATE PAYMENT RULE SCHEMA
// ============================================================================

export const updatePaymentRuleSchema = z.object({
  rule_name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  rule_type: paymentRuleTypeSchema.optional(),

  // Deposit configuration
  deposit_type: amountTypeSchema.optional(),
  deposit_amount: z.number().positive().optional(),
  deposit_due: dueTimingSchema.optional(),
  deposit_due_days: z.number().int().nonnegative().optional(),
  balance_due: dueTimingSchema.optional(),
  balance_due_days: z.number().int().nonnegative().optional(),

  // Schedule configuration
  schedule_config: z.array(scheduleMilestoneConfigSchema).optional(),

  // Optional constraints
  allowed_payment_methods: z.array(z.string()).optional(),

  // Applicability
  is_active: z.boolean().optional(),
  applies_to_dates: z.boolean().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.number().int().optional(),
})
  .refine(
    (data) => {
      // If start_date and end_date are provided, start must be before or equal to end
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  )
  .refine(
    (data) => {
      // If schedule_config is provided and all milestones use percentage, they must sum to 100
      if (data.schedule_config && data.schedule_config.length > 0) {
        const allPercentages = data.schedule_config.every(
          (m) => m.amount_type === 'percentage'
        );
        if (allPercentages) {
          const total = data.schedule_config.reduce((sum, m) => sum + m.amount, 0);
          return Math.abs(total - 100) < 0.01;
        }
      }
      return true;
    },
    {
      message: 'Milestone percentages must sum to 100%',
    }
  )
  .refine(
    (data) => {
      // If deposit_type is percentage, deposit_amount must be <= 100
      if (data.deposit_type === 'percentage' && data.deposit_amount) {
        return data.deposit_amount <= 100;
      }
      return true;
    },
    {
      message: 'Deposit percentage cannot exceed 100',
    }
  );
