import { format, addDays } from "date-fns";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { formatLessonTimeHm, SITE_TIMEZONE_LABEL } from "@/lib/timezone";

/** One readable line for review / email-style summaries. */
export function fullScheduleSummary(s: ScheduleSelection): string {
  if (s.type === "weekly") {
    const weekDate = new Date(s.weekStart + "T12:00:00");
    const timeLabel = formatLessonTimeHm(s.time);
    return `Mon – Fri at ${timeLabel} (${SITE_TIMEZONE_LABEL}), week of ${format(weekDate, "MMM d, yyyy")}`;
  }
  const [y, m] = s.month.split("-");
  const monthDate = new Date(Number(y), Number(m) - 1, 1);
  const timeLabel = formatLessonTimeHm(s.primaryTime);
  if (s.secondDay && s.secondDayTime) {
    const otherDay = s.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
    const secondLabel = formatLessonTimeHm(s.secondDayTime);
    return `${s.primaryDay.charAt(0).toUpperCase() + s.primaryDay.slice(1)} at ${timeLabel} + ${otherDay} at ${secondLabel}, ${format(monthDate, "MMMM yyyy")} (${SITE_TIMEZONE_LABEL})`;
  }
  return `Every ${s.primaryDay.charAt(0).toUpperCase() + s.primaryDay.slice(1)} at ${timeLabel}, ${format(monthDate, "MMMM yyyy")} (${SITE_TIMEZONE_LABEL})`;
}

/**
 * Short line for matching sibling times: name + when/where they’re booked.
 */
export function compactScheduleForMatcher(swimmerName: string, sch: ScheduleSelection): string {
  if (sch.type === "weekly") {
    const start = new Date(sch.weekStart + "T12:00:00");
    const end = addDays(start, 4);
    const t = formatLessonTimeHm(sch.time);
    return `${swimmerName}: Mon–Fri at ${t} · week of ${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
  }
  const [y, m] = sch.month.split("-");
  const monthDate = new Date(Number(y), Number(m) - 1, 1);
  const t = formatLessonTimeHm(sch.primaryTime);
  const day = sch.primaryDay.charAt(0).toUpperCase() + sch.primaryDay.slice(1);
  if (sch.secondDay && sch.secondDayTime) {
    const other = sch.primaryDay === "wednesday" ? "Thu" : "Wed";
    const t2 = formatLessonTimeHm(sch.secondDayTime);
    return `${swimmerName}: ${day} ${t} + ${other} ${t2} · ${format(monthDate, "MMMM yyyy")}`;
  }
  return `${swimmerName}: ${day}s at ${t} · ${format(monthDate, "MMMM yyyy")}`;
}
