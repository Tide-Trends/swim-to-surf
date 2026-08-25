import { addDays, endOfDay, isWithinInterval, startOfDay } from "date-fns";
import type { LukaahBlackout } from "@/lib/availability-settings";
import { defaultAvailabilitySettings } from "@/lib/availability-settings";

/** Shown when default blackouts are in effect. */
export const LUKAAH_AWAY_NOTICE =
  "Lukaah is away July 11–22 and July 27 – August 7 — those weeks aren’t offered.";

function parseLocalYmd(ymd: string): Date {
  return new Date(ymd.slice(0, 10) + "T12:00:00");
}

function rangesFromSettings(blackouts?: LukaahBlackout[] | null): { start: Date; end: Date }[] {
  const list =
    blackouts && blackouts.length > 0
      ? blackouts
      : defaultAvailabilitySettings().lukaah.blackouts;
  return list.map((b) => ({
    start: parseLocalYmd(b.start),
    end: parseLocalYmd(b.end),
  }));
}

/** True if this calendar day falls inside any Lukaah blackout window (local). */
export function isDateInLukaahBlackout(d: Date, blackouts?: LukaahBlackout[] | null): boolean {
  const day = startOfDay(d);
  return rangesFromSettings(blackouts).some(({ start, end }) =>
    isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) })
  );
}

/**
 * True if any Mon–Fri lesson day in this summer week overlaps a Lukaah blackout.
 * `weekMonday` is ISO yyyy-mm-dd for the Monday of the week.
 */
export function lukaahWeekOverlapsBlackout(
  weekMonday: string,
  blackouts?: LukaahBlackout[] | null
): boolean {
  const start = parseLocalYmd(weekMonday);
  for (let i = 0; i < 5; i++) {
    if (isDateInLukaahBlackout(addDays(start, i), blackouts)) return true;
  }
  return false;
}

export function lukaahAwayNotice(blackouts?: LukaahBlackout[] | null): string {
  const list =
    blackouts && blackouts.length > 0
      ? blackouts
      : defaultAvailabilitySettings().lukaah.blackouts;
  if (list.length === 0) return "No blackout weeks are currently set.";
  const parts = list.map((b) => {
    const note = b.note ? ` (${b.note})` : "";
    return `${b.start} – ${b.end}${note}`;
  });
  return `Lukaah is unavailable: ${parts.join("; ")}. Those weeks aren’t offered.`;
}
