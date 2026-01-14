/**
 * Payment Schedule Service
 *
 * Handles generation and management of payment schedules for bookings.
 * Generates schedules from payment rules and calculates milestone due dates.
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import type {
  PaymentRule,
  ScheduleMilestoneConfig,
  AmountType,
  DueTiming,
} from '../types/payment-rules.types';
import { findActivePaymentRule } from './payment-rules.service';

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
  due_date: string; // ISO date string
  due_type: string;
  status: 'pending' | 'overdue' | 'paid' | 'partial' | 'cancelled';
  amount_paid: number;
  paid_at: string | null;
  created_from_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Booking data needed for schedule generation
 */
interface BookingData {
  id: string;
  room_id: string;
  checkin_date: string;
  total_amount: number;
  currency: string;
  booking_date: string;
}

/**
 * Generate payment schedule for a booking based on room payment rules
 */
export const generatePaymentSchedule = async (
  bookingData: BookingData
): Promise<PaymentScheduleMilestone[]> => {
  try {
    // Step 1: Find active payment rule for this room and booking dates
    const paymentRule = await findActivePaymentRule(
      bookingData.room_id,
      bookingData.checkin_date
    );

    // If no payment rule, no schedule needed (flexible payment)
    if (!paymentRule) {
      return [];
    }

    // Step 2: Generate milestones based on rule type
    let milestones: PaymentScheduleMilestone[];

    if (paymentRule.rule_type === 'deposit') {
      milestones = await generateDepositSchedule(bookingData, paymentRule);
    } else if (paymentRule.rule_type === 'payment_schedule') {
      milestones = await generateInstallmentSchedule(bookingData, paymentRule);
    } else {
      // Flexible payment - no schedule
      return [];
    }

    // Step 3: Insert milestones into database
    const { data: insertedMilestones, error } = await getAdminClient()
      .from('booking_payment_schedules')
      .insert(
        milestones.map((m) => ({
          booking_id: m.booking_id,
          milestone_sequence: m.milestone_sequence,
          milestone_name: m.milestone_name,
          amount_due: m.amount_due,
          currency: m.currency,
          due_date: m.due_date,
          due_type: m.due_type,
          status: m.status,
          amount_paid: m.amount_paid,
          created_from_rule_id: paymentRule.id,
        }))
      )
      .select();

    if (error) {
      throw new AppError(`Failed to create payment schedule: ${error.message}`, 500);
    }

    return insertedMilestones as PaymentScheduleMilestone[];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate payment schedule', 500);
  }
};

/**
 * Generate deposit + balance schedule (2 milestones)
 */
const generateDepositSchedule = async (
  bookingData: BookingData,
  rule: PaymentRule
): Promise<PaymentScheduleMilestone[]> => {
  const milestones: Partial<PaymentScheduleMilestone>[] = [];

  // Calculate deposit amount
  const depositAmount =
    rule.deposit_type === 'percentage'
      ? (bookingData.total_amount * rule.deposit_amount) / 100
      : rule.deposit_amount;

  const balanceAmount = bookingData.total_amount - depositAmount;

  // Milestone 1: Deposit
  const depositDueDate = calculateDueDate(
    rule.deposit_due!,
    rule.deposit_due_days || null,
    bookingData.checkin_date,
    bookingData.booking_date
  );

  milestones.push({
    booking_id: bookingData.id,
    milestone_sequence: 1,
    milestone_name: 'Deposit',
    amount_due: depositAmount,
    currency: bookingData.currency,
    due_date: depositDueDate,
    due_type: rule.deposit_due!,
    status: 'pending',
    amount_paid: 0,
    paid_at: null,
  });

  // Milestone 2: Balance
  const balanceDueDate = calculateDueDate(
    rule.balance_due!,
    rule.balance_due_days || null,
    bookingData.checkin_date,
    bookingData.booking_date
  );

  milestones.push({
    booking_id: bookingData.id,
    milestone_sequence: 2,
    milestone_name: 'Balance',
    amount_due: balanceAmount,
    currency: bookingData.currency,
    due_date: balanceDueDate,
    due_type: rule.balance_due!,
    status: 'pending',
    amount_paid: 0,
    paid_at: null,
  });

  return milestones as PaymentScheduleMilestone[];
};

/**
 * Generate installment schedule (multiple milestones)
 */
