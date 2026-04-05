-- Stripe checkout: hold slots as pending_payment until payment succeeds (webhook or verify-session).
-- Run in Supabase SQL editor after 003_booking_interval_overlaps.sql

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'pending_payment'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS payment_hold_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session
  ON public.bookings (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Public availability reads must include active payment holds (anon key).
DROP POLICY IF EXISTS "Anyone can check slot availability" ON public.bookings;

CREATE POLICY "Anyone can check slot availability"
  ON public.bookings FOR SELECT
  USING (
    status = 'confirmed'
    OR (
      status = 'pending_payment'
      AND payment_hold_expires_at IS NOT NULL
      AND payment_hold_expires_at > now()
    )
  );

-- Block overlaps for both confirmed and non-expired pending holds.
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  b public.bookings;
  d_new int;
  d_b int;
BEGIN
  IF NEW.status IS DISTINCT FROM 'confirmed' AND NEW.status IS DISTINCT FROM 'pending_payment' THEN
    RETURN NEW;
  END IF;

  d_new := COALESCE(NEW.lesson_duration, 30);

  IF NEW.instructor = 'lukaah' AND NEW.week_start IS NOT NULL THEN
    FOR b IN
      SELECT * FROM public.bookings
      WHERE instructor = 'lukaah'
        AND week_start = NEW.week_start
        AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
          status = 'confirmed'
          OR (
            status = 'pending_payment'
            AND payment_hold_expires_at IS NOT NULL
            AND payment_hold_expires_at > now()
          )
        )
    LOOP
      d_b := COALESCE(b.lesson_duration, 30);
      IF public.minute_intervals_overlap(
        public.time_to_minutes(NEW.lesson_time), d_new,
        public.time_to_minutes(b.lesson_time), d_b
      ) THEN
        RAISE EXCEPTION 'This time overlaps an existing lesson. Please choose another start time.'
          USING ERRCODE = '23505';
      END IF;
    END LOOP;
  END IF;

  IF NEW.instructor = 'estee' AND NEW.month IS NOT NULL THEN
    FOR b IN
      SELECT * FROM public.bookings
      WHERE instructor = 'estee'
        AND month = NEW.month
        AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
          status = 'confirmed'
          OR (
            status = 'pending_payment'
            AND payment_hold_expires_at IS NOT NULL
            AND payment_hold_expires_at > now()
          )
        )
    LOOP
      IF public.estee_month_slots_overlap(b, NEW) THEN
        RAISE EXCEPTION 'That lesson time overlaps an existing booking this month.'
          USING ERRCODE = '23505';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
