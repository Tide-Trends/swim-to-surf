const JULY_2026 = "2026-07";

/** July 2026: one lesson date moves per weekday (still 4 lessons in the month). */
const JULY_2026_WED_RESCHEDULE = { from: "2026-07-15", to: "2026-07-29" } as const;
const JULY_2026_THU_RESCHEDULE = { from: "2026-07-16", to: "2026-07-30" } as const;

export const ESTEE_JULY_2026_SCHEDULE_NOTE =
  "July lessons on the 15th and 16th move to the 29th and 30th. You still get 4 lessons in July — same weekday and time.";

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
  if (monthValue !== JULY_2026) {
    return { wednesdays, thursdays };
  }

  return {
    wednesdays: swapLessonDate(wednesdays, JULY_2026_WED_RESCHEDULE.from, JULY_2026_WED_RESCHEDULE.to),
    thursdays: swapLessonDate(thursdays, JULY_2026_THU_RESCHEDULE.from, JULY_2026_THU_RESCHEDULE.to),
  };
}
