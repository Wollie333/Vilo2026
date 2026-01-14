/**
 * Payment Rules Types (Frontend)
 *
 * Types for payment rules configuration UI.
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
 * Payment schedule milestone configuration
 */
export interface ScheduleMilestoneConfig {
  sequence: number;
  name: string;
  amount_type: AmountType;
  amount: number;
  due: DueTiming;
  days?: number;
  specific_date?: string;
}

/**
 * Payment rule from API
 */
export interface PaymentRule {
  id: string;
  room_id: string;
  rule_name: string;
  description: string | null;
  rule_type: PaymentRuleType;

  // Deposit configuration
  deposit_type: AmountType | null;
  deposit_amount: number | null;
  deposit_due: DueTiming | null;
  deposit_due_days: number | null;
  balance_due: DueTiming | null;
  balance_due_days: number | null;

  // Schedule configuration
  schedule_config: ScheduleMilestoneConfig[] | null;

  // Optional constraints
  allowed_payment_methods: string[] | null;

  // Applicability
  is_active: boolean;
  applies_to_dates: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Room assignments (populated from junction table)
  room_count?: number;
  assigned_room_ids?: string[];
  room_payment_rule_assignments?: Array<{
    id: string;
    room_id: string;
    assigned_at: string;
  }>;
}

/**
 * Payment rule with related data
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
// FORM DATA TYPES
// ============================================================================

/**
 * Milestone form data (for schedule builder)
 */
export interface MilestoneFormData {
  sequence: number;
  name: string;
  amount_type: AmountType;
  amount: number;
  due: DueTiming;
  days?: number;
  specific_date?: string;
}

/**
 * Payment rule form data (for create/edit)
 */
export interface PaymentRuleFormData {
  id?: string;  // Only for edit mode
  rule_name: string;
  description: string;
  rule_type: PaymentRuleType;

  // Deposit configuration (only for deposit rules)
  deposit_type?: AmountType;
  deposit_amount?: number;
  deposit_due?: DueTiming;
  deposit_due_days?: number;
  balance_due?: DueTiming;
  balance_due_days?: number;

  // Schedule configuration (only for payment_schedule rules)
  schedule_config: MilestoneFormData[];

  // Optional constraints
  allowed_payment_methods: string[];

  // Applicability
  is_active: boolean;
  applies_to_dates: boolean;
  start_date: string;
  end_date: string;
  priority: number;
}

// ============================================================================
// PAYMENT SCHEDULE INTERFACES
// ============================================================================

/**
 * Payment schedule milestone
 */
