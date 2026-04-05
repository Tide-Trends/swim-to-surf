import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

/** All lesson clock times are interpreted as local time in American Fork, UT (Mountain). */
export const SITE_TIMEZONE = "America/Denver";

/** Fixed calendar date for formatting slot times (DST-aware in this zone). */
const SLOT_REF_DATE = "2000-06-15";

/**
 * Format stored lesson time (HH:mm or HH:mm:ss) for display.
 * Same wall clock in Utah regardless of the visitor's device timezone.
 */
export function formatLessonTimeHm(hm: string): string {
  const clean = hm.trim().slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(clean)) return hm;
  const localWall = `${SLOT_REF_DATE} ${clean}:00`;
  const instant = fromZonedTime(localWall, SITE_TIMEZONE);
  return formatInTimeZone(instant, SITE_TIMEZONE, "h:mm a");
}

export const SITE_TIMEZONE_LABEL = "Mountain Time (Utah)";

export function timezoneBookingHint(): string {
  return `All times are ${SITE_TIMEZONE_LABEL} — same as American Fork, Utah.`;
}

/** Build UTC instant from a calendar date (yyyy-mm-dd) + lesson clock time in Utah. */
export function lessonLocalToUtcIso(dateYmd: string, hm: string): Date {
  const clean = hm.trim().slice(0, 5);
  return fromZonedTime(`${dateYmd} ${clean}:00`, SITE_TIMEZONE);
}
