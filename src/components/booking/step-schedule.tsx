"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addWeeks, addDays } from "date-fns";
import type { ScheduleSelection, LukaahSchedule, EsteeSchedule, SwimmerInfo } from "@/lib/booking-schema";
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

interface Props {
  instructor: "lukaah" | "estee";
  swimmers: SwimmerInfo[];
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

export function StepSchedule({ instructor, swimmers, onSelect, onBack }: Props) {
  if (instructor === "lukaah") {
    return <LukaahScheduleStep swimmers={swimmers} onSelect={onSelect} onBack={onBack} />;
  }

  return <EsteeScheduleStep swimmers={swimmers} onSelect={onSelect} onBack={onBack} />;
}

function siblingLukaahRows(
  weekStart: string,
  swimmers: SwimmerInfo[],
  times: (string | null)[],
  beforeIndex: number
): BookingSlotRow[] {
  const rows: BookingSlotRow[] = [];
  for (let j = 0; j < beforeIndex; j++) {
    const t = times[j];
    if (!t) continue;
    const dur = lessonDurationMinutesForSwimmer("lukaah", swimmers[j]!);
    rows.push({
      lesson_time: t,
      week_start: weekStart,
      lesson_duration: dur,
      day_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      second_day_time: null,
    });
  }
  return rows;
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

function siblingEsteeComplete(
  month: string,
  primaryDay: "wednesday" | "thursday",
  secondDay: boolean,
  primaryTimes: (string | null)[],
  secondTimes: (string | null)[],
  swimmers: SwimmerInfo[],
  beforeIndex: number
): BookingSlotRow[] {
  const out: BookingSlotRow[] = [];
  for (let j = 0; j < beforeIndex; j++) {
    const p = primaryTimes[j];
    if (!p) continue;
    const dur = lessonDurationMinutesForSwimmer("estee", swimmers[j]!);
    if (secondDay) {
      const sec = secondTimes[j];
      if (!sec) continue;
      out.push(esteeSyntheticRow(month, primaryDay, true, p, sec, dur));
    } else {
      out.push(esteeSyntheticRow(month, primaryDay, false, p, null, dur));
    }
  }
  return out;
}

function LukaahScheduleStep({
  swimmers,
  onSelect,
  onBack,
}: {
  swimmers: SwimmerInfo[];
  onSelect: (schedules: ScheduleSelection[]) => void;
  onBack: () => void;
}) {
  const weeks = getSummerWeeks();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [dbRows, setDbRows] = useState<BookingSlotRow[]>([]);

  const inst = INSTRUCTORS.lukaah;

  useEffect(() => {
    setSelectedTimes((prev) => swimmers.map((_, i) => prev[i] ?? null));
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

  const fetchTaken = useCallback(
    async (weekStart: string) => {
      try {
        const res = await fetch(`/api/bookings?instructor=lukaah&week_start=${weekStart}&status=confirmed`);
        if (res.ok) {
          const data = await res.json();
          setDbRows(coerceBookingSlotRows(data));
        } else {
          setDbRows([]);
        }
      } catch {
        setDbRows([]);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedWeek) {
      void fetchTaken(selectedWeek);
      setSelectedTimes(swimmers.map(() => null));
    }
  }, [selectedWeek, fetchTaken, swimmers.length]);

  function setTimeAt(index: number, t: string) {
    setSelectedTimes((arr) => {
      const n = [...arr];
      n[index] = t;
      return n;
    });
  }

  function handleContinue() {
    if (!selectedWeek || selectedTimes.some((x) => !x)) return;
    onSelect(
      swimmers.map((_, i) => ({
        type: "weekly" as const,
        weekStart: selectedWeek,
        time: selectedTimes[i]!,
      }))
    );
  }

  const selectedWeekObj = weeks.find((w) => format(w.start, "yyyy-MM-dd") === selectedWeek);
  const allPicked = Boolean(selectedWeek && selectedTimes.every(Boolean));

  return (
    <div className="space-y-10">
      <p className="rounded-xl border border-black/5 bg-[#F5F5F7] px-4 py-3 font-ui text-xs leading-relaxed text-[#1D1D1F]/80">
        {timezoneBookingHint()}
      </p>

      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose your week</h3>
        <p className="text-[#86868B] text-sm mb-4 font-body">
          {swimmers.length > 1
            ? "Everyone shares this week; each swimmer picks their own daily start time below."
            : "Pick the week for your Mon–Fri lessons."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weeks.map((w) => {
            const val = format(w.start, "yyyy-MM-dd");
            const active = selectedWeek === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setSelectedWeek(val);
                  setTimeout(() => {
                    document.getElementById("time-selection")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
                className={`px-6 py-5 rounded-[1.5rem] border text-left transition-all duration-300 cursor-pointer ${
                  active
                    ? "border-[#1D1D1F] bg-[#1D1D1F]/5 shadow-sm"
                    : "border-black/5 bg-white hover:border-black/10 hover:shadow-md"
                }`}
              >
                <div
                  className={`font-ui text-xs uppercase tracking-[0.2em] mb-2 ${active ? "text-[#1D1D1F] font-semibold" : "text-[#86868B] font-medium"}`}
                >
                  Week of
                </div>
                <div className="font-display text-xl text-[#1D1D1F]">{w.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedWeek && (
        <div
          id="time-selection"
          className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both border-t border-black/5 pt-10 space-y-12"
        >
          <h3 className="font-display text-3xl font-medium tracking-tight">Choose times</h3>
          {swimmers.map((sw, i) => {
            const { duration: durI, candidates: candI } = perSwimmerSlots[i]!;
            const pool = [...dbRows, ...siblingLukaahRows(selectedWeek, swimmers, selectedTimes, i)];
            const taken = lukaahUnavailableStarts(pool, selectedWeek, durI, candI);
            return (
              <div key={sw.swimmerName + i} className="space-y-4">
                <div>
                  <h4 className="font-display text-xl font-medium text-[#1D1D1F]">{sw.swimmerName}</h4>
                  <p className="text-[#86868B] font-body text-sm">
                    Same time Monday – Friday for this week ({durI} min lessons).
                  </p>
                </div>
                <TimeSlotGrid
                  startHour={inst.startHour}
                  startMinute={inst.startMinute}
                  endHour={inst.endHour}
                  endMinute={inst.endMinute}
                  duration={durI}
                  selected={selectedTimes[i] ?? null}
                  takenSlots={taken}
                  onSelect={(t) => setTimeAt(i, t)}
                  showTimezoneHint={i === 0}
                />
              </div>
            );
          })}
        </div>
      )}

      {selectedWeek && allPicked && selectedWeekObj && (
        <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-4">
          <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] block">Your schedule</span>
          {swimmers.map((sw, i) => (
            <p key={i} className="font-display text-xl text-[#1D1D1F]">
              <span className="font-ui text-sm text-[#86868B] block">{sw.swimmerName}</span>
              Mon – Fri at {formatLessonTimeHm(selectedTimes[i]!)} · {perSwimmerSlots[i]!.duration} min
            </p>
          ))}
          <p className="font-ui text-sm text-[#86868B]">Week of {selectedWeekObj.label}</p>
          <div className="flex items-end justify-between border-t border-black/5 pt-6">
            <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
            <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">
              {formatPrice(totalPriceCents)}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedWeek || !allPicked}
          className="flex-1 order-1 sm:order-2 rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function EsteeScheduleStep({
  swimmers,
  onSelect,
  onBack,
}: {
  swimmers: SwimmerInfo[];
  onSelect: (schedules: ScheduleSelection[]) => void;
  onBack: () => void;
}) {
  const months = getSummerMonths();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [primaryDay, setPrimaryDay] = useState<"wednesday" | "thursday">("wednesday");
  const [secondDay, setSecondDay] = useState(false);
  const [primaryTimes, setPrimaryTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [secondTimes, setSecondTimes] = useState<(string | null)[]>(() => swimmers.map(() => null));
  const [dbRows, setDbRows] = useState<BookingSlotRow[]>([]);

  const schedule = INSTRUCTORS.estee.schedule;
  const amBlock = schedule.wednesday.am;
  const pmBlock = schedule.wednesday.pm;

  const monthDates = selectedMonth ? getEsteeDatesForMonth(selectedMonth) : null;

  useEffect(() => {
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
          monthlyUnitCents: getEsteePricingForTier(
            effectiveLessonTier(sw.swimmerAge, sw.lessonTier ?? "auto")
          ).price,
        };
      }),
    [swimmers, amBlock, pmBlock]
  );

  const fetchTaken = useCallback(async (month: string) => {
    try {
      const res = await fetch(`/api/bookings?instructor=estee&month=${month}&status=confirmed`);
      if (res.ok) {
        const data = await res.json();
        setDbRows(coerceBookingSlotRows(data));
      } else {
        setDbRows([]);
      }
    } catch {
      setDbRows([]);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      void fetchTaken(selectedMonth);
      setPrimaryTimes(swimmers.map(() => null));
      setSecondTimes(swimmers.map(() => null));
    }
  }, [selectedMonth, fetchTaken, swimmers.length]);

  useEffect(() => {
    setPrimaryTimes(swimmers.map(() => null));
  }, [primaryDay, swimmers.length]);

  const otherDay = primaryDay === "wednesday" ? "thursday" : "wednesday";
  const totalLessons = secondDay ? 8 : 4;
  const totalBookingCents = useMemo(
    () =>
      perSwimmerEstee.reduce((sum, row) => sum + (secondDay ? row.monthlyUnitCents * 2 : row.monthlyUnitCents), 0),
    [perSwimmerEstee, secondDay]
  );
  const addSecondDayPerSwimmerCents = useMemo(
    () => perSwimmerEstee.reduce((sum, row) => sum + row.monthlyUnitCents, 0),
    [perSwimmerEstee]
  );

  function takenPrimaryForSwimmer(i: number, part: "am" | "pm") {
    if (!selectedMonth) return [];
    const dur = perSwimmerEstee[i]!.duration;
    const cand = part === "am" ? perSwimmerEstee[i]!.candAm : perSwimmerEstee[i]!.candPm;
    const pool = [
      ...dbRows,
      ...siblingEsteeComplete(selectedMonth, primaryDay, secondDay, primaryTimes, secondTimes, swimmers, i),
    ];
    return esteeUnavailableStartsForDay(pool, selectedMonth, primaryDay, dur, cand);
  }

  function takenSecondForSwimmer(i: number, part: "am" | "pm") {
    if (!selectedMonth) return [];
    const dur = perSwimmerEstee[i]!.duration;
    const cand = part === "am" ? perSwimmerEstee[i]!.candAm : perSwimmerEstee[i]!.candPm;
    const pool = [
      ...dbRows,
      ...siblingEsteeComplete(selectedMonth, primaryDay, secondDay, primaryTimes, secondTimes, swimmers, i),
    ];
    return esteeUnavailableStartsForDay(pool, selectedMonth, otherDay, dur, cand);
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

  function handleContinue() {
    if (!selectedMonth) return;
    if (primaryTimes.some((x) => !x)) return;
    if (secondDay && secondTimes.some((x) => !x)) return;
    onSelect(
      swimmers.map((_, i) => ({
        type: "monthly" as const,
        month: selectedMonth,
        primaryDay,
        primaryTime: primaryTimes[i]!,
        secondDay,
        secondDayTime: secondDay ? secondTimes[i]! : null,
      }))
    );
  }

  const primaryComplete = Boolean(selectedMonth && primaryTimes.every(Boolean));
  const secondComplete = !secondDay || secondTimes.every(Boolean);
  const canSubmit = primaryComplete && secondComplete;

  return (
    <div className="space-y-10">
      <p className="rounded-xl border border-black/5 bg-[#F5F5F7] px-4 py-3 font-ui text-xs leading-relaxed text-[#1D1D1F]/80">
        {timezoneBookingHint()}
      </p>

      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose a month</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {months.map((m) => {
            const active = selectedMonth === m.value;
            const dates = getEsteeDatesForMonth(m.value);
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.value);
                  setTimeout(() => {
                    document.getElementById("day-selection")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
                className={`px-5 py-5 rounded-[1.5rem] border text-center transition-all duration-300 cursor-pointer ${
                  active
                    ? "border-[#1D1D1F] bg-[#1D1D1F]/5 text-[#1D1D1F] shadow-sm font-semibold"
                    : "border-black/5 bg-white hover:border-black/10 hover:shadow-md text-[#86868B]"
                }`}
              >
                <div className="font-ui text-sm font-medium">{m.label}</div>
                <div className={`font-ui text-[10px] mt-1 ${active ? "text-[#1D1D1F]/60" : "text-[#86868B]/60"}`}>
                  {dates.wednesdays.length} Wed &middot; {dates.thursdays.length} Thu
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMonth && monthDates && (
        <div id="day-selection" className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both space-y-10">
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

          <div className="border-t border-black/5 pt-10">
            <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose your primary day</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["wednesday", "thursday"] as const).map((day) => {
                const active = primaryDay === day;
                const numDates = day === "wednesday" ? monthDates.wednesdays.length : monthDates.thursdays.length;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setPrimaryDay(day);
                      setTimeout(() => {
                        document.getElementById("primary-time-selection")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}
                    className={`px-5 py-5 rounded-[1.5rem] border text-center transition-all duration-300 cursor-pointer ${
                      active
                        ? "border-[#1D1D1F] bg-[#1D1D1F]/5 shadow-sm"
                        : "border-black/5 bg-white hover:border-black/10 hover:shadow-md"
                    }`}
                  >
                    <span className="capitalize font-display text-xl mb-2 block text-[#1D1D1F]">{day}</span>
                    <span className={`text-xs font-ui ${active ? "text-[#1D1D1F]/80 font-medium" : "text-[#86868B]"}`}>
                      8:00 AM – 11:30 AM & 12:30 PM – 4:00 PM
                    </span>
                    <span className={`text-[10px] font-ui block mt-1 ${active ? "text-[#1D1D1F]/60" : "text-[#86868B]/60"}`}>
                      {numDates} lessons this month
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div id="primary-time-selection" className="space-y-12 border-t border-black/5 pt-10">
            <div>
              <h3 className="font-display text-3xl font-medium tracking-tight mb-2">
                Primary day: <span className="capitalize">{primaryDay}</span>
              </h3>
              <p className="text-[#86868B] font-body text-sm mb-6">
                {swimmers.length > 1
                  ? "Pick a start time on this weekday for each swimmer (they can differ)."
                  : `Same time every ${primaryDay} for the month.`}
              </p>
            </div>

            {swimmers.map((sw, i) => (
              <div key={sw.swimmerName + i} className="space-y-6 pb-8 border-b border-black/5 last:border-0">
                <h4 className="font-display text-xl font-medium text-[#1D1D1F]">{sw.swimmerName}</h4>
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
                    onSelect={(t) => setPrimaryAt(i, t)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#F5F5F7] rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-sm">
            <Toggle
              checked={secondDay}
              onChange={(checked) => {
                setSecondDay(checked);
                if (checked) {
                  setTimeout(() => {
                    document.getElementById("second-time-selection")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }
              }}
              label={`Add a second day each week (+${formatPrice(addSecondDayPerSwimmerCents)} total)`}
              description={
                secondDay
                  ? `Each swimmer adds ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s — 8 lessons per swimmer this month.`
                  : `4 lessons per swimmer on your primary day. Toggle to add 4 more on ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s (priced per swimmer’s age band).`
              }
            />
          </div>

          {secondDay && (
            <div id="second-time-selection" className="animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both border-t border-black/5 pt-10 space-y-12">
              <h3 className="font-display text-3xl font-medium tracking-tight">
                Second day: <span className="capitalize">{otherDay}</span>
              </h3>
              {swimmers.map((sw, i) => (
                <div key={sw.swimmerName + "-2-" + i} className="space-y-6 pb-8 border-b border-black/5 last:border-0">
                  <h4 className="font-display text-xl font-medium text-[#1D1D1F]">{sw.swimmerName}</h4>
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
                      onSelect={(t) => setSecondAt(i, t)}
                      showTimezoneHint={false}
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
                      onSelect={(t) => setSecondAt(i, t)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {primaryComplete && (
            <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-4">
              <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] block">Your schedule</span>
              {swimmers.map((sw, i) => (
                <div key={i} className="font-body text-[#1D1D1F]">
                  <p className="font-ui text-xs text-[#86868B]">{sw.swimmerName}</p>
                  <p className="font-display text-lg">
                    Every <span className="capitalize">{primaryDay}</span> at {formatLessonTimeHm(primaryTimes[i]!)}
                    {secondDay && secondTimes[i] && (
                      <span className="block text-base mt-1 text-[#1D1D1F]/85">
                        + <span className="capitalize">{otherDay}</span> at {formatLessonTimeHm(secondTimes[i]!)}
                      </span>
                    )}
                  </p>
                </div>
              ))}
              <p className="font-ui text-sm text-[#86868B]">
                {months.find((m) => m.value === selectedMonth)?.label} &middot; {totalLessons} lessons per swimmer &middot;{" "}
                {new Set(perSwimmerEstee.map((r) => r.duration)).size === 1
                  ? `${perSwimmerEstee[0]!.duration} min`
                  : "mixed lesson lengths (see each swimmer above)"}
              </p>
              <div className="flex items-end justify-between border-t border-black/5 pt-6">
                <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
                <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">
                  {formatPrice(totalBookingCents)}
                </span>
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
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {!selectedMonth && (
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto rounded-full py-6">
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
