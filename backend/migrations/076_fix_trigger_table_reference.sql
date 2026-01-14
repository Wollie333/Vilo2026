-- =====================================================
-- MIGRATION: 076_fix_trigger_table_reference.sql
-- Description: Fix handle_new_user trigger to use fully qualified table name
-- Date: 2026-01-13
-- =====================================================

-- Recreate handle_new_user function with correct table reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_guest_type_id UUID;
BEGIN
    -- Get guest user_type_id (use fully qualified table name)
    SELECT id INTO v_guest_type_id
    FROM public.user_types
    WHERE name = 'guest' AND category = 'customer'
    LIMIT 1;

    -- Log what we found
    RAISE NOTICE 'Creating user profile for %. Guest type ID: %', NEW.email, v_guest_type_id;

    -- Create user profile with guest user_type
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        user_type_id,
        preferences,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        v_guest_type_id,
        '{"theme": "system", "language": "en", "dateFormat": "MM/DD/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::jsonb,
        'pending',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'User profile created successfully for %', NEW.email;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    RETURN NEW;  -- Don't block user creation even if profile fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
