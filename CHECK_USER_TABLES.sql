-- Check what columns exist in user-related tables
SELECT 'user_sessions' as table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_sessions'
UNION ALL
SELECT 'user_properties', column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_properties'
UNION ALL
SELECT 'user_profiles', column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
UNION ALL
SELECT 'notification_preferences', column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notification_preferences'
UNION ALL
SELECT 'user_permissions', column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_permissions'
ORDER BY table_name, column_name;