export interface PaymentScheduleMilestone {
  id: string;
  booking_id: string;
  milestone_sequence: number;
  milestone_name: string;
  amount_due: number;
  currency: string;
  due_date: string;
  due_type: DueTiming;
  status: MilestoneStatus;
  amount_paid: number;
  paid_at: string | null;
  created_from_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Complete payment schedule
 */
export interface PaymentSchedule {
  booking_id: string;
  total_amount: number;
  currency: string;
  milestones: PaymentScheduleMilestone[];
  total_scheduled: number;
  total_paid: number;
  total_outstanding: number;
  has_overdue: boolean;
  next_due_milestone: PaymentScheduleMilestone | null;
}

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export interface CreatePaymentRuleRequest {
  property_id: string;
  rule_name: string;
  description?: string;
  rule_type: PaymentRuleType;
  deposit_type?: AmountType;
  deposit_amount?: number;
  deposit_due?: DueTiming;
  deposit_due_days?: number;
  balance_due?: DueTiming;
  balance_due_days?: number;
  schedule_config?: ScheduleMilestoneConfig[];
  allowed_payment_methods?: string[];
  is_active?: boolean;
  applies_to_dates?: boolean;
  start_date?: string;
  end_date?: string;
  priority?: number;
}

export interface UpdatePaymentRuleRequest extends Partial<CreatePaymentRuleRequest> {}

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
 * Convert PaymentRule to form data for editing
 */
export function ruleToFormData(rule: PaymentRule): PaymentRuleFormData {
  return {
    id: rule.id,
    rule_name: rule.rule_name,
    description: rule.description || '',
    rule_type: rule.rule_type,
    deposit_type: rule.deposit_type || 'percentage',
    deposit_amount: rule.deposit_amount || 0,
    deposit_due: rule.deposit_due || 'at_booking',
    deposit_due_days: rule.deposit_due_days || 0,
    balance_due: rule.balance_due || 'on_checkin',
    balance_due_days: rule.balance_due_days || 0,
    schedule_config: rule.schedule_config || [],
    allowed_payment_methods: rule.allowed_payment_methods || [],
    is_active: rule.is_active,
    applies_to_dates: rule.applies_to_dates,
    start_date: rule.start_date || '',
    end_date: rule.end_date || '',
    priority: rule.priority,
  };
}

/**
 * Convert form data to API request
 */
export function formDataToRequest(
  formData: PaymentRuleFormData,
  propertyId: string,
  mode: 'create' | 'edit'
): CreatePaymentRuleRequest | UpdatePaymentRuleRequest {
  const base: CreatePaymentRuleRequest = {
    property_id: propertyId,
    rule_name: formData.rule_name,
    description: formData.description || undefined,
    rule_type: formData.rule_type,
    is_active: formData.is_active,
    applies_to_dates: formData.applies_to_dates,
    priority: formData.priority,
  };

  // Add deposit configuration if deposit rule
  if (formData.rule_type === 'deposit') {
    base.deposit_type = formData.deposit_type;
    base.deposit_amount = formData.deposit_amount;
    base.deposit_due = formData.deposit_due;
    base.deposit_due_days =
      formData.deposit_due === 'days_before_checkin' || formData.deposit_due === 'days_after_booking'
        ? formData.deposit_due_days
        : undefined;
    base.balance_due = formData.balance_due;
    base.balance_due_days =
      formData.balance_due === 'days_before_checkin' || formData.balance_due === 'days_after_booking'
        ? formData.balance_due_days
        : undefined;
  }

  // Add schedule configuration if payment schedule rule
  if (formData.rule_type === 'payment_schedule') {
    base.schedule_config = formData.schedule_config.map(m => ({
      sequence: m.sequence,
      name: m.name,
      amount_type: m.amount_type,
      amount: m.amount,
      due: m.due,
      days: m.days,
      specific_date: m.specific_date,
    }));
  }

  // Add seasonal dates if applicable
  if (formData.applies_to_dates) {
    base.start_date = formData.start_date;
    base.end_date = formData.end_date;
  }

  // Add payment method constraints if any
  if (formData.allowed_payment_methods.length > 0) {
    base.allowed_payment_methods = formData.allowed_payment_methods;
  }

  return base;
}

/**
 * Create empty form data for new rule
 */
export function createEmptyFormData(): PaymentRuleFormData {
  return {
    rule_name: '',
    description: '',
    rule_type: 'flexible',
    deposit_type: 'percentage',
    deposit_amount: 30,
    deposit_due: 'at_booking',
    deposit_due_days: 0,
    balance_due: 'on_checkin',
    balance_due_days: 0,
    schedule_config: [],
    allowed_payment_methods: [],
    is_active: true,
    applies_to_dates: false,
    start_date: '',
    end_date: '',
    priority: 0,
  };
}

/**
 * Check if milestone is due soon (within 7 days)
 */
export function isMilestoneDueSoon(milestone: PaymentScheduleMilestone): boolean {
  if (milestone.status !== 'pending') return false;
  const dueDate = new Date(milestone.due_date);
  const today = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Check if milestone is overdue
 */
export function isMilestoneOverdue(milestone: PaymentScheduleMilestone): boolean {
  if (milestone.status === 'paid' || milestone.status === 'cancelled') return false;
  const dueDate = new Date(milestone.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
 * Calculate milestone completion percentage
 */
export function getMilestoneCompletionPercentage(milestone: PaymentScheduleMilestone): number {
  if (milestone.amount_due === 0) return 0;
  return Math.min(100, (milestone.amount_paid / milestone.amount_due) * 100);
}

/**
 * Format milestone name for display
 */
export function formatMilestoneName(milestone: PaymentScheduleMilestone): string {
  return `${milestone.milestone_name} (#${milestone.milestone_sequence})`;
}
