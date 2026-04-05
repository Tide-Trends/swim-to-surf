import type { ScheduleSelection } from "@/lib/booking-schema";
import { hmToMinutes, normalizeHm } from "@/lib/booking-slots";

/** Wrap minutes into 0–1439 for same-calendar-day display. */
export function minutesToHm(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Nth consecutive start time (same day) after base, each lesson `durationMinutes` long. */
export function staggeredTimeFromBase(baseHm: string, durationMinutes: number, index: number): string {
  const base = hmToMinutes(baseHm);
  if (base < 0) return normalizeHm(baseHm);
  return minutesToHm(base + durationMinutes * index);
}

const LUKAAH_WINDOW = { start: 8 * 60, end: 11 * 60 + 30 };

export function lukaahStaggerFits(baseHm: string, durationMinutes: number, count: number): boolean {
  const base = hmToMinutes(baseHm);
  if (base < 0) return false;
  for (let i = 0; i < count; i++) {
    const start = base + i * durationMinutes;
    if (start < LUKAAH_WINDOW.start) return false;
    if (start + durationMinutes > LUKAAH_WINDOW.end) return false;
  }
  return true;
}

/** Infer Estee AM vs PM block from chosen start (matches INSTRUCTORS.estee.schedule). */
function esteeBlockBounds(primaryHm: string): { start: number; end: number } {
  const m = hmToMinutes(primaryHm);
  const noon = 12 * 60;
  if (m < noon) {
    return { start: 8 * 60, end: 11 * 60 + 30 };
  }
  return { start: 12 * 60 + 30, end: 16 * 60 };
}

function timeFitsBlock(hm: string, durationMinutes: number, block: { start: number; end: number }): boolean {
  const t = hmToMinutes(hm);
  if (t < 0) return false;
  return t >= block.start && t + durationMinutes <= block.end;
}

export function esteeScheduleForChild(
  schedule: Extract<ScheduleSelection, { type: "monthly" }>,
  index: number,
  durationMinutes: number
): Extract<ScheduleSelection, { type: "monthly" }> {
  return {
    ...schedule,
    primaryTime: staggeredTimeFromBase(schedule.primaryTime, durationMinutes, index),
    secondDayTime:
      schedule.secondDay && schedule.secondDayTime
        ? staggeredTimeFromBase(schedule.secondDayTime, durationMinutes, index)
        : null,
  };
}

export function esteeStaggerFits(
  proposed: Extract<ScheduleSelection, { type: "monthly" }>,
  durationMinutes: number,
  count: number
): boolean {
  const pBlock = esteeBlockBounds(proposed.primaryTime);
  for (let i = 0; i < count; i++) {
    const t = staggeredTimeFromBase(proposed.primaryTime, durationMinutes, i);
    if (!timeFitsBlock(t, durationMinutes, pBlock)) return false;
  }
  if (proposed.secondDay && proposed.secondDayTime) {
    const sBlock = esteeBlockBounds(proposed.secondDayTime);
    for (let i = 0; i < count; i++) {
      const t = staggeredTimeFromBase(proposed.secondDayTime, durationMinutes, i);
      if (!timeFitsBlock(t, durationMinutes, sBlock)) return false;
    }
  }
  return true;
}
