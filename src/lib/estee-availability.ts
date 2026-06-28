const JULY_2026 = "2026-07";

/** Estee is unavailable these July 2026 lesson dates. */
const JULY_2026_BLOCKED_WEDNESDAYS = ["2026-07-15", "2026-07-29"];
const JULY_2026_BLOCKED_THURSDAYS = ["2026-07-16"];

/** Final July Wed (29) moves to Thu 30 for all swimmers that month. */
export const JULY_2026_MAKEUP_YMD = "2026-07-30";

export const ESTEE_JULY_2026_SCHEDULE_NOTE =
  "July 15 & 16 are off. The last July lesson moves from Wednesday the 29th to Thursday the 30th.";

export function applyEsteeMonthDateOverrides(
  monthValue: string,
  wednesdays: string[],
  thursdays: string[]
): { wednesdays: string[]; thursdays: string[] } {
  if (monthValue !== JULY_2026) {
    return { wednesdays, thursdays };
  }

  const w = wednesdays.filter((d) => !JULY_2026_BLOCKED_WEDNESDAYS.includes(d));
  const t = [
    ...new Set([
      ...thursdays.filter((d) => !JULY_2026_BLOCKED_THURSDAYS.includes(d)),
      JULY_2026_MAKEUP_YMD,
    ]),
  ].sort();

  return { wednesdays: w, thursdays: t };
}

/** Extra primary-Wednesday lesson date when the usual 4th Wed was moved to Thu 7/30. */
export function getEsteeWednesdayMakeupYmd(monthValue: string): string | null {
  return monthValue === JULY_2026 ? JULY_2026_MAKEUP_YMD : null;
}
