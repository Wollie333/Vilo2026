-- Migration: 036_create_payment_rules_schema.sql
-- Description: Create payment rules and schedule tables for installment payment support
-- Author: Claude
-- Date: 2026-01-09

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Payment rule type enum
DO $$ BEGIN
  CREATE TYPE payment_rule_type AS ENUM (
    'deposit',           -- Simple deposit + balance
    'payment_schedule',  -- Multiple installments
    'flexible'           -- No requirements, pay as you go
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Amount type enum (for rules and milestones)
DO $$ BEGIN
  CREATE TYPE amount_type AS ENUM (
    'percentage',        -- Percentage of booking total
    'fixed_amount'       -- Fixed currency amount
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Due timing enum
DO $$ BEGIN
  CREATE TYPE due_timing AS ENUM (
    'at_booking',              -- Due immediately when booking created
    'days_before_checkin',     -- Due X days before check-in date
    'days_after_booking',      -- Due X days after booking created
    'on_checkin',              -- Due on check-in date
    'specific_date'            -- Due on a specific calendar date
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment schedule milestone status enum
DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM (
    'pending',     -- Not yet due or paid
    'overdue',     -- Past due date and not paid
    'partial',     -- Partially paid (amount_paid < amount_due)
    'paid',        -- Fully paid (amount_paid >= amount_due)
    'cancelled'    -- Cancelled (booking cancelled or refunded)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ROOM PAYMENT RULES TABLE
-- Configuration for payment requirements per room
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_payment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  -- Rule identification
  rule_name VARCHAR(100) NOT NULL,  -- e.g., "Standard Deposit", "3-Part Payment Plan"
  description TEXT,  -- Explain the rule to property owners
  rule_type payment_rule_type NOT NULL DEFAULT 'flexible',

  -- Deposit configuration (used when rule_type = 'deposit')
  deposit_type amount_type,  -- 'percentage' or 'fixed_amount'
  deposit_amount DECIMAL(12, 2),  -- Amount or percentage value
  deposit_due due_timing,  -- When deposit is due
  deposit_due_days INTEGER,  -- If due_timing requires days value
  balance_due due_timing,  -- When remaining balance is due
  balance_due_days INTEGER,  -- If due_timing requires days value

  -- Payment schedule configuration (used when rule_type = 'payment_schedule')
  -- Stored as JSONB array of milestones:
  -- [{
  --   "sequence": 1,
  --   "name": "Deposit",
  --   "amount_type": "percentage",
  --   "amount": 30,
  --   "due": "at_booking"
  -- }, {
  --   "sequence": 2,
  --   "name": "Second Payment",
  --   "amount_type": "percentage",
  --   "amount": 30,
  --   "due": "days_before_checkin",
  --   "days": 30
  -- }, {
  --   "sequence": 3,
  --   "name": "Final Payment",
  --   "amount_type": "percentage",
  --   "amount": 40,
  --   "due": "on_checkin"
  -- }]
  schedule_config JSONB,

  -- Optional: restrict which payment methods are allowed
  -- NULL = all methods allowed, otherwise array of allowed methods
  allowed_payment_methods VARCHAR(50)[],

  -- Applicability
  is_active BOOLEAN DEFAULT true NOT NULL,
  applies_to_dates BOOLEAN DEFAULT false NOT NULL,  -- Whether this rule is seasonal
  start_date DATE,  -- If seasonal, start date (inclusive)
  end_date DATE,  -- If seasonal, end date (inclusive)
  priority INTEGER DEFAULT 0 NOT NULL,  -- For overlapping seasonal rules (higher = higher priority)

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),

  -- Constraints
  CONSTRAINT valid_deposit_config CHECK (
    rule_type != 'deposit' OR (
      deposit_type IS NOT NULL AND
      deposit_amount IS NOT NULL AND
      deposit_due IS NOT NULL AND
      balance_due IS NOT NULL
    )
  ),
  CONSTRAINT valid_schedule_config CHECK (
    rule_type != 'payment_schedule' OR schedule_config IS NOT NULL
  ),
  CONSTRAINT valid_seasonal_dates CHECK (
    applies_to_dates = false OR (start_date IS NOT NULL AND end_date IS NOT NULL AND start_date <= end_date)
  ),
  CONSTRAINT positive_deposit_amount CHECK (deposit_amount IS NULL OR deposit_amount > 0),
  CONSTRAINT valid_deposit_percentage CHECK (
    deposit_type != 'percentage' OR deposit_amount IS NULL OR (deposit_amount > 0 AND deposit_amount <= 100)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_room_id ON public.room_payment_rules(room_id);
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_active ON public.room_payment_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_dates ON public.room_payment_rules(start_date, end_date) WHERE applies_to_dates = true;

-- RLS policies for room_payment_rules
ALTER TABLE public.room_payment_rules ENABLE ROW LEVEL SECURITY;

-- Property owners can view rules for their properties
CREATE POLICY room_payment_rules_select_policy ON public.room_payment_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- Property owners can create rules for their rooms
CREATE POLICY room_payment_rules_insert_policy ON public.room_payment_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- Property owners can update their own rules
CREATE POLICY room_payment_rules_update_policy ON public.room_payment_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- Property owners can delete their own rules
CREATE POLICY room_payment_rules_delete_policy ON public.room_payment_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- BOOKING PAYMENT SCHEDULES TABLE
-- Generated payment milestones for each booking based on room rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Milestone identification
  milestone_sequence INTEGER NOT NULL,  -- 1, 2, 3... order of payment
  milestone_name VARCHAR(100) NOT NULL,  -- e.g., "Deposit", "First Installment", "Balance"

  -- Amount details
  amount_due DECIMAL(12, 2) NOT NULL,  -- Amount due for this milestone
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Due date calculation
  due_date DATE NOT NULL,  -- Calculated due date for this milestone
  due_type due_timing NOT NULL,  -- How the due date was calculated

  -- Payment tracking
  status milestone_status DEFAULT 'pending' NOT NULL,
  amount_paid DECIMAL(12, 2) DEFAULT 0 NOT NULL,  -- How much has been paid toward this milestone
  paid_at TIMESTAMPTZ,  -- When milestone was fully paid (when status became 'paid')

  -- Traceability
  created_from_rule_id UUID REFERENCES public.room_payment_rules(id) ON DELETE SET NULL,  -- Which rule generated this

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_amount_due CHECK (amount_due > 0),
  CONSTRAINT valid_amount_paid CHECK (amount_paid >= 0 AND amount_paid <= amount_due + 0.01),  -- Allow 1 cent overpayment for rounding
  CONSTRAINT unique_booking_sequence UNIQUE (booking_id, milestone_sequence)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_payment_schedules_booking_id ON public.booking_payment_schedules(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payment_schedules_status ON public.booking_payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_booking_payment_schedules_due_date ON public.booking_payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_booking_payment_schedules_pending ON public.booking_payment_schedules(booking_id, status, due_date)
  WHERE status IN ('pending', 'overdue', 'partial');

-- RLS policies for booking_payment_schedules
ALTER TABLE public.booking_payment_schedules ENABLE ROW LEVEL SECURITY;

-- Property owners and booking guests can view schedules
CREATE POLICY booking_payment_schedules_select_policy ON public.booking_payment_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      INNER JOIN public.properties p ON b.property_id = p.id
      WHERE b.id = booking_payment_schedules.booking_id
      AND (p.owner_id = auth.uid() OR b.guest_id = auth.uid())
    )
  );

-- System can create schedules (handled by booking service)
CREATE POLICY booking_payment_schedules_insert_policy ON public.booking_payment_schedules
  FOR INSERT
  WITH CHECK (true);  -- Controlled by application logic

-- System can update schedules (payment recording updates status)
CREATE POLICY booking_payment_schedules_update_policy ON public.booking_payment_schedules
  FOR UPDATE
  USING (true);  -- Controlled by application logic

-- ============================================================================
-- ALTER BOOKING_PAYMENTS TABLE
-- Add fields for receipt generation and milestone tracking
-- ============================================================================

-- Add receipt fields
ALTER TABLE public.booking_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
ALTER TABLE public.booking_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.booking_payments ADD COLUMN IF NOT EXISTS applied_to_milestone_id UUID REFERENCES public.booking_payment_schedules(id) ON DELETE SET NULL;

-- Create index for receipt number (must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_payments_receipt_number ON public.booking_payments(receipt_number) WHERE receipt_number IS NOT NULL;

-- Create index for milestone linkage
CREATE INDEX IF NOT EXISTS idx_booking_payments_milestone ON public.booking_payments(applied_to_milestone_id) WHERE applied_to_milestone_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_payment_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for room_payment_rules
DROP TRIGGER IF EXISTS room_payment_rules_updated_at_trigger ON public.room_payment_rules;
CREATE TRIGGER room_payment_rules_updated_at_trigger
  BEFORE UPDATE ON public.room_payment_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_room_payment_rules_updated_at();

-- Function to automatically update updated_at timestamp for schedules
CREATE OR REPLACE FUNCTION update_booking_payment_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking_payment_schedules
DROP TRIGGER IF EXISTS booking_payment_schedules_updated_at_trigger ON public.booking_payment_schedules;
CREATE TRIGGER booking_payment_schedules_updated_at_trigger
  BEFORE UPDATE ON public.booking_payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_payment_schedules_updated_at();

-- Function to automatically mark milestones as overdue
CREATE OR REPLACE FUNCTION check_overdue_milestones()
RETURNS void AS $$
BEGIN
  UPDATE public.booking_payment_schedules
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND amount_paid < amount_due;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.room_payment_rules IS 'Payment rules configuration for rooms - defines deposit requirements, payment schedules, and installment plans';
COMMENT ON TABLE public.booking_payment_schedules IS 'Generated payment schedule milestones for each booking based on room payment rules';
COMMENT ON COLUMN public.room_payment_rules.rule_type IS 'Type of payment rule: deposit (simple deposit+balance), payment_schedule (multiple installments), or flexible (no requirements)';
COMMENT ON COLUMN public.room_payment_rules.schedule_config IS 'JSONB array defining payment milestones for payment_schedule type rules';
COMMENT ON COLUMN public.booking_payment_schedules.milestone_sequence IS 'Sequential order of this payment milestone (1, 2, 3...)';
COMMENT ON COLUMN public.booking_payment_schedules.status IS 'Current status: pending (not due/paid), overdue (past due), partial (some paid), paid (fully paid), cancelled';
COMMENT ON COLUMN public.booking_payments.receipt_number IS 'Unique receipt number for this payment (format: RCP-YYYYMM-NNNN)';
COMMENT ON COLUMN public.booking_payments.applied_to_milestone_id IS 'Links payment to specific milestone in payment schedule';
