/**
 * Live availability settings (admin-editable).
 * Defaults match the current hard-coded Swim to Surf season;
 * saved rows in Supabase override these for everyone.
 */

export type TimeHm = string; // "HH:mm"

export type EsteeMonthHours =
  | { mode: "default" }
  | { mode: "continuous"; start: TimeHm; end: TimeHm }
  | {
      mode: "split";
      amStart: TimeHm;
      amEnd: TimeHm;
      pmStart: TimeHm;
      pmEnd: TimeHm;
    };

export type EsteeMonthAvailability = {
  open: boolean;
  emphasize?: boolean;
  note?: string;
  /** YYYY-MM-DD dates to drop from Wednesdays */
  excludeWednesdays?: string[];
  /** YYYY-MM-DD dates to drop from Thursdays */
  excludeThursdays?: string[];
  hours?: EsteeMonthHours;
};

export type LukaahBlackout = {
  start: string; // YYYY-MM-DD
  end: string;
  note?: string;
};

export type AvailabilitySettings = {
  version: 1;
  estee: {
    months: Record<string, EsteeMonthAvailability>;
  };
  lukaah: {
    /** Inclusive season bounds used to list bookable Mon–Fri weeks */
    seasonStart: string;
    seasonEnd: string;
    blackouts: LukaahBlackout[];
  };
};

export type EsteeTimeBlock = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

