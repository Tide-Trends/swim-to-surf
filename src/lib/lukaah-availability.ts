import { addDays, endOfDay, isWithinInterval, startOfDay } from "date-fns";

/** Inclusive calendar blackout for Lukaah (no Mon–Fri summer week may include these dates). */
const BLACKOUT = {
  start: new Date("2026-07-27T12:00:00"),
  end: new Date("2026-08-07T12:00:00"),
} as const;

function parseLocalYmd(ymd: string): Date {
  return new Date(ymd.slice(0, 10) + "T12:00:00");
}

/** True if this calendar day falls inside the blackout window (local). */
export function isDateInLukaahBlackout(d: Date): boolean {
  const interval = { start: startOfDay(BLACKOUT.start), end: endOfDay(BLACKOUT.end) };
  return isWithinInterval(d, interval);
}

/**
 * True if any Mon–Fri lesson day in this summer week overlaps Lukaah’s blackout.
 * `weekMonday` is ISO yyyy-mm-dd for the Monday of the week.
 */
export function lukaahWeekOverlapsBlackout(weekMonday: string): boolean {
  const start = parseLocalYmd(weekMonday);
  for (let i = 0; i < 5; i++) {
    if (isDateInLukaahBlackout(addDays(start, i))) return true;
  }
  return false;
}
