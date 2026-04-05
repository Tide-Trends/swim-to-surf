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
  const days = booking.day_of_week || [];
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
  const existing = bookings.filter((b) => b.week_start === weekStart);
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
  day: "wednesday" | "thursday",
  lessonDuration: number,
  candidateStarts: string[]
): string[] {
  return candidateStarts.filter((startHm) => {
    const s = hmToMinutes(startHm);
    if (s < 0) return true;
    for (const b of bookings) {
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
  for (const b of existing) {
    if (b.week_start !== weekStart) continue;
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

  for (const s of slots) {
    for (const b of existing) {
      if (esteeSlotOverlapsBooking(b, s.day, s.time, proposedDurationMinutes)) return true;
    }
  }
  return false;
}
