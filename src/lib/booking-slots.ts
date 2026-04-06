import type { ScheduleSelection } from "@/lib/booking-schema";

export type BookingSlotRow = {
  lesson_time: string;
  second_day_time: string | null;
  day_of_week: string[];
  week_start?: string | null;
  month?: string | null;
  instructor?: string;
  /** Lesson length in minutes (15 or 30) — required for overlap checks */
  lesson_duration?: number;
};

/** Postgres date / ISO string → YYYY-MM-DD for comparisons. */
export function normalizeWeekStartIso(d: string | null | undefined): string {
  if (!d) return "";
  const s = String(d).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function normalizeMonthYm(m: string | null | undefined): string {
  if (!m) return "";
  return String(m).trim();
}

/** Coerce Supabase/PostgREST day_of_week (array, string, or Postgres array text) to lowercase strings. */
export function parseDayOfWeek(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t.startsWith("{") && t.endsWith("}")) {
      return t
        .slice(1, -1)
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((s) => s.replace(/^"|"$/g, "").trim().toLowerCase())
        .filter(Boolean);
    }
    if (t.includes(",")) {
      return t.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return t ? [t.toLowerCase()] : [];
  }
  return [];
}

/** Normalize API JSON rows for overlap math (handles missing keys and odd day_of_week shapes). */
export function coerceBookingSlotRows(data: unknown): BookingSlotRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      lesson_time: String(r.lesson_time ?? ""),
      second_day_time: r.second_day_time != null && r.second_day_time !== "" ? String(r.second_day_time) : null,
      day_of_week: parseDayOfWeek(r.day_of_week),
      week_start: r.week_start != null ? String(r.week_start) : null,
      month: r.month != null ? String(r.month) : null,
      lesson_duration: typeof r.lesson_duration === "number" ? r.lesson_duration : undefined,
    };
  });
}

export function normalizeHm(t: string | null | undefined): string {
  if (!t) return "";
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** Minutes from midnight for "HH:mm" */
export function hmToMinutes(hm: string): number {
  const n = normalizeHm(hm);
  const [h, m] = n.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

/** Half-open [aStart, aStart + aDur) overlaps [bStart, bStart + bDur) */
export function intervalsOverlapMinutes(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  if (aDur <= 0 || bDur <= 0) return false;
  const aEnd = aStart + aDur;
  const bEnd = bStart + bDur;
  return aStart < bEnd && bStart < aEnd;
}

function defaultDuration(row: BookingSlotRow): number {
  const d = row.lesson_duration;
  return d === 15 || d === 30 ? d : 30;
}

/** Start minute + duration for one day on a booking row (Estee / multi-day). */
function intervalForDay(booking: BookingSlotRow, day: "wednesday" | "thursday"): { start: number; dur: number } | null {
  const days = parseDayOfWeek(booking.day_of_week);
  const i = days.indexOf(day);
  if (i < 0) return null;
  const hm = i === 0 ? normalizeHm(booking.lesson_time) : normalizeHm(booking.second_day_time);
  if (!hm) return null;
  const start = hmToMinutes(hm);
  if (start < 0) return null;
  return { start, dur: defaultDuration(booking) };
}

/** Lukaah weekly: same start time every weekday — one clock interval applies. */
function lukaahBookingInterval(booking: BookingSlotRow): { start: number; dur: number } | null {
  const hm = normalizeHm(booking.lesson_time);
  if (!hm) return null;
  const start = hmToMinutes(hm);
  if (start < 0) return null;
  return { start, dur: defaultDuration(booking) };
}

/**
 * Start times (HH:mm) on a 15-minute grid that cannot be chosen for a `lessonDuration` lesson
 * because they overlap any existing confirmed booking in that week.
 */
export function lukaahUnavailableStarts(
  bookings: BookingSlotRow[],
  weekStart: string,
  lessonDuration: number,
  candidateStarts: string[]
): string[] {
  const ws = normalizeWeekStartIso(weekStart);
  const existing = bookings.filter((b) => normalizeWeekStartIso(b.week_start) === ws);
  return candidateStarts.filter((startHm) => {
    const s = hmToMinutes(startHm);
    if (s < 0) return true;
    for (const b of existing) {
      const iv = lukaahBookingInterval(b);
      if (!iv) continue;
      if (intervalsOverlapMinutes(s, lessonDuration, iv.start, iv.dur)) return true;
    }
    return false;
  });
}

/**
 * For Estee in a month: unavailable start times per weekday for the given lesson length.
 */
export function esteeUnavailableStartsForDay(
  bookings: BookingSlotRow[],
  month: string,
  day: "wednesday" | "thursday",
  lessonDuration: number,
  candidateStarts: string[]
): string[] {
  const m = normalizeMonthYm(month);
  const scoped = m ? bookings.filter((b) => normalizeMonthYm(b.month) === m) : bookings;
  return candidateStarts.filter((startHm) => {
    const s = hmToMinutes(startHm);
    if (s < 0) return true;
    for (const b of scoped) {
      const iv = intervalForDay(b, day);
      if (!iv) continue;
      if (intervalsOverlapMinutes(s, lessonDuration, iv.start, iv.dur)) return true;
    }
    return false;
  });
}

/** True if a Lukaah weekly proposal overlaps an existing booking (any duration). */
export function lukaahProposalConflicts(
  existing: BookingSlotRow[],
  weekStart: string,
  lessonTime: string,
  proposedDurationMinutes: number
): boolean {
  const s = hmToMinutes(lessonTime);
  if (s < 0) return true;
  const ws = normalizeWeekStartIso(weekStart);
  for (const b of existing) {
    if (normalizeWeekStartIso(b.week_start) !== ws) continue;
    const iv = lukaahBookingInterval(b);
    if (!iv) continue;
    if (intervalsOverlapMinutes(s, proposedDurationMinutes, iv.start, iv.dur)) return true;
  }
  return false;
}

function esteeSlotOverlapsBooking(
  booking: BookingSlotRow,
  day: "wednesday" | "thursday",
  startHm: string,
  durationMin: number
): boolean {
  const iv = intervalForDay(booking, day);
  if (!iv) return false;
  const s = hmToMinutes(startHm);
  if (s < 0) return false;
  return intervalsOverlapMinutes(s, durationMin, iv.start, iv.dur);
}

/** True if Estee monthly proposal overlaps any existing row (15 vs 30 aware). */
export function esteeProposalConflicts(
  existing: BookingSlotRow[],
  proposed: Extract<ScheduleSelection, { type: "monthly" }>,
  proposedDurationMinutes: number
): boolean {
  const primary = proposed.primaryDay;
  const other: "wednesday" | "thursday" = primary === "wednesday" ? "thursday" : "wednesday";

  const slots: { day: "wednesday" | "thursday"; time: string }[] = [{ day: primary, time: proposed.primaryTime }];
  if (proposed.secondDay && proposed.secondDayTime) {
    slots.push({ day: other, time: proposed.secondDayTime });
  }

  const pm = normalizeMonthYm(proposed.month);
  for (const s of slots) {
    for (const b of existing) {
      if (normalizeMonthYm(b.month) !== pm) continue;
      if (esteeSlotOverlapsBooking(b, s.day, s.time, proposedDurationMinutes)) return true;
    }
  }
  return false;
}
