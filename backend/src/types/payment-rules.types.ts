/**
 * Payment Rules Types
 *
 * Types for payment rules configuration and payment schedule management.
 * Property owners can define deposit requirements, installment schedules,
 * and payment rules for their rooms.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PaymentRuleType = 'deposit' | 'payment_schedule' | 'flexible';

export type AmountType = 'percentage' | 'fixed_amount';

export type DueTiming =
  | 'at_booking'
  | 'days_before_checkin'
  | 'days_after_booking'
  | 'on_checkin'
  | 'specific_date';

export type MilestoneStatus = 'pending' | 'overdue' | 'partial' | 'paid' | 'cancelled';

// ============================================================================
// PAYMENT RULE INTERFACES
// ============================================================================

/**
 * Payment schedule milestone configuration (stored in schedule_config JSONB)
 */
export interface ScheduleMilestoneConfig {
  sequence: number;                    // Order: 1, 2, 3...
  name: string;                        // "Deposit", "First Installment", etc.
  amount_type: AmountType;             // 'percentage' or 'fixed_amount'
  amount: number;                      // Value (e.g., 30 for 30%, or 1000 for R1000)
  due: DueTiming;                      // When this milestone is due
  days?: number;                       // Required if due is 'days_before_checkin' or 'days_after_booking'
  specific_date?: string;              // Required if due is 'specific_date' (ISO date)
}

/**
 * Complete payment rule from database
 */
export interface PaymentRule {
  id: string;
  room_id: string;

  // Rule identification
  rule_name: string;
  description: string | null;
  rule_type: PaymentRuleType;

  // Deposit configuration (for rule_type = 'deposit')
  deposit_type: AmountType | null;
  deposit_amount: number | null;
  deposit_due: DueTiming | null;
  deposit_due_days: number | null;
  balance_due: DueTiming | null;
  balance_due_days: number | null;

  // Schedule configuration (for rule_type = 'payment_schedule')
  schedule_config: ScheduleMilestoneConfig[] | null;

  // Payment method restrictions
  allowed_payment_methods: string[] | null;

  // Applicability
  is_active: boolean;
  applies_to_dates: boolean;
  start_date: string | null;  // ISO date
  end_date: string | null;    // ISO date
  priority: number;

  // Audit
  created_at: string;  // ISO timestamp
  updated_at: string;  // ISO timestamp
  created_by: string | null;

  // Room assignments (populated from junction table)
  room_count?: number;  // Count of rooms using this rule
  assigned_room_ids?: string[];  // Array of room IDs using this rule
  room_payment_rule_assignments?: Array<{
    id: string;
    room_id: string;
    assigned_at: string;
  }>;
}

/**
 * Payment rule with related data (for detailed views)
 */
export interface PaymentRuleWithDetails extends PaymentRule {
  room_name?: string;
  property_id?: string;
  property_name?: string;
}

/**
 * Edit permission check result
 */
export interface RuleEditPermission {
  canEdit: boolean;
  assignedRoomCount: number;
  roomNames: string[];
}

// ============================================================================
// PAYMENT SCHEDULE INTERFACES
// ============================================================================

/**
 * Payment schedule milestone (generated from payment rules)
 */
export interface PaymentScheduleMilestone {
  id: string;
  booking_id: string;

  // Milestone identification
  milestone_sequence: number;
  milestone_name: string;

  // Amount details
  amount_due: number;
  currency: string;

  // Due date
  due_date: string;  // ISO date
  due_type: DueTiming;

  // Payment tracking
  status: MilestoneStatus;
  amount_paid: number;
  paid_at: string | null;  // ISO timestamp

  // Traceability
  created_from_rule_id: string | null;

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Payment schedule with milestones
 */
export interface PaymentSchedule {
  booking_id: string;
  total_amount: number;
  currency: string;
  milestones: PaymentScheduleMilestone[];

  // Summary
  total_scheduled: number;
  total_paid: number;
  total_outstanding: number;

  // Status indicators
  has_overdue: boolean;
  next_due_milestone: PaymentScheduleMilestone | null;
}

// ============================================================================
// API REQUEST/RESPONSE DTOS
// ============================================================================

/**
 * Request DTO for creating a payment rule
 */
export interface CreatePaymentRuleRequest {
  room_id: string;
  rule_name: string;
  description?: string;
  rule_type: PaymentRuleType;

  // Deposit configuration (required if rule_type = 'deposit')
  deposit_type?: AmountType;
  deposit_amount?: number;
  deposit_due?: DueTiming;
  deposit_due_days?: number;
  balance_due?: DueTiming;
  balance_due_days?: number;

