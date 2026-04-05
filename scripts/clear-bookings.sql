-- Run in Supabase → SQL Editor when you want to wipe test / fake bookings.
-- Review rows first, then uncomment ONE option.

-- Preview recent bookings:
-- SELECT id, swimmer_name, parent_email, instructor, status, created_at
-- FROM public.bookings
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Option A — remove everything (full reset):
-- DELETE FROM public.bookings;

-- Option B — only non-cancelled:
-- DELETE FROM public.bookings WHERE status = 'confirmed';

-- Option C — by email (adjust pattern):
-- DELETE FROM public.bookings WHERE parent_email ILIKE '%you@example.com%';
