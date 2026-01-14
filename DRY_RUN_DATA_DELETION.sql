-- ============================================================================
-- DRY RUN: Preview What Will Be Preserved and Deleted
-- ============================================================================
-- Description: Shows counts WITHOUT actually deleting anything
-- Date: 2026-01-12
--
-- INSTRUCTIONS:
-- 1. Run VERIFY_SUPER_ADMIN.sql first
-- 2. Copy this entire query
-- 3. Paste into Supabase SQL Editor
-- 4. Click "Run"
-- 5. Review in the messages panel (not results table)
-- ============================================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA PRESERVATION PREVIEW';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ========================================
  -- WILL BE PRESERVED (Super Admin Data)
  -- ========================================

  RAISE NOTICE '✅ WILL BE PRESERVED:';
  RAISE NOTICE '────────────────────────────────────────';

  -- Super admin users
  SELECT COUNT(*) INTO v_count
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin';
  RAISE NOTICE '✅ Super Admin Users: %', v_count;

  -- Super admin companies
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count
    FROM public.companies c
    JOIN public.users u ON c.user_id = u.id
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name = 'super_admin';
    RAISE NOTICE '✅ Super Admin Companies: %', v_count;
  ELSE
    RAISE NOTICE '✅ Super Admin Companies: 0 (table not found)';
  END IF;

  -- Super admin properties
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM public.properties p
      JOIN public.companies c ON p.company_id = c.id
      JOIN public.users u ON c.user_id = u.id
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name = 'super_admin';
      RAISE NOTICE '✅ Super Admin Properties: %', v_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '✅ Super Admin Properties: 0 (query error)';
    END;
  ELSE
    RAISE NOTICE '✅ Super Admin Properties: 0 (table not found)';
  END IF;

  -- Super admin rooms
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM public.rooms r
      JOIN public.properties p ON r.property_id = p.id
      JOIN public.companies c ON p.company_id = c.id
      JOIN public.users u ON c.user_id = u.id
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name = 'super_admin';
      RAISE NOTICE '✅ Super Admin Rooms: %', v_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '✅ Super Admin Rooms: 0 (query error)';
    END;
  ELSE
    RAISE NOTICE '✅ Super Admin Rooms: 0 (table not found)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';

  -- ========================================
  -- WILL BE DELETED (Non-Admin Data)
  -- ========================================

  RAISE NOTICE '❌ WILL BE DELETED:';
  RAISE NOTICE '────────────────────────────────────────';

  -- Non-admin users
  SELECT COUNT(*) INTO v_count
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name != 'super_admin';
  RAISE NOTICE '❌ Non-Admin Users: %', v_count;

  -- Non-admin companies
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count
    FROM public.companies c
    JOIN public.users u ON c.user_id = u.id
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin';
    RAISE NOTICE '❌ Non-Admin Companies: %', v_count;
  END IF;

  -- Non-admin properties
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM public.properties p
      LEFT JOIN public.companies c ON p.company_id = c.id
      LEFT JOIN public.users u ON c.user_id = u.id
      LEFT JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE (ut.name != 'super_admin' OR ut.name IS NULL);
      RAISE NOTICE '❌ Non-Admin Properties: %', v_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Non-Admin Properties: Unable to count';
    END;
  END IF;

  -- Non-admin rooms
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM public.rooms r
      JOIN public.properties p ON r.property_id = p.id
      LEFT JOIN public.companies c ON p.company_id = c.id
      LEFT JOIN public.users u ON c.user_id = u.id
      LEFT JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE (ut.name != 'super_admin' OR ut.name IS NULL);
      RAISE NOTICE '❌ Non-Admin Rooms: %', v_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Non-Admin Rooms: Unable to count';
    END;
  END IF;

  -- Bookings (ALL will be deleted)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM public.bookings;
    RAISE NOTICE '❌ ALL Bookings: %', v_count;
  ELSE
    RAISE NOTICE '❌ ALL Bookings: 0 (table not found)';
  END IF;

  -- Invoices (ALL will be deleted)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM public.invoices;
    RAISE NOTICE '❌ ALL Invoices: %', v_count;
  ELSE
    RAISE NOTICE '❌ ALL Invoices: 0 (table not found)';
  END IF;

  -- Reviews (ALL will be deleted)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM public.reviews;
    RAISE NOTICE '❌ ALL Reviews: %', v_count;
  ELSE
    RAISE NOTICE '❌ ALL Reviews: 0 (table not found)';
  END IF;

  -- Wishlists (ALL will be deleted)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wishlists'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM public.wishlists;
    RAISE NOTICE '❌ ALL Wishlists: %', v_count;
  ELSE
    RAISE NOTICE '❌ ALL Wishlists: 0 (table not found)';
  END IF;

  -- Chats (ALL will be deleted)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chats'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count FROM public.chats;
    RAISE NOTICE '❌ ALL Chats: %', v_count;
  ELSE
    RAISE NOTICE '❌ ALL Chats: 0 (table not found)';
  END IF;

  -- User subscriptions (non-admin)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_subscriptions'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count
    FROM public.user_subscriptions
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    RAISE NOTICE '❌ Non-Admin User Subscriptions: %', v_count;
  END IF;

  -- Notifications (non-admin)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_count
    FROM public.notifications
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    RAISE NOTICE '❌ Non-Admin Notifications: %', v_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT NOTES:';
  RAISE NOTICE '────────────────────────────────────────';
  RAISE NOTICE '✅ Items will be PRESERVED';
  RAISE NOTICE '❌ Items will be DELETED';
  RAISE NOTICE '';
  RAISE NOTICE 'Your business structure (company, properties,';
  RAISE NOTICE 'rooms) will be kept intact!';
  RAISE NOTICE '';
  RAISE NOTICE 'ALL transactional data (bookings, invoices,';
  RAISE NOTICE 'reviews) will be deleted regardless of ownership.';
  RAISE NOTICE '========================================';
END $$;