  // Schedule configuration (required if rule_type = 'payment_schedule')
  schedule_config?: ScheduleMilestoneConfig[];

  // Optional constraints
  allowed_payment_methods?: string[];

  // Applicability
  is_active?: boolean;
  applies_to_dates?: boolean;
  start_date?: string;  // ISO date
  end_date?: string;    // ISO date
  priority?: number;
}

/**
 * Request DTO for updating a payment rule
 */
export interface UpdatePaymentRuleRequest {
  rule_name?: string;
  description?: string;
  rule_type?: PaymentRuleType;

  // Deposit configuration
  deposit_type?: AmountType;
  deposit_amount?: number;
  deposit_due?: DueTiming;
  deposit_due_days?: number;
  balance_due?: DueTiming;
  balance_due_days?: number;

  // Schedule configuration
  schedule_config?: ScheduleMilestoneConfig[];

  // Optional constraints
  allowed_payment_methods?: string[];

  // Applicability
  is_active?: boolean;
  applies_to_dates?: boolean;
  start_date?: string;
  end_date?: string;
  priority?: number;
}

/**
 * Response DTO for listing payment rules
 */
export interface ListPaymentRulesResponse {
  rules: PaymentRule[];
  total: number;
}

/**
 * Response DTO for getting a payment schedule
 */
export interface GetPaymentScheduleResponse {
  schedule: PaymentSchedule;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Options for finding active payment rule for a booking
 */
export interface FindActiveRuleOptions {
  room_id: string;
  booking_date: string;     // ISO date
  check_in_date: string;    // ISO date
}

/**
 * Options for generating payment schedule
 */
export interface GenerateScheduleOptions {
  booking_id: string;
  room_id: string;
  total_amount: number;
  currency: string;
  booking_date: string;     // ISO date - when booking was created
  check_in_date: string;    // ISO date
  check_out_date?: string;  // ISO date (optional, for context)
}

/**
 * Result of applying a payment to a milestone
 */
export interface ApplyPaymentToMilestoneResult {
  milestone: PaymentScheduleMilestone;
  previous_status: MilestoneStatus;
  new_status: MilestoneStatus;
  remaining_amount: number;  // Amount of payment not applied (if any)
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation error details
 */
export interface PaymentRuleValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface PaymentRuleValidationResult {
  valid: boolean;
  errors: PaymentRuleValidationError[];
}

// ============================================================================
// LABELS & DISPLAY
// ============================================================================

export const PAYMENT_RULE_TYPE_LABELS: Record<PaymentRuleType, string> = {
  deposit: 'Deposit + Balance',
  payment_schedule: 'Payment Schedule',
  flexible: 'Flexible Payment',
};

export const AMOUNT_TYPE_LABELS: Record<AmountType, string> = {
  percentage: 'Percentage (%)',
  fixed_amount: 'Fixed Amount',
};

export const DUE_TIMING_LABELS: Record<DueTiming, string> = {
  at_booking: 'At Booking',
  days_before_checkin: 'Days Before Check-in',
  days_after_booking: 'Days After Booking',
  on_checkin: 'On Check-in Date',
  specific_date: 'Specific Date',
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'Pending',
  overdue: 'Overdue',
  partial: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a milestone is due soon (within 7 days)
 */
export function isMilestoneDueSoon(milestone: PaymentScheduleMilestone): boolean {
  if (milestone.status !== 'pending') return false;

  const dueDate = new Date(milestone.due_date);
  const today = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Check if a milestone is overdue
 */
export function isMilestoneOverdue(milestone: PaymentScheduleMilestone): boolean {
  if (milestone.status === 'paid' || milestone.status === 'cancelled') return false;

  const dueDate = new Date(milestone.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);  // Reset to start of day

  return dueDate < today && milestone.amount_paid < milestone.amount_due;
}

/**
 * Calculate days until/since due date
 */
export function getDaysUntilDue(milestone: PaymentScheduleMilestone): number {
  const dueDate = new Date(milestone.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format milestone for display
 */
export function formatMilestoneName(milestone: PaymentScheduleMilestone): string {
  return `${milestone.milestone_name} (#${milestone.milestone_sequence})`;
}

/**
 * Calculate completion percentage for milestone
 */
export function getMilestoneCompletionPercentage(milestone: PaymentScheduleMilestone): number {
  if (milestone.amount_due === 0) return 0;
  return Math.min(100, (milestone.amount_paid / milestone.amount_due) * 100);
}
