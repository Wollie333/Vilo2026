-- Rollback script for migration 036
-- Run this to clean up partial migration, then re-run 036

-- Drop policies if they exist
DROP POLICY IF EXISTS room_payment_rules_select_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_insert_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_update_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_delete_policy ON public.room_payment_rules;

DROP POLICY IF EXISTS booking_payment_schedules_select_policy ON public.booking_payment_schedules;
DROP POLICY IF EXISTS booking_payment_schedules_update_policy ON public.booking_payment_schedules;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_room_payment_rules_updated_at ON public.room_payment_rules;
DROP TRIGGER IF EXISTS update_booking_payment_schedules_updated_at ON public.booking_payment_schedules;

-- Drop tables if they exist (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.booking_payment_schedules CASCADE;
DROP TABLE IF EXISTS public.room_payment_rules CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.update_milestone_status_on_payment() CASCADE;

-- Revert booking_payments table changes (if columns were added)
ALTER TABLE IF EXISTS public.booking_payments
  DROP COLUMN IF EXISTS receipt_number,
  DROP COLUMN IF EXISTS receipt_url,
  DROP COLUMN IF EXISTS applied_to_milestone_id;

-- Drop enums if they exist (CASCADE to drop dependencies)
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS due_timing CASCADE;
DROP TYPE IF EXISTS amount_type CASCADE;
DROP TYPE IF EXISTS payment_rule_type CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 036 rollback completed. You can now re-run the full migration.';
END $$;
