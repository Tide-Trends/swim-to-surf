import type { ScheduleSelection } from "@/lib/booking-schema";

export type BookingSlotRow = {
  lesson_time: string;
  second_day_time: string | null;
  day_of_week: string[];
  week_start?: string | null;
  month?: string | null;
  instructor?: string;
};

export function normalizeHm(t: string | null | undefined): string {
  if (!t) return "";
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** Lukaah: taken HH:mm values for a given week start (confirmed bookings only). */
export function takenSlotsLukaahWeek(bookings: BookingSlotRow[], weekStart: string): string[] {
  const out = new Set<string>();
  for (const b of bookings) {
    if (b.week_start !== weekStart) continue;
    const hm = normalizeHm(b.lesson_time);
    if (hm) out.add(hm);
  }
  return [...out];
}

/**
 * Estee: which Wed / Thu clock times are taken for this month.
 * Uses day order: first day → lesson_time, second day → second_day_time.
 */
export function takenSlotsEsteeMonth(bookings: BookingSlotRow[]): { wed: string[]; thu: string[] } {
  const wed = new Set<string>();
  const thu = new Set<string>();

  for (const b of bookings) {
    const days = b.day_of_week || [];
    const wi = days.indexOf("wednesday");
    if (wi === 0) {
      const t = normalizeHm(b.lesson_time);
      if (t) wed.add(t);
    } else if (wi === 1) {
      const t = normalizeHm(b.second_day_time);
      if (t) wed.add(t);
    }

    const ti = days.indexOf("thursday");
    if (ti === 0) {
      const t = normalizeHm(b.lesson_time);
      if (t) thu.add(t);
    } else if (ti === 1) {
      const t = normalizeHm(b.second_day_time);
      if (t) thu.add(t);
    }
  }

  return { wed: [...wed], thu: [...thu] };
}

function slotTakenOnDay(booking: BookingSlotRow, day: "wednesday" | "thursday", hm: string): boolean {
  const days = booking.day_of_week || [];
  const i = days.indexOf(day);
  if (i < 0) return false;
  const t = i === 0 ? normalizeHm(booking.lesson_time) : normalizeHm(booking.second_day_time);
  return t === normalizeHm(hm);
}

/** True if an Estee booking row conflicts with proposed primary (+ optional second) slot. */
export function esteeProposalConflicts(existing: BookingSlotRow[], proposed: Extract<ScheduleSelection, { type: "monthly" }>): boolean {
  const primary = proposed.primaryDay;
  const other: "wednesday" | "thursday" = primary === "wednesday" ? "thursday" : "wednesday";

  const slots: { day: "wednesday" | "thursday"; time: string }[] = [
    { day: primary, time: proposed.primaryTime },
  ];
  if (proposed.secondDay && proposed.secondDayTime) {
    slots.push({ day: other, time: proposed.secondDayTime });
  }

  for (const s of slots) {
    for (const b of existing) {
      if (slotTakenOnDay(b, s.day, s.time)) return true;
    }
  }
  return false;
}

/** True if a Lukaah weekly slot is already taken. */
export function lukaahProposalConflicts(existing: BookingSlotRow[], weekStart: string, lessonTime: string): boolean {
  const want = normalizeHm(lessonTime);
  for (const b of existing) {
    if (b.week_start !== weekStart) continue;
    if (normalizeHm(b.lesson_time) === want) return true;
  }
  return false;
}
