-- Verify and create guest user type if needed

-- Check if guest user type exists
SELECT id, name, display_name FROM public.user_types WHERE name = 'guest';

-- If the above returns no rows, run this:
INSERT INTO public.user_types (name, display_name, is_system_type, can_have_subscription, can_have_team, sort_order)
VALUES ('guest', 'Guest', FALSE, FALSE, FALSE, 100)
ON CONFLICT (name) DO NOTHING
RETURNING id, name, display_name;

-- Verify it was created
SELECT id, name, display_name FROM public.user_types WHERE name = 'guest';
