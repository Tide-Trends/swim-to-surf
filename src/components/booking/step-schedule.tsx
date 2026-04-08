"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, addWeeks, addDays } from "date-fns";
import type { ScheduleSelection, SwimmerInfo } from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  formatPrice,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  INSTRUCTORS,
  getEsteeDatesForMonth,
  lessonDurationMinutesForSwimmer,
} from "@/lib/constants";
import {
  esteeUnavailableStartsForDay,
  lukaahUnavailableStarts,
  coerceBookingSlotRows,
  type BookingSlotRow,
} from "@/lib/booking-slots";
import { formatLessonTimeHm, timezoneBookingHint } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { generateSlotStartTimes, TimeSlotGrid } from "@/components/booking/time-slot-grid";
import { lukaahWeekOverlapsBlackout } from "@/lib/lukaah-availability";

/** Clear selected state for week/month/day pickers (parent can see what they chose). */
const selectedPickClasses =
  "border-[#0077B6] bg-[#0077B6] text-white shadow-md ring-2 ring-[#0077B6]/20";
const selectedPickSubtle = "text-white/90";
const selectedPickMuted = "text-white/75";

function normalizeHm(t: string): string {
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** Times already chosen by earlier swimmers on this booking (same week) — for amber highlight. */
function earlierLukaahTimesForWeek(weekStart: string | null, committed: ScheduleSelection[]): string[] {
  if (!weekStart) return [];
  const set = new Set<string>();
  for (const sch of committed) {
    if (sch.type !== "weekly" || sch.weekStart !== weekStart) continue;
    set.add(normalizeHm(sch.time));
  }
  return [...set];
}

/** All start times earlier swimmers booked on this weekday in this month (primary and optional second day). */
function earlierEsteeTimesOnWeekday(
  month: string | null,
  weekday: "wednesday" | "thursday",
  committed: ScheduleSelection[]
): string[] {
  if (!month) return [];
  const set = new Set<string>();
  for (const sch of committed) {
    if (sch.type !== "monthly" || sch.month !== month) continue;
    if (sch.primaryDay === weekday) set.add(normalizeHm(sch.primaryTime));
    const other: "wednesday" | "thursday" = sch.primaryDay === "wednesday" ? "thursday" : "wednesday";
    if (other === weekday && sch.secondDayTime) set.add(normalizeHm(sch.secondDayTime));
  }
  return [...set];
}

export interface StepScheduleProps {
  instructor: "lukaah" | "estee";
  swimmers: SwimmerInfo[];
  /** Already-scheduled swimmers in this booking (for slot conflicts). */
  committedSwimmers?: SwimmerInfo[];
  committedSchedules?: ScheduleSelection[];
  onSelect: (schedules: ScheduleSelection[]) => void;
  onBack: () => void;
}

function getSummerWeeks(): { start: Date; label: string }[] {
  const year = new Date().getFullYear() < 2026 ? 2026 : new Date().getFullYear();
  let current = new Date(`${year}-06-01T12:00:00Z`);
  const weeks: { start: Date; label: string }[] = [];
  while (current <= new Date(`${year}-08-10T12:00:00Z`)) {
    const endFriday = addDays(current, 4);
    weeks.push({
      start: current,
      label: `${format(current, "MMM d")} – ${format(endFriday, "MMM d, yyyy")}`,
    });
    current = addWeeks(current, 1);
  }
  return weeks;
}

function getSummerMonths(): { value: string; label: string }[] {
  const year = new Date().getFullYear() < 2026 ? 2026 : new Date().getFullYear();
  return [
    { value: `${year}-06`, label: `June ${year}` },
    { value: `${year}-07`, label: `July ${year}` },
    { value: `${year}-08`, label: `August ${year}` },
  ];
}

export function StepSchedule({
  instructor,
  swimmers,
  committedSwimmers = [],
  committedSchedules = [],
  onSelect,
  onBack,
}: StepScheduleProps) {
  if (instructor === "lukaah") {
    return (
      <LukaahScheduleStep
        swimmers={swimmers}
        committedSwimmers={committedSwimmers}
        committedSchedules={committedSchedules}
        onSelect={onSelect}
        onBack={onBack}
      />
    );
  }

  return (
    <EsteeScheduleStep
      swimmers={swimmers}
      committedSwimmers={committedSwimmers}
      committedSchedules={committedSchedules}
      onSelect={onSelect}
      onBack={onBack}
    />
  );
}

function esteeSyntheticRow(
  month: string,
  primaryDay: "wednesday" | "thursday",
  secondDay: boolean,
  primaryTime: string,
  secondDayTime: string | null,
  duration: number
): BookingSlotRow {
  const other: "wednesday" | "thursday" = primaryDay === "wednesday" ? "thursday" : "wednesday";
  return {
    lesson_time: primaryTime,
    second_day_time: secondDay && secondDayTime ? secondDayTime : null,
    day_of_week: secondDay && secondDayTime ? [primaryDay, other] : [primaryDay],
    month,
    lesson_duration: duration,
  };
}

function scheduleToLukaahRow(swimmer: SwimmerInfo, sch: Extract<ScheduleSelection, { type: "weekly" }>): BookingSlotRow {
  const dur = lessonDurationMinutesForSwimmer("lukaah", swimmer);
  return {
    lesson_time: sch.time,
    week_start: sch.weekStart,
    lesson_duration: dur,
    day_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    second_day_time: null,
  };
}

function scheduleToEsteeRow(swimmer: SwimmerInfo, sch: Extract<ScheduleSelection, { type: "monthly" }>): BookingSlotRow {
  const dur = lessonDurationMinutesForSwimmer("estee", swimmer);
  return esteeSyntheticRow(
    sch.month,
    sch.primaryDay,
    sch.secondDay && Boolean(sch.secondDayTime),
    sch.primaryTime,
    sch.secondDay && sch.secondDayTime ? sch.secondDayTime : null,
    dur
  );
}

function committedLukaahRowsForWeek(
  cSwimmers: SwimmerInfo[],
  cSchedules: ScheduleSelection[],
  weekStart: string
): BookingSlotRow[] {
  const out: BookingSlotRow[] = [];
  for (let i = 0; i < cSchedules.length; i++) {
    const sch = cSchedules[i]!;
    if (sch.type !== "weekly" || sch.weekStart !== weekStart) continue;
    out.push(scheduleToLukaahRow(cSwimmers[i]!, sch));
  }
  return out;
}

function committedEsteeRowsForMonth(
  cSwimmers: SwimmerInfo[],
  cSchedules: ScheduleSelection[],
  month: string
): BookingSlotRow[] {
  const out: BookingSlotRow[] = [];
  for (let i = 0; i < cSchedules.length; i++) {
    const sch = cSchedules[i]!;
    if (sch.type !== "monthly" || sch.month !== month) continue;
    out.push(scheduleToEsteeRow(cSwimmers[i]!, sch));
  }
  return out;
}

/** Sibling picks in this step, same week. */
function siblingLukaahRowsThisStep(
  weekStarts: (string | null)[],
  swimmers: SwimmerInfo[],
  times: (string | null)[],
  beforeIndex: number
): BookingSlotRow[] {
  const rows: BookingSlotRow[] = [];
  for (let j = 0; j < beforeIndex; j++) {
    const w = weekStarts[j];
    const t = times[j];
    if (!w || !t) continue;
    const dur = lessonDurationMinutesForSwimmer("lukaah", swimmers[j]!);
    rows.push({
      lesson_time: t,
      week_start: w,
      lesson_duration: dur,
      day_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      second_day_time: null,
    });
  }
  return rows;
}

function siblingEsteeRowsThisStepForMonth(
  swimmers: SwimmerInfo[],
  months: (string | null)[],
  primaryDays: ("wednesday" | "thursday")[],
  secondDays: boolean[],
  primaryTimes: (string | null)[],
  secondTimes: (string | null)[],
  beforeIndex: number,
  forMonth: string
): BookingSlotRow[] {
  const out: BookingSlotRow[] = [];
  for (let j = 0; j < beforeIndex; j++) {
    const m = months[j];
    if (m !== forMonth) continue;
    const p = primaryTimes[j];
    if (!p) continue;
    const pd = primaryDays[j] ?? "wednesday";
    const sd = secondDays[j] ?? false;
    const dur = lessonDurationMinutesForSwimmer("estee", swimmers[j]!);
    if (sd) {
      const sec = secondTimes[j];
      if (!sec) continue;
      out.push(esteeSyntheticRow(m, pd, true, p, sec, dur));
    } else {
      out.push(esteeSyntheticRow(m, pd, false, p, null, dur));
    }
  }
  return out;
}

function LukaahScheduleStep({
  swimmers,
  committedSwimmers,
  committedSchedules,
  onSelect,
  onBack,
}: {
  swimmers: SwimmerInfo[];
  committedSwimmers: SwimmerInfo[];
  committedSchedules: ScheduleSelection[];
  onSelect: (schedules: ScheduleSelection[]) => void;
  onBack: () => void;
}) {
  const weeks = useMemo(
    () =>
      getSummerWeeks().filter((w) => !lukaahWeekOverlapsBlackout(format(w.start, "yyyy-MM-dd"))),
    []
  );
  const [selectedWeeks, setSelectedWeeks] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [selectedTimes, setSelectedTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [rowsByWeek, setRowsByWeek] = useState<Record<string, BookingSlotRow[]>>({});

  const inst = INSTRUCTORS.lukaah;

  useEffect(() => {
    setSelectedWeeks((p) => swimmers.map((_, i) => p[i] ?? null));
    setSelectedTimes((p) => swimmers.map((_, i) => p[i] ?? null));
  }, [swimmers.length]);

  const perSwimmerSlots = useMemo(
    () =>
      swimmers.map((sw) => {
        const dur = lessonDurationMinutesForSwimmer("lukaah", sw);
        return {
          duration: dur,
          candidates: generateSlotStartTimes(
            inst.startHour,
            inst.startMinute,
            inst.endHour,
            inst.endMinute,
            dur,
            15
          ),
        };
      }),
    [swimmers, inst.endHour, inst.endMinute, inst.startHour, inst.startMinute]
  );

  const totalPriceCents = useMemo(
    () =>
      swimmers.reduce((sum, sw) => {
        const tier = effectiveLessonTier(sw.swimmerAge, sw.lessonTier ?? "auto");
        return sum + getLukaahPricingForTier(tier).price;
      }, 0),
    [swimmers]
  );

  const fetchWeek = useCallback(async (weekStart: string) => {
    setRowsByWeek((prev) => {
      if (prev[weekStart]) return prev;
      return prev;
    });
    try {
      const res = await fetch(`/api/bookings?instructor=lukaah&week_start=${weekStart}&availability=1`);
      if (res.ok) {
        const data = await res.json();
        const rows = coerceBookingSlotRows(data);
        setRowsByWeek((prev) => ({ ...prev, [weekStart]: rows }));
      }
    } catch {
      setRowsByWeek((prev) => ({ ...prev, [weekStart]: [] }));
    }
  }, []);

  const weeksNeeded = useMemo(
    () => [...new Set(selectedWeeks.filter((w): w is string => Boolean(w)))],
    [selectedWeeks]
  );

  useEffect(() => {
    for (const w of weeksNeeded) {
      void fetchWeek(w);
    }
  }, [weeksNeeded, fetchWeek]);

  function setWeekAt(index: number, week: string) {
    setSelectedWeeks((arr) => {
      const n = [...arr];
      n[index] = week;
      return n;
    });
    setSelectedTimes((arr) => {
      const n = [...arr];
      n[index] = null;
      return n;
    });
    void fetchWeek(week);
    setTimeout(() => {
      document.getElementById(`lukaah-time-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function setTimeAt(index: number, t: string) {
    setSelectedTimes((arr) => {
      const n = [...arr];
      n[index] = t;
      return n;
    });
  }

  function handleContinue() {
    if (selectedWeeks.some((w) => !w) || selectedTimes.some((t) => !t)) return;
    onSelect(
      swimmers.map((_, i) => ({
        type: "weekly" as const,
        weekStart: selectedWeeks[i]!,
        time: selectedTimes[i]!,
      }))
    );
  }

  const allPicked = selectedWeeks.every(Boolean) && selectedTimes.every(Boolean);

  return (
    <div className="space-y-10">
      <p className="rounded-xl border border-black/5 bg-[#F5F5F7] px-4 py-3 font-ui text-xs leading-relaxed text-[#1D1D1F]/80">
        {timezoneBookingHint()}
      </p>

      {committedSwimmers.length > 0 && swimmers.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3.5 md:px-5">
          <p className="font-ui text-sm font-semibold text-amber-950">
            Scheduling {swimmers[0]?.swimmerName}
          </p>
          <p className="mt-1 font-ui text-xs leading-relaxed text-amber-950/85">
            Pick a week, then a daily start time. Amber times match another swimmer on this booking — you can choose the
            same slot if it&apos;s still free.
          </p>
        </div>
      )}

      <p className="text-sm text-[#86868B] font-body max-w-2xl">
        {committedSwimmers.length > 0
          ? "Choose their week and daily time below."
          : "Each swimmer picks their own summer week and daily start time. Weeks can differ within the same family booking."}
      </p>
      <p className="rounded-xl border border-[#0077B6]/20 bg-[#E8F4FD]/80 px-4 py-3 font-ui text-xs leading-relaxed text-[#1D3557]">
        Lukaah is away <strong className="font-semibold">July 27 – August 7</strong> — those weeks aren’t offered.
      </p>

      {swimmers.map((sw, i) => {
        const wk = selectedWeeks[i];
        const earlierTimes = wk ? earlierLukaahTimesForWeek(wk, committedSchedules) : [];
        const { duration: durI, candidates: candI } = perSwimmerSlots[i]!;
        const fromDb = wk ? rowsByWeek[wk] ?? [] : [];
        const fromCommitted = wk ? committedLukaahRowsForWeek(committedSwimmers, committedSchedules, wk) : [];
        const fromSiblings = siblingLukaahRowsThisStep(selectedWeeks, swimmers, selectedTimes, i);
        const pool = [...fromDb, ...fromCommitted, ...fromSiblings];
        const taken = wk ? lukaahUnavailableStarts(pool, wk, durI, candI) : [];

        return (
          <div key={sw.swimmerName + i} className="space-y-6 border-t border-black/5 pt-10 first:border-t-0 first:pt-0">
            <h3 className="font-display text-2xl font-medium tracking-tight text-[#1D1D1F]">{sw.swimmerName}</h3>
            <div>
              <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B] mb-4">
                Summer week (Mon–Fri)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weeks.map((w) => {
                  const val = format(w.start, "yyyy-MM-dd");
                  const active = wk === val;
                  return (
                    <button
                      key={`${i}-${val}`}
                      type="button"
                      onClick={() => setWeekAt(i, val)}
                      className={`px-5 py-4 rounded-[1.5rem] border text-left transition-all duration-300 cursor-pointer ${
                        active
                          ? selectedPickClasses
                          : "border-black/5 bg-white hover:border-black/10 hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`font-ui text-[10px] uppercase tracking-[0.2em] mb-1 ${
                          active ? `${selectedPickSubtle} font-semibold` : "text-[#86868B] font-medium"
                        }`}
                      >
                        Week of
                      </div>
                      <div className={`font-display text-lg ${active ? "text-white" : "text-[#1D1D1F]"}`}>
                        {w.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {wk && (
              <div id={`lukaah-time-${i}`} className="animate-in fade-in duration-500 space-y-3">
                <h4 className="font-display text-xl font-medium text-[#1D1D1F]">Daily start time</h4>
                <p className="text-[#86868B] font-body text-sm">Same time Monday – Friday · {durI} min lessons</p>
                <TimeSlotGrid
                  startHour={inst.startHour}
                  startMinute={inst.startMinute}
                  endHour={inst.endHour}
                  endMinute={inst.endMinute}
                  duration={durI}
                  selected={selectedTimes[i] ?? null}
                  takenSlots={taken}
                  earlierSwimmerSlots={earlierTimes}
                  onSelect={(t) => setTimeAt(i, t)}
                  showTimezoneHint={i === 0}
                />
              </div>
            )}
          </div>
        );
      })}

      {allPicked && (
        <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-4">
          <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] block">Your schedule</span>
          {swimmers.map((sw, i) => {
            const wk = selectedWeeks[i]!;
            const wkLabel = weeks.find((w) => format(w.start, "yyyy-MM-dd") === wk)?.label ?? wk;
            return (
              <p key={i} className="font-display text-lg text-[#1D1D1F]">
                <span className="font-ui text-sm text-[#86868B] block">{sw.swimmerName}</span>
                Mon – Fri at {formatLessonTimeHm(selectedTimes[i]!)} · {perSwimmerSlots[i]!.duration} min · week of {wkLabel}
              </p>
            );
          })}
          <div className="flex items-end justify-between border-t border-black/5 pt-6">
            <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
            <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">{formatPrice(totalPriceCents)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!allPicked}
          className="flex-1 order-1 sm:order-2 rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function EsteeScheduleStep({
  swimmers,
  committedSwimmers,
  committedSchedules,
  onSelect,
  onBack,
}: {
  swimmers: SwimmerInfo[];
  committedSwimmers: SwimmerInfo[];
  committedSchedules: ScheduleSelection[];
  onSelect: (schedules: ScheduleSelection[]) => void;
  onBack: () => void;
}) {
  const months = getSummerMonths();
  const [selectedMonths, setSelectedMonths] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [primaryDays, setPrimaryDays] = useState<("wednesday" | "thursday")[]>(() => swimmers.map(() => "wednesday"));
  const [secondDays, setSecondDays] = useState<boolean[]>(() => swimmers.map(() => false));
  const [primaryTimes, setPrimaryTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [secondTimes, setSecondTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [rowsByMonth, setRowsByMonth] = useState<Record<string, BookingSlotRow[]>>({});
  const fetchedMonths = useRef<Set<string>>(new Set());

  const schedule = INSTRUCTORS.estee.schedule;
  const amBlock = schedule.wednesday.am;
  const pmBlock = schedule.wednesday.pm;

  useEffect(() => {
    setSelectedMonths((p) => swimmers.map((_, i) => p[i] ?? null));
    setPrimaryDays((p) => swimmers.map((_, i) => p[i] ?? "wednesday"));
    setSecondDays((p) => swimmers.map((_, i) => p[i] ?? false));
    setPrimaryTimes((p) => swimmers.map((_, i) => p[i] ?? null));
    setSecondTimes((p) => swimmers.map((_, i) => p[i] ?? null));
  }, [swimmers.length]);

  const perSwimmerEstee = useMemo(
    () =>
      swimmers.map((sw) => {
        const dur = lessonDurationMinutesForSwimmer("estee", sw);
        return {
          duration: dur,
          candAm: generateSlotStartTimes(
            amBlock.startHour,
            amBlock.startMinute,
            amBlock.endHour,
            amBlock.endMinute,
            dur,
            15
          ),
          candPm: generateSlotStartTimes(
            pmBlock.startHour,
            pmBlock.startMinute,
            pmBlock.endHour,
            pmBlock.endMinute,
            dur,
            15
          ),
          monthlyUnitCents: getEsteePricingForTier(effectiveLessonTier(sw.swimmerAge, sw.lessonTier ?? "auto")).price,
        };
      }),
    [swimmers, amBlock, pmBlock]
  );

  const fetchMonth = useCallback(async (month: string) => {
    if (fetchedMonths.current.has(month)) return;
    fetchedMonths.current.add(month);
    try {
      const res = await fetch(`/api/bookings?instructor=estee&month=${month}&availability=1`);
      if (res.ok) {
        const data = await res.json();
        setRowsByMonth((prev) => ({ ...prev, [month]: coerceBookingSlotRows(data) }));
      } else {
        setRowsByMonth((prev) => ({ ...prev, [month]: [] }));
      }
    } catch {
      setRowsByMonth((prev) => ({ ...prev, [month]: [] }));
    }
  }, []);

  const monthsNeeded = useMemo(() => {
    const s = new Set<string>();
    for (const m of selectedMonths) if (m) s.add(m);
    for (const sch of committedSchedules) {
      if (sch.type === "monthly") s.add(sch.month);
    }
    return [...s];
  }, [selectedMonths, committedSchedules]);

  useEffect(() => {
    for (const m of monthsNeeded) {
      void fetchMonth(m);
    }
  }, [monthsNeeded, fetchMonth]);

  function setMonthAt(index: number, month: string) {
    setSelectedMonths((arr) => {
      const n = [...arr];
      n[index] = month;
      return n;
    });
    setPrimaryTimes((arr) => {
      const n = [...arr];
      n[index] = null;
      return n;
    });
    setSecondTimes((arr) => {
      const n = [...arr];
      n[index] = null;
      return n;
    });
    void fetchMonth(month);
    setTimeout(() => {
      document.getElementById(`estee-day-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function setPrimaryDayAt(index: number, day: "wednesday" | "thursday") {
    setPrimaryDays((arr) => {
      const n = [...arr];
      n[index] = day;
      return n;
    });
    setPrimaryTimes((arr) => {
      const n = [...arr];
      n[index] = null;
      return n;
    });
  }

  function setSecondDayAt(index: number, v: boolean) {
    setSecondDays((arr) => {
      const n = [...arr];
      n[index] = v;
      return n;
    });
    setSecondTimes((arr) => {
      const n = [...arr];
      n[index] = null;
      return n;
    });
  }

  function setPrimaryAt(index: number, t: string) {
    setPrimaryTimes((arr) => {
      const n = [...arr];
      n[index] = t;
      return n;
    });
  }

  function setSecondAt(index: number, t: string) {
    setSecondTimes((arr) => {
      const n = [...arr];
      n[index] = t;
      return n;
    });
  }

  function takenPrimaryForSwimmer(i: number, part: "am" | "pm") {
    const m = selectedMonths[i];
    if (!m) return [];
    const dur = perSwimmerEstee[i]!.duration;
    const cand = part === "am" ? perSwimmerEstee[i]!.candAm : perSwimmerEstee[i]!.candPm;
    const pd = primaryDays[i] ?? "wednesday";
    const fromDb = rowsByMonth[m] ?? [];
    const fromCommitted = committedEsteeRowsForMonth(committedSwimmers, committedSchedules, m);
    const fromSiblings = siblingEsteeRowsThisStepForMonth(
      swimmers,
      selectedMonths,
      primaryDays,
      secondDays,
      primaryTimes,
      secondTimes,
      i,
      m
    );
    const pool = [...fromDb, ...fromCommitted, ...fromSiblings];
    return esteeUnavailableStartsForDay(pool, m, pd, dur, cand);
  }

  function takenSecondForSwimmer(i: number, part: "am" | "pm") {
    const m = selectedMonths[i];
    if (!m) return [];
    const dur = perSwimmerEstee[i]!.duration;
    const cand = part === "am" ? perSwimmerEstee[i]!.candAm : perSwimmerEstee[i]!.candPm;
    const pd = primaryDays[i] ?? "wednesday";
    const otherDay = pd === "wednesday" ? "thursday" : "wednesday";
    const fromDb = rowsByMonth[m] ?? [];
    const fromCommitted = committedEsteeRowsForMonth(committedSwimmers, committedSchedules, m);
    const fromSiblings = siblingEsteeRowsThisStepForMonth(
      swimmers,
      selectedMonths,
      primaryDays,
      secondDays,
      primaryTimes,
      secondTimes,
      i,
      m
    );
    const pool = [...fromDb, ...fromCommitted, ...fromSiblings];
    return esteeUnavailableStartsForDay(pool, m, otherDay, dur, cand);
  }

  function handleContinue() {
    if (selectedMonths.some((x) => !x) || primaryTimes.some((x) => !x)) return;
    for (let i = 0; i < swimmers.length; i++) {
      if (secondDays[i] && !secondTimes[i]) return;
    }
    onSelect(
      swimmers.map((_, i) => ({
        type: "monthly" as const,
        month: selectedMonths[i]!,
        primaryDay: primaryDays[i]!,
        primaryTime: primaryTimes[i]!,
        secondDay: secondDays[i]!,
        secondDayTime: secondDays[i]! ? secondTimes[i]! : null,
      }))
    );
  }

  const totalBookingCents = useMemo(
    () =>
      perSwimmerEstee.reduce((sum, row, i) => sum + (secondDays[i] ? row.monthlyUnitCents * 2 : row.monthlyUnitCents), 0),
    [perSwimmerEstee, secondDays]
  );

  const primaryComplete = selectedMonths.every(Boolean) && primaryTimes.every(Boolean);
  const secondComplete = secondDays.every((sd, i) => !sd || Boolean(secondTimes[i]));
  const canSubmit = primaryComplete && secondComplete;

  return (
    <div className="space-y-10">
      <p className="rounded-xl border border-black/5 bg-[#F5F5F7] px-4 py-3 font-ui text-xs leading-relaxed text-[#1D1D1F]/80">
        {timezoneBookingHint()}
      </p>

      {committedSwimmers.length > 0 && swimmers.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3.5 md:px-5">
          <p className="font-ui text-sm font-semibold text-amber-950">
            Scheduling {swimmers[0]?.swimmerName}
          </p>
          <p className="mt-1 font-ui text-xs leading-relaxed text-amber-950/85">
            Choose month, weekday, then times. Amber = another swimmer on this booking already chose that time on that
            day (you can pick it if it&apos;s open).
          </p>
        </div>
      )}

      <p className="text-sm text-[#86868B] font-body max-w-2xl">
        {committedSwimmers.length > 0
          ? "Choose their month, days, and times below."
          : "Each swimmer picks their own month, weekday pattern, and times. Months and patterns can differ within the same booking."}
      </p>

      {swimmers.map((sw, i) => {
        const m = selectedMonths[i];
        const monthDates = m ? getEsteeDatesForMonth(m) : null;
        const pd = primaryDays[i] ?? "wednesday";
        const otherDay = pd === "wednesday" ? "thursday" : "wednesday";
        const sd = secondDays[i] ?? false;
        const earlierOnPrimary = m ? earlierEsteeTimesOnWeekday(m, pd, committedSchedules) : [];
        const earlierOnSecond = m ? earlierEsteeTimesOnWeekday(m, otherDay, committedSchedules) : [];

        return (
          <div key={sw.swimmerName + i} className="space-y-8 border-t border-black/5 pt-10 first:border-t-0 first:pt-0">
            <h3 className="font-display text-2xl font-medium tracking-tight text-[#1D1D1F]">{sw.swimmerName}</h3>

            <div>
              <h4 className="font-display text-lg font-medium tracking-tight mb-4">Month</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {months.map((mo) => {
                  const active = m === mo.value;
                  const dates = getEsteeDatesForMonth(mo.value);
                  return (
                    <button
                      key={`${i}-${mo.value}`}
                      type="button"
                      onClick={() => setMonthAt(i, mo.value)}
                      className={`px-5 py-4 rounded-[1.5rem] border text-center transition-all duration-300 cursor-pointer ${
                        active
                          ? `${selectedPickClasses} font-semibold`
                          : "border-black/5 bg-white hover:border-black/10 hover:shadow-md text-[#86868B]"
                      }`}
                    >
                      <div className={`font-ui text-sm font-medium ${active ? "text-white" : ""}`}>{mo.label}</div>
                      <div className={`font-ui text-[10px] mt-1 ${active ? selectedPickMuted : "text-[#86868B]/60"}`}>
                        {dates.wednesdays.length} Wed &middot; {dates.thursdays.length} Thu
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {m && monthDates &&
              (committedSwimmers.length > 0 ? (
                <details className="group rounded-[1.5rem] border border-ocean-light/30 bg-ocean-surf/20 px-4 py-3 md:px-6 md:py-4">
                  <summary className="cursor-pointer list-none font-ui text-sm font-medium text-ocean-deep [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2">
                      Lesson dates this month
                      <span className="text-xs font-normal text-[#86868B]">(tap to expand)</span>
                    </span>
                  </summary>
                  <div className="mt-4 grid sm:grid-cols-2 gap-4 pb-2">
                    <div>
                      <p className="font-ui text-xs text-[#86868B] mb-2">Wednesdays</p>
                      <div className="flex flex-wrap gap-2">
                        {monthDates.wednesdays.map((d) => (
                          <span
                            key={d}
                            className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5"
                          >
                            {format(new Date(d + "T12:00:00"), "MMM d")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-ui text-xs text-[#86868B] mb-2">Thursdays</p>
                      <div className="flex flex-wrap gap-2">
                        {monthDates.thursdays.map((d) => (
                          <span
                            key={d}
                            className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5"
                          >
                            {format(new Date(d + "T12:00:00"), "MMM d")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              ) : (
                <div className="bg-ocean-surf/30 border border-ocean-light/30 rounded-[1.5rem] p-6">
                  <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-3">Lesson dates</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-ui text-xs text-[#86868B] mb-2">Wednesdays</p>
                      <div className="flex flex-wrap gap-2">
                        {monthDates.wednesdays.map((d) => (
                          <span
                            key={d}
                            className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5"
                          >
                            {format(new Date(d + "T12:00:00"), "MMM d")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-ui text-xs text-[#86868B] mb-2">Thursdays</p>
                      <div className="flex flex-wrap gap-2">
                        {monthDates.thursdays.map((d) => (
                          <span
                            key={d}
                            className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5"
                          >
                            {format(new Date(d + "T12:00:00"), "MMM d")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {m && (
              <div id={`estee-day-${i}`} className="space-y-6">
                <h4 className="font-display text-lg font-medium tracking-tight">Primary weekday</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["wednesday", "thursday"] as const).map((day) => {
                    const active = pd === day;
                    const numDates = day === "wednesday" ? monthDates!.wednesdays.length : monthDates!.thursdays.length;
                    return (
                      <button
                        key={`${i}-${day}`}
                        type="button"
                        onClick={() => setPrimaryDayAt(i, day)}
                        className={`px-5 py-4 rounded-[1.5rem] border text-center transition-all duration-300 cursor-pointer ${
                          active
                            ? selectedPickClasses
                            : "border-black/5 bg-white hover:border-black/10 hover:shadow-md"
                        }`}
                      >
                        <span
                          className={`capitalize font-display text-lg mb-1 block ${active ? "text-white" : "text-[#1D1D1F]"}`}
                        >
                          {day}
                        </span>
                        <span className={`text-xs font-ui ${active ? `${selectedPickSubtle} font-medium` : "text-[#86868B]"}`}>
                          8:00 AM – 11:30 AM & 12:30 PM – 4:00 PM
                        </span>
                        <span className={`text-[10px] font-ui block mt-1 ${active ? selectedPickMuted : "text-[#86868B]/60"}`}>
                          {numDates} lessons this month
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-6 border-t border-black/5 pt-8">
                  <h4 className="font-display text-xl font-medium">
                    Times · <span className="capitalize">{pd}</span>
                  </h4>
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">
                      Morning (8:00 AM – 11:30 AM)
                    </p>
                    <TimeSlotGrid
                      startHour={amBlock.startHour}
                      startMinute={amBlock.startMinute}
                      endHour={amBlock.endHour}
                      endMinute={amBlock.endMinute}
                      duration={perSwimmerEstee[i]!.duration}
                      selected={primaryTimes[i] ?? null}
                      takenSlots={takenPrimaryForSwimmer(i, "am")}
                      earlierSwimmerSlots={earlierOnPrimary}
                      onSelect={(t) => setPrimaryAt(i, t)}
                      showTimezoneHint={i === 0}
                    />
                  </div>
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">
                      Afternoon (12:30 PM – 4:00 PM)
                    </p>
                    <TimeSlotGrid
                      startHour={pmBlock.startHour}
                      startMinute={pmBlock.startMinute}
                      endHour={pmBlock.endHour}
                      endMinute={pmBlock.endMinute}
                      duration={perSwimmerEstee[i]!.duration}
                      selected={primaryTimes[i] ?? null}
                      takenSlots={takenPrimaryForSwimmer(i, "pm")}
                      earlierSwimmerSlots={earlierOnPrimary}
                      onSelect={(t) => setPrimaryAt(i, t)}
                    />
                  </div>
                </div>

                <div className="bg-[#F5F5F7] rounded-[2rem] p-6 border border-black/5">
                  <Toggle
                    checked={sd}
                    onChange={(checked) => setSecondDayAt(i, checked)}
                    label={`Add second weekday (+${formatPrice(perSwimmerEstee[i]!.monthlyUnitCents)} for ${sw.swimmerName})`}
                    description={
                      sd
                        ? `Adds ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s — 8 lessons this month for ${sw.swimmerName}.`
                        : `4 lessons on ${pd.charAt(0).toUpperCase() + pd.slice(1)} only, or add 4 more on ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s.`
                    }
                  />
                </div>

                {sd && (
                  <div className="space-y-6 border-t border-black/5 pt-8">
                    <h4 className="font-display text-xl font-medium">
                      Second day · <span className="capitalize">{otherDay}</span>
                    </h4>
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">
                        Morning (8:00 AM – 11:30 AM)
                      </p>
                      <TimeSlotGrid
                        startHour={amBlock.startHour}
                        startMinute={amBlock.startMinute}
                        endHour={amBlock.endHour}
                        endMinute={amBlock.endMinute}
                        duration={perSwimmerEstee[i]!.duration}
                        selected={secondTimes[i] ?? null}
                        takenSlots={takenSecondForSwimmer(i, "am")}
                        earlierSwimmerSlots={earlierOnSecond}
                        onSelect={(t) => setSecondAt(i, t)}
                      />
                    </div>
                    <div>
                      <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">
                        Afternoon (12:30 PM – 4:00 PM)
                      </p>
                      <TimeSlotGrid
                        startHour={pmBlock.startHour}
                        startMinute={pmBlock.startMinute}
                        endHour={pmBlock.endHour}
                        endMinute={pmBlock.endMinute}
                        duration={perSwimmerEstee[i]!.duration}
                        selected={secondTimes[i] ?? null}
                        takenSlots={takenSecondForSwimmer(i, "pm")}
                        earlierSwimmerSlots={earlierOnSecond}
                        onSelect={(t) => setSecondAt(i, t)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {primaryComplete && (
        <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-4">
          <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] block">Your schedule</span>
          {swimmers.map((sw, i) => {
            const schM = selectedMonths[i]!;
            const moLabel = months.find((x) => x.value === schM)?.label ?? schM;
            const pd = primaryDays[i]!;
            const lessons = secondDays[i] ? 8 : 4;
            return (
              <div key={i} className="font-body text-[#1D1D1F]">
                <p className="font-ui text-xs text-[#86868B]">{sw.swimmerName}</p>
                <p className="font-display text-lg">
                  Every <span className="capitalize">{pd}</span> at {formatLessonTimeHm(primaryTimes[i]!)}
                  {secondDays[i] && secondTimes[i] && (
                    <span className="block text-base mt-1 text-[#1D1D1F]/85">
                      + <span className="capitalize">{pd === "wednesday" ? "Thursday" : "Wednesday"}</span> at{" "}
                      {formatLessonTimeHm(secondTimes[i]!)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-[#86868B] mt-1">
                  {moLabel} · {lessons} lessons · {perSwimmerEstee[i]!.duration} min
                </p>
              </div>
            );
          })}
          <div className="flex items-end justify-between border-t border-black/5 pt-6">
            <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
            <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">{formatPrice(totalBookingCents)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canSubmit}
          className="flex-1 order-1 sm:order-2 rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