const generateInstallmentSchedule = async (
  bookingData: BookingData,
  rule: PaymentRule
): Promise<PaymentScheduleMilestone[]> => {
  if (!rule.schedule_config || rule.schedule_config.length === 0) {
    throw new AppError('Payment schedule rule has no milestone configuration', 400);
  }

  const milestones: Partial<PaymentScheduleMilestone>[] = [];

  // Validate schedule adds up correctly
  const totalPercentage = rule.schedule_config
    .filter((m) => m.amount_type === 'percentage')
    .reduce((sum, m) => sum + m.amount, 0);

  const allPercentages = rule.schedule_config.every((m) => m.amount_type === 'percentage');

  if (allPercentages && Math.abs(totalPercentage - 100) > 0.01) {
    throw new AppError(
      `Payment schedule percentages must total 100% (current: ${totalPercentage}%)`,
      400
    );
  }

  // Generate milestone for each schedule item
  for (const scheduleItem of rule.schedule_config) {
    const amount = calculateMilestoneAmount(
      scheduleItem.amount_type,
      scheduleItem.amount,
      bookingData.total_amount
    );

    const dueDate = calculateDueDate(
      scheduleItem.due,
      scheduleItem.days || null,
      bookingData.checkin_date,
      bookingData.booking_date,
      scheduleItem.specific_date || null
    );

    milestones.push({
      booking_id: bookingData.id,
      milestone_sequence: scheduleItem.sequence,
      milestone_name: scheduleItem.name,
      amount_due: amount,
      currency: bookingData.currency,
      due_date: dueDate,
      due_type: scheduleItem.due,
      status: 'pending',
      amount_paid: 0,
      paid_at: null,
    });
  }

  return milestones as PaymentScheduleMilestone[];
};

/**
 * Calculate milestone amount based on type
 */
const calculateMilestoneAmount = (
  amountType: AmountType,
  amount: number,
  totalBookingAmount: number
): number => {
  if (amountType === 'percentage') {
    return (totalBookingAmount * amount) / 100;
  }
  return amount; // Fixed amount
};

/**
 * Calculate due date for a milestone
 */
const calculateDueDate = (
  dueTiming: DueTiming,
  days: number | null,
  checkinDate: string,
  bookingDate: string,
  specificDate?: string | null
): string => {
  const checkin = new Date(checkinDate);
  const booking = new Date(bookingDate);

  switch (dueTiming) {
    case 'at_booking':
      return bookingDate;

    case 'on_checkin':
      return checkinDate;

    case 'days_before_checkin':
      if (days === null) {
        throw new AppError('days_before_checkin requires days parameter', 400);
      }
      const beforeCheckin = new Date(checkin);
      beforeCheckin.setDate(beforeCheckin.getDate() - days);
      return beforeCheckin.toISOString().split('T')[0];

    case 'days_after_booking':
      if (days === null) {
        throw new AppError('days_after_booking requires days parameter', 400);
      }
      const afterBooking = new Date(booking);
      afterBooking.setDate(afterBooking.getDate() + days);
      return afterBooking.toISOString().split('T')[0];

    case 'specific_date':
      if (!specificDate) {
        throw new AppError('specific_date requires specific_date parameter', 400);
      }
      return specificDate;

    default:
      throw new AppError(`Unknown due timing: ${dueTiming}`, 400);
  }
};

/**
 * Get payment schedule for a booking
 */
export const getBookingPaymentSchedule = async (
  bookingId: string
): Promise<PaymentScheduleMilestone[]> => {
  const { data, error } = await getAdminClient()
    .from('booking_payment_schedules')
    .select('*')
    .eq('booking_id', bookingId)
    .order('milestone_sequence', { ascending: true });

  if (error) {
    throw new AppError(`Failed to fetch payment schedule: ${error.message}`, 500);
  }

  return data as PaymentScheduleMilestone[];
};

/**
 * Update milestone status when payment is recorded
 */
export const updateMilestoneStatus = async (
  milestoneId: string,
  amountPaid: number,
  amountDue: number
): Promise<void> => {
  const status: 'paid' | 'partial' = amountPaid >= amountDue ? 'paid' : 'partial';

  const { error } = await getAdminClient()
    .from('booking_payment_schedules')
    .update({
      amount_paid: amountPaid,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', milestoneId);

  if (error) {
    throw new AppError(`Failed to update milestone status: ${error.message}`, 500);
  }
};

/**
 * Mark overdue milestones
 * Should be run periodically via cron job
 */
export const markOverdueMilestones = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getAdminClient()
    .from('booking_payment_schedules')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select();

  if (error) {
    throw new AppError(`Failed to mark overdue milestones: ${error.message}`, 500);
  }

  return data?.length || 0;
};

/**
 * Cancel all pending milestones for a booking
 * (Used when booking is cancelled)
 */
export const cancelBookingSchedule = async (bookingId: string): Promise<void> => {
  const { error } = await getAdminClient()
    .from('booking_payment_schedules')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('booking_id', bookingId)
    .in('status', ['pending', 'overdue', 'partial']);

  if (error) {
    throw new AppError(`Failed to cancel payment schedule: ${error.message}`, 500);
  }
};
