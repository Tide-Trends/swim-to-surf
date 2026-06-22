import { addDays, endOfDay, isWithinInterval, startOfDay } from "date-fns";

/**
 * Inclusive calendar blackouts for Lukaah.
 * A Mon–Fri summer week is unavailable if any lesson day falls inside a range.
 *
 * Jul 11–22: away (Jul 10 / week of Jul 6 stays bookable).
 * Jul 27–Aug 7: existing late-summer blackout.
 */
const BLACKOUT_RANGES = [
  { start: new Date("2026-07-11T12:00:00"), end: new Date("2026-07-22T12:00:00") },
  { start: new Date("2026-07-27T12:00:00"), end: new Date("2026-08-07T12:00:00") },
] as const;

function parseLocalYmd(ymd: string): Date {
  return new Date(ymd.slice(0, 10) + "T12:00:00");
}

/** True if this calendar day falls inside any Lukaah blackout window (local). */
export function isDateInLukaahBlackout(d: Date): boolean {
  const day = startOfDay(d);
  return BLACKOUT_RANGES.some(({ start, end }) =>
    isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) })
  );
}

/**
 * True if any Mon–Fri lesson day in this summer week overlaps a Lukaah blackout.
 * `weekMonday` is ISO yyyy-mm-dd for the Monday of the week.
 */
export function lukaahWeekOverlapsBlackout(weekMonday: string): boolean {
  const start = parseLocalYmd(weekMonday);
  for (let i = 0; i < 5; i++) {
    if (isDateInLukaahBlackout(addDays(start, i))) return true;
  }
  return false;
}
