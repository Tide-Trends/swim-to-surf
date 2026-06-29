import { differenceInCalendarDays, startOfDay } from "date-fns";
import { getEsteeDatesForMonth } from "@/lib/constants";

type BookingLike = {
  instructor: "lukaah" | "estee";
  week_start: string | null;
  month: string | null;
  day_of_week: string[] | null;
};

function parseLocalYmd(ymd: string): Date {
  return new Date(ymd.slice(0, 10) + "T12:00:00");
}

/**
 * Earliest lesson date for this booking (used for policy windows).
 */
export function getFirstLessonDate(booking: BookingLike): Date {
  if (booking.instructor === "lukaah" && booking.week_start) {
    return parseLocalYmd(booking.week_start);
  }
  if (booking.instructor === "estee" && booking.month) {
    const { wednesdays, thursdays } = getEsteeDatesForMonth(booking.month);
    const dow = booking.day_of_week ?? [];
    const days = dow.map((d) => d.toLowerCase());
    const dates: string[] = [];
    if (days.includes("wednesday")) dates.push(...wednesdays);
    if (days.includes("thursday")) dates.push(...thursdays);
    if (dates.length === 0) throw new Error("No lesson days");
    dates.sort();
    return parseLocalYmd(dates[0]!);
  }
  throw new Error("Cannot determine first lesson date");
}

/**
 * Self-serve cancel/reschedule allowed only when the first lesson is at least
 * 7 calendar days away (policy: 7 days advance notice).
 */
export function canSelfServeManageBooking(booking: BookingLike): boolean {
  try {
    const first = startOfDay(getFirstLessonDate(booking));
    const today = startOfDay(new Date());
    return differenceInCalendarDays(first, today) >= 7;
  } catch {
    return false;
  }
}
