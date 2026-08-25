const JULY_2026 = "2026-07";
const SEPTEMBER_2026 = "2026-09";

/** July 2026: one lesson date moves per weekday (still 4 lessons in the month). */
const JULY_2026_WED_RESCHEDULE = { from: "2026-07-15", to: "2026-07-29" } as const;
const JULY_2026_THU_RESCHEDULE = { from: "2026-07-16", to: "2026-07-30" } as const;

/** September 2026: drop the 5th Wednesday so the month stays 4 lessons. */
const SEPTEMBER_2026_EXCLUDE_WEDNESDAYS = ["2026-09-30"] as const;

export const ESTEE_JULY_2026_SCHEDULE_NOTE =
  "July lessons on the 15th and 16th move to the 29th and 30th. You still get 4 lessons in July — same weekday and time.";

export const ESTEE_SEPTEMBER_HOURS_NOTE =
  "September lessons run Wednesday & Thursday, 11:30 AM – 5:00 PM (4 Wednesdays — Sept 30 is not offered).";

export type EsteeTimeBlock = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

/** True for September bookable months (e.g. 2026-09). */
export function isEsteeSeptemberMonth(monthValue: string | null | undefined): boolean {
  if (!monthValue) return false;
  return monthValue.endsWith("-09");
}

/**
 * Estee's day blocks for a given month.
 * Default: morning 8:00–11:30 + afternoon 12:30–5:00.
 * September: continuous 11:30 AM – 5:00 PM (Wed & Thu).
 */
export function getEsteeScheduleBlocks(monthValue: string | null | undefined): {
  mode: "split" | "continuous";
  am: EsteeTimeBlock | null;
  pm: EsteeTimeBlock;
  dayLabel: string;
  pmLabel: string;
} {
  if (isEsteeSeptemberMonth(monthValue)) {
    return {
      mode: "continuous",
      am: null,
      pm: { startHour: 11, startMinute: 30, endHour: 17, endMinute: 0 },
      dayLabel: "11:30 AM – 5:00 PM",
      pmLabel: "11:30 AM – 5:00 PM",
    };
  }

  // Keep in sync with INSTRUCTORS.estee.schedule in constants.ts
  return {
    mode: "split",
    am: { startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 },
    pm: { startHour: 12, startMinute: 30, endHour: 17, endMinute: 0 },
    dayLabel: "8:00 AM – 11:30 AM & 12:30 PM – 5:00 PM",
    pmLabel: "12:30 PM – 5:00 PM",
  };
}

/** Stagger / fit window for a chosen start time in a given month. */
export function getEsteeBlockBoundsForTime(
  primaryHm: string,
  monthValue?: string | null
): { start: number; end: number } {
  if (isEsteeSeptemberMonth(monthValue)) {
    return { start: 11 * 60 + 30, end: 17 * 60 };
  }
  const [hStr, mStr] = primaryHm.slice(0, 5).split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const minutes = h * 60 + m;
  const noon = 12 * 60;
  if (minutes < noon) {
    return { start: 8 * 60, end: 11 * 60 + 30 };
  }
  return { start: 12 * 60 + 30, end: 17 * 60 };
}

function swapLessonDate(dates: string[], from: string, to: string): string[] {
  const out = dates.filter((d) => d !== from);
  if (dates.includes(from) && !out.includes(to)) {
    out.push(to);
  }
  return out.sort();
}

export function applyEsteeMonthDateOverrides(
  monthValue: string,
  wednesdays: string[],
  thursdays: string[]
): { wednesdays: string[]; thursdays: string[] } {
  if (monthValue === JULY_2026) {
    return {
      wednesdays: swapLessonDate(wednesdays, JULY_2026_WED_RESCHEDULE.from, JULY_2026_WED_RESCHEDULE.to),
      thursdays: swapLessonDate(thursdays, JULY_2026_THU_RESCHEDULE.from, JULY_2026_THU_RESCHEDULE.to),
    };
  }

  if (monthValue === SEPTEMBER_2026) {
    const exclude = new Set<string>(SEPTEMBER_2026_EXCLUDE_WEDNESDAYS);
    return {
      wednesdays: wednesdays.filter((d) => !exclude.has(d)),
      thursdays,
    };
  }

  return { wednesdays, thursdays };
}
