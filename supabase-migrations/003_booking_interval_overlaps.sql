-- Run in Supabase SQL editor after 002.
-- Enforces no overlapping lesson intervals (15 min vs 30 min) for Lukaah weekly and Estee monthly.
-- If CREATE TRIGGER fails, use: EXECUTE PROCEDURE public.prevent_double_booking();

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.bookings;
DROP FUNCTION IF EXISTS public.prevent_double_booking();
DROP FUNCTION IF EXISTS public.estee_month_slots_overlap(public.bookings, public.bookings);
DROP FUNCTION IF EXISTS public.booking_row_slots(public.bookings);
DROP FUNCTION IF EXISTS public.minute_intervals_overlap(int, int, int, int);
DROP FUNCTION IF EXISTS public.time_to_minutes(time);

CREATE OR REPLACE FUNCTION public.time_to_minutes(t time)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXTRACT(HOUR FROM t)::int * 60 + EXTRACT(MINUTE FROM t)::int;
$$;

CREATE OR REPLACE FUNCTION public.minute_intervals_overlap(
  a_start int, a_dur int,
  b_start int, b_dur int
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT a_start < b_start + b_dur AND b_start < a_start + a_dur;
$$;

CREATE OR REPLACE FUNCTION public.booking_row_slots(p public.bookings)
RETURNS TABLE(slot_day text, start_m int, dur_m int)
LANGUAGE plpgsql
AS $$
DECLARE
  i int;
  t time;
  d int;
BEGIN
  d := COALESCE(p.lesson_duration, 30);
  FOR i IN 1..COALESCE(array_length(p.day_of_week, 1), 0) LOOP
    slot_day := p.day_of_week[i];
    t := CASE WHEN i = 1 THEN p.lesson_time ELSE p.second_day_time END;
    IF t IS NULL THEN
      CONTINUE;
    END IF;
    start_m := public.time_to_minutes(t);
    dur_m := d;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.estee_month_slots_overlap(a public.bookings, b public.bookings)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  sa record;
  sb record;
BEGIN
  IF a.month IS DISTINCT FROM b.month THEN
    RETURN false;
  END IF;
  FOR sa IN SELECT * FROM public.booking_row_slots(a) LOOP
    FOR sb IN SELECT * FROM public.booking_row_slots(b) LOOP
      IF sa.slot_day = sb.slot_day AND public.minute_intervals_overlap(sa.start_m, sa.dur_m, sb.start_m, sb.dur_m) THEN
        RETURN true;
      END IF;
    END LOOP;
  END LOOP;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  b public.bookings;
  d_new int;
  d_b int;
BEGIN
  IF NEW.status IS DISTINCT FROM 'confirmed' THEN
    RETURN NEW;
  END IF;

  d_new := COALESCE(NEW.lesson_duration, 30);

  IF NEW.instructor = 'lukaah' AND NEW.week_start IS NOT NULL THEN
    FOR b IN
      SELECT * FROM public.bookings
      WHERE instructor = 'lukaah'
        AND status = 'confirmed'
        AND week_start = NEW.week_start
        AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
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
        AND status = 'confirmed'
        AND month = NEW.month
        AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
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

CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();
