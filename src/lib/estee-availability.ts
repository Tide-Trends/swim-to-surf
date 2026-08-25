import {
  applyEsteeExcludesFromSettings,
  defaultAvailabilitySettings,
  getEsteeBlockBoundsFromSettings,
  getEsteeScheduleBlocksFromSettings,
  type AvailabilitySettings,
  type EsteeTimeBlock,
} from "@/lib/availability-settings";

const JULY_2026 = "2026-07";

/** July 2026: one lesson date moves per weekday (still 4 lessons in the month). */
const JULY_2026_WED_RESCHEDULE = { from: "2026-07-15", to: "2026-07-29" } as const;
const JULY_2026_THU_RESCHEDULE = { from: "2026-07-16", to: "2026-07-30" } as const;

export type { EsteeTimeBlock };

export const ESTEE_JULY_2026_SCHEDULE_NOTE =
  "July lessons on the 15th and 16th move to the 29th and 30th. You still get 4 lessons in July — same weekday and time.";

function swapLessonDate(dates: string[], from: string, to: string): string[] {
  const out = dates.filter((d) => d !== from);
  if (dates.includes(from) && !out.includes(to)) {
    out.push(to);
  }
  return out.sort();
}

/** @deprecated Prefer getEsteeScheduleBlocksFromSettings with live settings. */
export function getEsteeScheduleBlocks(monthValue: string | null | undefined) {
  return getEsteeScheduleBlocksFromSettings(defaultAvailabilitySettings(), monthValue);
}

/** @deprecated Prefer getEsteeBlockBoundsFromSettings with live settings. */
export function getEsteeBlockBoundsForTime(primaryHm: string, monthValue?: string | null) {
  return getEsteeBlockBoundsFromSettings(defaultAvailabilitySettings(), primaryHm, monthValue);
}

export function isEsteeSeptemberMonth(monthValue: string | null | undefined): boolean {
  if (!monthValue) return false;
  return monthValue.endsWith("-09");
}

/**
 * Apply built-in July swaps, then admin exclude lists from settings.
 */
export function applyEsteeMonthDateOverrides(
  monthValue: string,
  wednesdays: string[],
  thursdays: string[],
  settings?: AvailabilitySettings | null
): { wednesdays: string[]; thursdays: string[] } {
  let wed = wednesdays;
  let thu = thursdays;

  if (monthValue === JULY_2026) {
    wed = swapLessonDate(wed, JULY_2026_WED_RESCHEDULE.from, JULY_2026_WED_RESCHEDULE.to);
    thu = swapLessonDate(thu, JULY_2026_THU_RESCHEDULE.from, JULY_2026_THU_RESCHEDULE.to);
  }

  const cfg = settings ?? defaultAvailabilitySettings();
  return applyEsteeExcludesFromSettings(cfg, monthValue, wed, thu);
}

export { getEsteeScheduleBlocksFromSettings, getEsteeBlockBoundsFromSettings };
