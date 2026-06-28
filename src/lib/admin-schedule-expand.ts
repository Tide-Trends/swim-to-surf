import { addDays, format, parse } from "date-fns";
import type { Booking } from "@/lib/database.types";
import { getEsteeDatesForMonth } from "@/lib/constants";
import { getEsteeWednesdayMakeupYmd } from "@/lib/estee-availability";

export type ExpandedLessonSlot = {
  ymd: string;
  timeHm: string;
  /** Minutes from midnight for sorting and overlap checks */
  startMinutes: number;
  endMinutes: number;
  booking: Booking;
  /** Which Estee slot, if relevant */
  esteeSlot?: "primary" | "second";
};

function normalizeHm(t: string): string {
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function hmToMinutes(hm: string): number {
  const parsed = parse(normalizeHm(hm), "HH:mm", new Date());
  return parsed.getHours() * 60 + parsed.getMinutes();
}

function slotEndMinutes(startHm: string, durationMin: number): number {
  return hmToMinutes(startHm) + durationMin;
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
      const timeHm = normalizeHm(b.lesson_time);
      out.push({
        ymd: format(d, "yyyy-MM-dd"),
        timeHm,
        startMinutes: hmToMinutes(timeHm),
        endMinutes: slotEndMinutes(timeHm, b.lesson_duration),
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
        out.push({
          ymd,
          timeHm: tPrimary,
          startMinutes: hmToMinutes(tPrimary),
          endMinutes: slotEndMinutes(tPrimary, b.lesson_duration),
          booking: b,
          esteeSlot: "primary",
        });
      }
      const makeupYmd = getEsteeWednesdayMakeupYmd(b.month);
      if (makeupYmd && !wednesdays.includes(makeupYmd)) {
        out.push({
          ymd: makeupYmd,
          timeHm: tPrimary,
          startMinutes: hmToMinutes(tPrimary),
          endMinutes: slotEndMinutes(tPrimary, b.lesson_duration),
          booking: b,
          esteeSlot: "primary",
        });
      }
    } else if (primary === "thursday") {
      for (const ymd of thursdays) {
        out.push({
          ymd,
          timeHm: tPrimary,
          startMinutes: hmToMinutes(tPrimary),
          endMinutes: slotEndMinutes(tPrimary, b.lesson_duration),
          booking: b,
          esteeSlot: "primary",
        });
      }
    }

    if (secondary && tSecond) {
      if (secondary === "thursday") {
        for (const ymd of thursdays) {
          out.push({
            ymd,
            timeHm: tSecond,
            startMinutes: hmToMinutes(tSecond),
            endMinutes: slotEndMinutes(tSecond, b.lesson_duration),
            booking: b,
            esteeSlot: "second",
          });
        }
      } else if (secondary === "wednesday") {
        for (const ymd of wednesdays) {
          out.push({
            ymd,
            timeHm: tSecond,
            startMinutes: hmToMinutes(tSecond),
            endMinutes: slotEndMinutes(tSecond, b.lesson_duration),
            booking: b,
            esteeSlot: "second",
          });
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
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
      return a.booking.swimmer_name.localeCompare(b.booking.swimmer_name);
    });
  }
  return map;
}

/** Indices of slots on the same day whose lesson windows overlap. */
export function findDayConflictIndices(slots: ExpandedLessonSlot[]): Set<number> {
  const conflictIndices = new Set<number>();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes) {
        conflictIndices.add(i);
        conflictIndices.add(j);
      }
    }
  }
  return conflictIndices;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function dayLessonStats(slots: ExpandedLessonSlot[]) {
  const totalMinutes = slots.reduce((sum, s) => sum + s.booking.lesson_duration, 0);
  return { count: slots.length, totalMinutes };
}
