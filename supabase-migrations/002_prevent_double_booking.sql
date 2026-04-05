-- Run in Supabase SQL editor after 001 (or alongside existing schema).
-- Prevents two confirmed bookings from taking the same Lukaah weekly slot
-- or the same Estee monthly time/day combination.

-- Lukaah: one booking per instructor + week + clock time
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_lukaah_week_time_unique
  ON public.bookings (instructor, week_start, lesson_time)
  WHERE status = 'confirmed'
    AND week_start IS NOT NULL
    AND instructor = 'lukaah';

CREATE OR REPLACE FUNCTION public.bookings_estee_slot_conflicts(
  p_month text,
  p_day_of_week text[],
  p_lesson_time time,
  p_second_day_time time,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  b record;
BEGIN
  FOR b IN
    SELECT id, day_of_week, lesson_time, second_day_time
    FROM public.bookings
    WHERE instructor = 'estee'
      AND status = 'confirmed'
      AND month = p_month
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
  LOOP
    IF public.bookings_estee_rows_conflict(
      b.day_of_week, b.lesson_time, b.second_day_time,
      p_day_of_week, p_lesson_time, p_second_day_time
    ) THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.bookings_estee_rows_conflict(
  a_days text[], a_t1 time, a_t2 time,
  b_days text[], b_t1 time, b_t2 time
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  i int;
  j int;
  da text;
  db text;
  ta time;
  tb time;
BEGIN
  FOR i IN 1..coalesce(array_length(a_days, 1), 0) LOOP
    da := a_days[i];
    ta := CASE WHEN i = 1 THEN a_t1 ELSE a_t2 END;
    IF ta IS NULL THEN CONTINUE; END IF;
    FOR j IN 1..coalesce(array_length(b_days, 1), 0) LOOP
      db := b_days[j];
      tb := CASE WHEN j = 1 THEN b_t1 ELSE b_t2 END;
      IF tb IS NULL THEN CONTINUE; END IF;
      IF da = db AND ta = tb THEN
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
BEGIN
  IF NEW.status IS DISTINCT FROM 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF NEW.instructor = 'lukaah' AND NEW.week_start IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.instructor = 'lukaah'
        AND b.status = 'confirmed'
        AND b.week_start = NEW.week_start
        AND b.lesson_time = NEW.lesson_time
        AND b.id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'This time slot was just booked. Please choose another.'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  IF NEW.instructor = 'estee' AND NEW.month IS NOT NULL THEN
    IF public.bookings_estee_slot_conflicts(
      NEW.month,
      NEW.day_of_week,
      NEW.lesson_time,
      NEW.second_day_time,
      NEW.id
    ) THEN
      RAISE EXCEPTION 'That lesson time is no longer available for this month.'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.bookings;
CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();
