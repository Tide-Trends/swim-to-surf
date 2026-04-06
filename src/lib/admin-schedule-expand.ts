import { addDays, format } from "date-fns";
import type { Booking } from "@/lib/database.types";
import { getEsteeDatesForMonth } from "@/lib/constants";

export type ExpandedLessonSlot = {
  ymd: string;
  timeHm: string;
  booking: Booking;
  /** Which Estee slot, if relevant */
  esteeSlot?: "primary" | "second";
};

function normalizeHm(t: string): string {
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function parseLocalYmd(ymd: string): Date {
  return new Date(ymd + "T12:00:00");
}

/**
 * Turn a stored booking into concrete calendar dates + start times.
 * Skips cancelled. Includes confirmed and pending_payment.
 */
export function expandBookingToLessonSlots(b: Booking): ExpandedLessonSlot[] {
  if (b.status === "cancelled") return [];

  if (b.instructor === "lukaah" && b.week_start) {
    const start = parseLocalYmd(b.week_start.slice(0, 10));
    const out: ExpandedLessonSlot[] = [];
    for (let i = 0; i < 5; i++) {
      const d = addDays(start, i);
      out.push({
        ymd: format(d, "yyyy-MM-dd"),
        timeHm: normalizeHm(b.lesson_time),
        booking: b,
      });
    }
    return out;
  }

  if (b.instructor === "estee" && b.month) {
    const { wednesdays, thursdays } = getEsteeDatesForMonth(b.month);
    const primary = b.day_of_week[0]?.toLowerCase();
    const secondary = b.day_of_week[1]?.toLowerCase();
    const tPrimary = normalizeHm(b.lesson_time);
    const tSecond = b.second_day_time ? normalizeHm(b.second_day_time) : null;
    const out: ExpandedLessonSlot[] = [];

    if (primary === "wednesday") {
      for (const ymd of wednesdays) {
        out.push({ ymd, timeHm: tPrimary, booking: b, esteeSlot: "primary" });
      }
    } else if (primary === "thursday") {
      for (const ymd of thursdays) {
        out.push({ ymd, timeHm: tPrimary, booking: b, esteeSlot: "primary" });
      }
    }

    if (secondary && tSecond) {
      if (secondary === "thursday") {
        for (const ymd of thursdays) {
          out.push({ ymd, timeHm: tSecond, booking: b, esteeSlot: "second" });
        }
      } else if (secondary === "wednesday") {
        for (const ymd of wednesdays) {
          out.push({ ymd, timeHm: tSecond, booking: b, esteeSlot: "second" });
        }
      }
    }

    return out;
  }

  return [];
}

export function buildSlotsByDate(bookings: Booking[]): Map<string, ExpandedLessonSlot[]> {
  const map = new Map<string, ExpandedLessonSlot[]>();
  for (const b of bookings) {
    for (const slot of expandBookingToLessonSlots(b)) {
      const list = map.get(slot.ymd) ?? [];
      list.push(slot);
      map.set(slot.ymd, list);
    }
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      const t = a.timeHm.localeCompare(b.timeHm);
      if (t !== 0) return t;
      return a.booking.swimmer_name.localeCompare(b.booking.swimmer_name);
    });
  }
  return map;
}
