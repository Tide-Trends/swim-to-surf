import { createEvents, type EventAttributes } from "ics";
import { addDays, addWeeks, format, startOfMonth, getDay, addMonths } from "date-fns";
import type { ScheduleSelection } from "./booking-schema";
import { lessonLocalToUtcIso } from "./timezone";

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

/** ICS start in UTC (wall clock is always American Fork / Mountain). */
function timeToTupleUtc(dateStr: string, time: string): [number, number, number, number, number] {
  const d = lessonLocalToUtcIso(dateStr, time);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

function getLessonDates(schedule: ScheduleSelection): { date: string; time: string }[] {
  const dates: { date: string; time: string }[] = [];

  if (schedule.type === "weekly") {
    const monday = new Date(schedule.weekStart + "T12:00:00");
    for (let i = 0; i < 5; i++) {
      const d = addDays(monday, i);
      dates.push({ date: format(d, "yyyy-MM-dd"), time: schedule.time });
    }
  } else {
    const [y, mo] = schedule.month.split("-").map(Number);
    const monthStart = startOfMonth(new Date(y, mo - 1, 1));
    const monthEnd = addMonths(monthStart, 1);

    function addDayOccurrences(dayName: string, time: string) {
      const targetDow = DAY_MAP[dayName];
      let current = new Date(monthStart);
      const firstDow = getDay(current);
      let offset = targetDow - firstDow;
      if (offset < 0) offset += 7;
      current = addDays(current, offset);

      while (current < monthEnd) {
        dates.push({ date: format(current, "yyyy-MM-dd"), time });
        current = addWeeks(current, 1);
      }
    }

    addDayOccurrences(schedule.primaryDay, schedule.primaryTime);

    if (schedule.secondDay && schedule.secondDayTime) {
      const otherDay = schedule.primaryDay === "wednesday" ? "thursday" : "wednesday";
      addDayOccurrences(otherDay, schedule.secondDayTime);
    }

    dates.sort((a, b) => a.date.localeCompare(b.date));
  }

  return dates;
}

export function generateIcsContent(
  schedule: ScheduleSelection,
  swimmerName: string,
  instructorName: string,
  duration: number
): string {
  const dates = getLessonDates(schedule);

  const events: EventAttributes[] = dates.map((d) => ({
    title: `Swim Lesson — ${swimmerName} with ${instructorName}`,
    description: `Private swimming lesson with ${instructorName} at Swim to Surf.\n\nSwimmer: ${swimmerName}\nDuration: ${duration} minutes\n\nQuestions? swimtosurfemail@gmail.com | 385-499-8036`,
    location: "American Fork, Utah",
    start: timeToTupleUtc(d.date, d.time),
    duration: { minutes: duration },
    status: "CONFIRMED" as const,
    busyStatus: "BUSY" as const,
    organizer: { name: "Swim to Surf", email: "swimtosurfemail@gmail.com" },
    alarms: [{ action: "display" as const, trigger: { minutes: 30, before: true }, description: "Swim lesson in 30 minutes" }],
  }));

  const { error, value } = createEvents(events);
  if (error) {
    console.error("ICS generation error:", error);
    throw new Error("Failed to generate calendar file");
  }

  return value!;
}

export function generateGoogleCalendarUrl(
  schedule: ScheduleSelection,
  swimmerName: string,
  instructorName: string,
  duration: number
): string {
  const dates = getLessonDates(schedule);
  if (dates.length === 0) return "";

  const first = dates[0];
  const d = lessonLocalToUtcIso(first.date, first.time);
  const end = new Date(d.getTime() + duration * 60000);

  const fmt = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Swim Lesson — ${swimmerName} with ${instructorName}`,
    dates: `${fmt(d)}/${fmt(end)}`,
    details: `Private swimming lesson with ${instructorName} at Swim to Surf.`,
    location: "American Fork, Utah",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