function ym(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

/** Built-in defaults — used until admin saves overrides. */
export function defaultAvailabilitySettings(now = new Date()): AvailabilitySettings {
  const year = now.getFullYear() < 2026 ? 2026 : now.getFullYear();
  return {
    version: 1,
    estee: {
      months: {
        [ym(year, 5)]: { open: true },
        [ym(year, 6)]: {
          open: true,
          note: "July lessons on the 15th and 16th move to the 29th and 30th. You still get 4 lessons in July — same weekday and time.",
        },
        [ym(year, 7)]: { open: true },
        [ym(year, 8)]: {
          open: true,
          emphasize: true,
          note: "September lessons run Wednesday & Thursday, 11:30 AM – 5:00 PM (4 Wednesdays — Sept 30 is not offered).",
          excludeWednesdays: [`${year}-09-30`],
          hours: { mode: "continuous", start: "11:30", end: "17:00" },
        },
      },
    },
    lukaah: {
      seasonStart: `${year}-06-01`,
      seasonEnd: `${year}-08-10`,
      blackouts: [
        { start: `${year}-07-11`, end: `${year}-07-22`, note: "Away" },
        { start: `${year}-07-27`, end: `${year}-08-07`, note: "Away" },
      ],
    },
  };
}

export function parseHm(hm: string): { hour: number; minute: number } | null {
  const m = hm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function hmToBlock(start: TimeHm, end: TimeHm): EsteeTimeBlock | null {
  const s = parseHm(start);
  const e = parseHm(end);
  if (!s || !e) return null;
  return {
    startHour: s.hour,
    startMinute: s.minute,
    endHour: e.hour,
    endMinute: e.minute,
  };
}

export function formatBlockLabel(block: EsteeTimeBlock): string {
  const fmt = (h: number, m: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  return `${fmt(block.startHour, block.startMinute)} – ${fmt(block.endHour, block.endMinute)}`;
}

const DEFAULT_AM: EsteeTimeBlock = { startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 };
const DEFAULT_PM: EsteeTimeBlock = { startHour: 12, startMinute: 30, endHour: 17, endMinute: 0 };

export function getEsteeScheduleBlocksFromSettings(
  settings: AvailabilitySettings,
  monthValue: string | null | undefined
): {
  mode: "split" | "continuous";
  am: EsteeTimeBlock | null;
  pm: EsteeTimeBlock;
  dayLabel: string;
  pmLabel: string;
} {
  const month = monthValue ? settings.estee.months[monthValue] : undefined;
  const hours = month?.hours;

  if (hours?.mode === "continuous") {
    const pm = hmToBlock(hours.start, hours.end) ?? {
      startHour: 11,
      startMinute: 30,
      endHour: 17,
      endMinute: 0,
    };
    const label = formatBlockLabel(pm);
    return { mode: "continuous", am: null, pm, dayLabel: label, pmLabel: label };
  }

  if (hours?.mode === "split") {
    const am = hmToBlock(hours.amStart, hours.amEnd) ?? DEFAULT_AM;
    const pm = hmToBlock(hours.pmStart, hours.pmEnd) ?? DEFAULT_PM;
    return {
      mode: "split",
      am,
      pm,
      dayLabel: `${formatBlockLabel(am)} & ${formatBlockLabel(pm)}`,
      pmLabel: formatBlockLabel(pm),
    };
  }

  return {
    mode: "split",
    am: DEFAULT_AM,
    pm: DEFAULT_PM,
    dayLabel: "8:00 AM – 11:30 AM & 12:30 PM – 5:00 PM",
    pmLabel: "12:30 PM – 5:00 PM",
  };
}

export function getEsteeBlockBoundsFromSettings(
  settings: AvailabilitySettings,
  primaryHm: string,
  monthValue?: string | null
): { start: number; end: number } {
  const blocks = getEsteeScheduleBlocksFromSettings(settings, monthValue);
  const toMin = (b: EsteeTimeBlock, which: "start" | "end") =>
    which === "start" ? b.startHour * 60 + b.startMinute : b.endHour * 60 + b.endMinute;

  if (blocks.mode === "continuous") {
    return { start: toMin(blocks.pm, "start"), end: toMin(blocks.pm, "end") };
  }

  const [hStr, mStr] = primaryHm.slice(0, 5).split(":");
  const minutes = Number(hStr) * 60 + Number(mStr);
  const noon = 12 * 60;
  if (blocks.am && minutes < noon) {
    return { start: toMin(blocks.am, "start"), end: toMin(blocks.am, "end") };
  }
  return { start: toMin(blocks.pm, "start"), end: toMin(blocks.pm, "end") };
}

export function listOpenEsteeMonths(
  settings: AvailabilitySettings
): { value: string; label: string; emphasize?: boolean; note?: string }[] {
  const entries = Object.entries(settings.estee.months)
    .filter(([, v]) => v.open)
    .sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([value, meta]) => {
    const [y, m] = value.split("-").map(Number);
    const label = new Date(y!, m! - 1, 15).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    return {
      value,
      label,
      emphasize: Boolean(meta.emphasize),
      note: meta.note,
    };
  });
}

export function applyEsteeExcludesFromSettings(
  settings: AvailabilitySettings,
  monthValue: string,
  wednesdays: string[],
  thursdays: string[]
): { wednesdays: string[]; thursdays: string[] } {
  const month = settings.estee.months[monthValue];
  if (!month) return { wednesdays, thursdays };
  const exW = new Set(month.excludeWednesdays ?? []);
  const exT = new Set(month.excludeThursdays ?? []);
  return {
    wednesdays: wednesdays.filter((d) => !exW.has(d)),
    thursdays: thursdays.filter((d) => !exT.has(d)),
  };
}

/** Deep-merge saved settings over defaults (saved wins per month key). */
export function mergeAvailabilitySettings(
  base: AvailabilitySettings,
  saved: Partial<AvailabilitySettings> | null | undefined
): AvailabilitySettings {
  if (!saved || typeof saved !== "object") return base;
  return {
    version: 1,
    estee: {
      months: {
        ...base.estee.months,
        ...(saved.estee?.months ?? {}),
      },
    },
    lukaah: {
      seasonStart: saved.lukaah?.seasonStart ?? base.lukaah.seasonStart,
      seasonEnd: saved.lukaah?.seasonEnd ?? base.lukaah.seasonEnd,
      blackouts: Array.isArray(saved.lukaah?.blackouts) ? saved.lukaah!.blackouts : base.lukaah.blackouts,
    },
  };
}

/** Candidate months for the admin picker (current month → +8). */
export function candidateAdminMonths(now = new Date()): string[] {
  const out: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < 9; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push(ym(d.getFullYear(), d.getMonth()));
  }
  return out;
}

export function monthLabel(ymValue: string): string {
  const [y, m] = ymValue.split("-").map(Number);
  return new Date(y!, m! - 1, 15).toLocaleString("en-US", { month: "long", year: "numeric" });
}
