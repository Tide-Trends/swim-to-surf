import { createEvents, type EventAttributes } from "ics";
import { addDays, format, nextMonday, startOfDay } from "date-fns";
import type { Booking } from "@/lib/database.types";
import { expandBookingToLessonSlots } from "@/lib/admin-schedule-expand";
import { lessonLocalToUtcIso } from "@/lib/timezone";

const LOCATION = "1299 N 500 W, American Fork, UT 84003";

function timeToTupleUtc(dateStr: string, time: string): [number, number, number, number, number] {
  const d = lessonLocalToUtcIso(dateStr, time);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

/** Mon–Sun range for the schedule email (next Monday after today). */
export function getUpcomingScheduleWeek(from = new Date()) {
  const mon = startOfDay(nextMonday(from));
  const sun = addDays(mon, 6);
  return {
    startYmd: format(mon, "yyyy-MM-dd"),
    endYmd: format(sun, "yyyy-MM-dd"),
    label: `Week of ${format(mon, "MMMM d, yyyy")}`,
  };
}

export function filterBookingsForWeek(bookings: Booking[], startYmd: string, endYmd: string): Booking[] {
  return bookings.filter((b) => {
    const slots = expandBookingToLessonSlots(b);
    return slots.some((s) => s.ymd >= startYmd && s.ymd <= endYmd);
  });
}

export function generateInstructorWeekIcs(
  bookings: Booking[],
  instructorName: string,
  startYmd: string,
  endYmd: string
): string {
  const events: EventAttributes[] = [];

  for (const b of bookings) {
    const slots = expandBookingToLessonSlots(b).filter(
      (s) => s.ymd >= startYmd && s.ymd <= endYmd
    );
    for (const slot of slots) {
      events.push({
        title: `🏊 ${b.swimmer_name} — Swim to Surf`,
        description: [
          `Swimmer: ${b.swimmer_name}`,
          `Parent: ${b.parent_name}`,
          `Phone: ${b.parent_phone}`,
          b.parent_email ? `Email: ${b.parent_email}` : "",
          b.notes ? `Notes: ${b.notes}` : "",
          "",
          "Swim to Surf · swimtosurfemail@gmail.com · 385-499-8036",
        ]
          .filter(Boolean)
          .join("\n"),
        location: LOCATION,
        start: timeToTupleUtc(slot.ymd, slot.timeHm),
        duration: { minutes: b.lesson_duration },
        status: "CONFIRMED" as const,
        busyStatus: "BUSY" as const,
        organizer: { name: "Swim to Surf", email: "swimtosurfemail@gmail.com" },
        alarms: [
          {
            action: "display" as const,
            trigger: { minutes: 30, before: true },
            description: "Swim lesson in 30 minutes",
          },
        ],
      });
    }
  }

  events.sort((a, b) => {
    const ta = a.start as [number, number, number, number, number];
    const tb = b.start as [number, number, number, number, number];
    return (
      ta[0] - tb[0] ||
      ta[1] - tb[1] ||
      ta[2] - tb[2] ||
      ta[3] - tb[3] ||
      ta[4] - tb[4]
    );
  });

  const { error, value } = createEvents(events);
  if (error) {
    console.error("Instructor week ICS error:", error);
    throw new Error("Failed to generate calendar file");
  }
  return value!;
}

export function icsAttachmentFilename(startYmd: string): string {
  return `swim-to-surf-${startYmd}.ics`;
}
