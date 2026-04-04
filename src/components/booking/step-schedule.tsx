"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  addWeeks,
  addDays,
} from "date-fns";
import type { ScheduleSelection, LukaahSchedule, EsteeSchedule } from "@/lib/booking-schema";
import { getPricingForAge, getEsteePricingForAge, formatPrice, INSTRUCTORS, PRICING, getEsteeDatesForMonth } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { TimeSlotGrid } from "@/components/booking/time-slot-grid";

interface Props {
  instructor: "lukaah" | "estee";
  swimmerAge: number;
  onSelect: (schedule: ScheduleSelection) => void;
  onBack: () => void;
}

function getSummerWeeks(): { start: Date; label: string }[] {
  const year = new Date().getFullYear() < 2026 ? 2026 : new Date().getFullYear();
  let current = new Date(`${year}-06-01T12:00:00Z`); // Roughly June 1st Monday
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

export function StepSchedule({ instructor, swimmerAge, onSelect, onBack }: Props) {
  const pricing = instructor === "estee" 
    ? getEsteePricingForAge(swimmerAge) 
    : getPricingForAge(swimmerAge);
  const duration = pricing.duration;

  if (instructor === "lukaah") {
    return (
      <LukaahScheduleStep
        duration={duration}
        pricing={pricing}
        onSelect={onSelect}
        onBack={onBack}
      />
    );
  }

  return (
    <EsteeScheduleStep
      duration={duration}
      pricing={pricing}
      onSelect={onSelect}
      onBack={onBack}
    />
  );
}

type PricingTier = { age?: string; duration: number; price: number; label: string };

function LukaahScheduleStep({
  duration,
  pricing,
  onSelect,
  onBack,
}: {
  duration: number;
  pricing: PricingTier;
  onSelect: (s: ScheduleSelection) => void;
  onBack: () => void;
}) {
  const weeks = getSummerWeeks();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  const inst = INSTRUCTORS.lukaah;

  const fetchTaken = useCallback(async (weekStart: string) => {
    try {
      const res = await fetch(
        `/api/bookings?instructor=lukaah&week_start=${weekStart}&status=confirmed`
      );
      if (res.ok) {
        const data = await res.json();
        setTakenSlots(data.map((b: { lesson_time: string }) => b.lesson_time.slice(0, 5)));
      }
    } catch {
      setTakenSlots([]);
    }
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetchTaken(selectedWeek);
      setSelectedTime(null);
    }
  }, [selectedWeek, fetchTaken]);

  function handleContinue() {
    if (!selectedWeek || !selectedTime) return;
    const schedule: LukaahSchedule = {
      type: "weekly",
      weekStart: selectedWeek,
      time: selectedTime,
    };
    onSelect(schedule);
  }

  const selectedWeekObj = weeks.find((w) => format(w.start, "yyyy-MM-dd") === selectedWeek);

  return (
    <div className="space-y-10">
      {/* Week picker */}
      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose your week</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weeks.map((w) => {
            const val = format(w.start, "yyyy-MM-dd");
            const active = selectedWeek === val;
            return (
              <button
                key={val}
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
                <div className={`font-ui text-xs uppercase tracking-[0.2em] mb-2 ${active ? "text-[#1D1D1F] font-semibold" : "text-[#86868B] font-medium"}`}>Week of</div>
                <div className={`font-display text-xl ${active ? "text-[#1D1D1F]" : "text-[#1D1D1F]"}`}>{w.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot grid */}
      {selectedWeek && (
        <div id="time-selection" className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both border-t border-black/5 pt-10">
          <h3 className="font-display text-3xl font-medium tracking-tight mb-3">Choose your time</h3>
          <p className="text-[#86868B] font-body text-sm mb-8">
            This time repeats Monday – Friday for the entire week.
          </p>
          <TimeSlotGrid
            startHour={inst.startHour}
            startMinute={inst.startMinute}
            endHour={inst.endHour}
            endMinute={inst.endMinute}
            duration={duration}
            selected={selectedTime}
            takenSlots={takenSlots}
            onSelect={setSelectedTime}
          />
        </div>
      )}

      {/* Summary */}
      {selectedWeek && selectedTime && selectedWeekObj && (
        <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm">
          <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-4 block">
            Your Schedule
          </span>
          <p className="font-display text-3xl font-medium text-[#1D1D1F] mb-3">
            Mon – Fri at{" "}
            {format(new Date(`2000-01-01T${selectedTime}`), "h:mm a")}
          </p>
          <p className="font-ui text-sm text-[#86868B] mb-8">
            Week of {selectedWeekObj.label} &middot; 5 lessons &middot; {duration} min each
          </p>
          <div className="flex items-end justify-between border-t border-black/5 pt-6">
            <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
            <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">{pricing.label}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedWeek || !selectedTime}
          className="flex-1 order-1 sm:order-2 rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function EsteeScheduleStep({
  duration,
  pricing,
  onSelect,
  onBack,
}: {
  duration: number;
  pricing: PricingTier;
  onSelect: (s: ScheduleSelection) => void;
  onBack: () => void;
}) {
  const months = getSummerMonths();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [primaryDay, setPrimaryDay] = useState<"wednesday" | "thursday">("wednesday");
  const [primaryTime, setPrimaryTime] = useState<string | null>(null);
  const [secondDay, setSecondDay] = useState(false);
  const [secondDayTime, setSecondDayTime] = useState<string | null>(null);
  const [takenWed, setTakenWed] = useState<string[]>([]);
  const [takenThu, setTakenThu] = useState<string[]>([]);

  const schedule = INSTRUCTORS.estee.schedule;

  // Get specific dates for the selected month
  const monthDates = selectedMonth ? getEsteeDatesForMonth(selectedMonth) : null;

  const fetchTaken = useCallback(async (month: string) => {
    try {
      const res = await fetch(
        `/api/bookings?instructor=estee&month=${month}&status=confirmed`
      );
      if (res.ok) {
        const data = await res.json();
        const wed: string[] = [];
        const thu: string[] = [];
        for (const b of data) {
          if (b.day_of_week.includes("wednesday")) wed.push(b.lesson_time.slice(0, 5));
          if (b.day_of_week.includes("thursday")) {
            thu.push(b.second_day_time?.slice(0, 5) || b.lesson_time.slice(0, 5));
          }
        }
        setTakenWed(wed);
        setTakenThu(thu);
      }
    } catch {
      setTakenWed([]);
      setTakenThu([]);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchTaken(selectedMonth);
      setPrimaryTime(null);
      setSecondDayTime(null);
    }
  }, [selectedMonth, fetchTaken]);

  useEffect(() => {
    setPrimaryTime(null);
  }, [primaryDay]);

  const otherDay = primaryDay === "wednesday" ? "thursday" : "wednesday";
  
  // Use Estee's monthly pricing ($120/month for 4 lessons with one day, $60/month for infants)
  const monthlyPrice = pricing.price;
  const totalLessons = secondDay ? 8 : 4;
  const totalPrice = secondDay ? monthlyPrice * 2 : monthlyPrice;

  function handleContinue() {
    if (!selectedMonth || !primaryTime) return;
    if (secondDay && !secondDayTime) return;
    const s: EsteeSchedule = {
      type: "monthly",
      month: selectedMonth,
      primaryDay,
      primaryTime,
      secondDay,
      secondDayTime: secondDay ? secondDayTime : null,
    };
    onSelect(s);
  }

  // Both days now have AM and PM blocks
  const amBlock = schedule.wednesday.am; // Same for both days
  const pmBlock = schedule.wednesday.pm; // Same for both days

  return (
    <div className="space-y-10">
      {/* Month picker */}
      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose a month</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {months.map((m) => {
            const active = selectedMonth === m.value;
            const dates = getEsteeDatesForMonth(m.value);
            return (
              <button
                key={m.value}
                onClick={() => {
                  setSelectedMonth(m.value)
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
          {/* Show specific dates for this month */}
          <div className="bg-ocean-surf/30 border border-ocean-light/30 rounded-[1.5rem] p-6">
            <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-3">Lesson Dates</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-ui text-xs text-[#86868B] mb-2">Wednesdays</p>
                <div className="flex flex-wrap gap-2">
                  {monthDates.wednesdays.map((d) => (
                    <span key={d} className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5">
                      {format(new Date(d + "T12:00:00"), "MMM d")}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-ui text-xs text-[#86868B] mb-2">Thursdays</p>
                <div className="flex flex-wrap gap-2">
                  {monthDates.thursdays.map((d) => (
                    <span key={d} className="inline-block px-3 py-1.5 rounded-full bg-white text-xs font-ui font-medium text-[#1D1D1F] border border-black/5">
                      {format(new Date(d + "T12:00:00"), "MMM d")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Day selection */}
          <div className="border-t border-black/5 pt-10">
            <h3 className="font-display text-3xl font-medium tracking-tight mb-6">Choose your primary day</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["wednesday", "thursday"] as const).map((day) => {
                const active = primaryDay === day;
                const numDates = day === "wednesday" ? monthDates.wednesdays.length : monthDates.thursdays.length;
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setPrimaryDay(day)
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
                    <span className={`capitalize font-display text-xl mb-2 block ${active ? "text-[#1D1D1F]" : "text-[#1D1D1F]"}`}>{day}</span>
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

          {/* Primary time slot - Morning block */}
          <div id="primary-time-selection">
            <h3 className="font-display text-3xl font-medium tracking-tight mb-3">
              Choose your <span className="capitalize">{primaryDay}</span> time
            </h3>
            <p className="text-[#86868B] font-body text-sm mb-8">
              Same time every <span className="capitalize">{primaryDay}</span> for the month.
            </p>
            
            {/* Morning Block */}
            <div className="mb-6">
              <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">☀️ Morning Block (8:00 AM – 11:30 AM)</p>
              <TimeSlotGrid
                startHour={amBlock.startHour}
                startMinute={amBlock.startMinute}
                endHour={amBlock.endHour}
                endMinute={amBlock.endMinute}
                duration={duration}
                selected={primaryTime}
                takenSlots={primaryDay === "wednesday" ? takenWed : takenThu}
                onSelect={setPrimaryTime}
              />
            </div>

            {/* Afternoon Block */}
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">🌤️ Afternoon Block (12:30 PM – 4:00 PM)</p>
              <TimeSlotGrid
                startHour={pmBlock.startHour}
                startMinute={pmBlock.startMinute}
                endHour={pmBlock.endHour}
                endMinute={pmBlock.endMinute}
                duration={duration}
                selected={primaryTime}
                takenSlots={primaryDay === "wednesday" ? takenWed : takenThu}
                onSelect={setPrimaryTime}
              />
            </div>
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
              label={`Add a second day each week (+${formatPrice(monthlyPrice)})`}
              description={
                secondDay 
                ? `Awesome! You've added ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s. You are now booking 8 total lessons this month for ${formatPrice(totalPrice)}.`
                : `Currently booking 4 lessons for ${formatPrice(monthlyPrice)}. Toggle to add 4 more lessons on ${otherDay.charAt(0).toUpperCase() + otherDay.slice(1)}s.`
              }
            />
          </div>

          {/* Second day time slot */}
          {secondDay && (
            <div id="second-time-selection" className="animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both border-t border-black/5 pt-10">
              <h3 className="font-display text-3xl font-medium tracking-tight mb-8">
                Choose your <span className="capitalize">{otherDay}</span> time
              </h3>
              
              {/* Morning Block */}
              <div className="mb-6">
                <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">☀️ Morning Block (8:00 AM – 11:30 AM)</p>
                <TimeSlotGrid
                  startHour={amBlock.startHour}
                  startMinute={amBlock.startMinute}
                  endHour={amBlock.endHour}
                  endMinute={amBlock.endMinute}
                  duration={duration}
                  selected={secondDayTime}
                  takenSlots={otherDay === "wednesday" ? takenWed : takenThu}
                  onSelect={setSecondDayTime}
                />
              </div>

              {/* Afternoon Block */}
              <div>
                <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-ocean-deep mb-4">🌤️ Afternoon Block (12:30 PM – 4:00 PM)</p>
                <TimeSlotGrid
                  startHour={pmBlock.startHour}
                  startMinute={pmBlock.startMinute}
                  endHour={pmBlock.endHour}
                  endMinute={pmBlock.endMinute}
                  duration={duration}
                  selected={secondDayTime}
                  takenSlots={otherDay === "wednesday" ? takenWed : takenThu}
                  onSelect={setSecondDayTime}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {primaryTime && (
            <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both bg-[#F5F5F7] border border-black/5 rounded-[2rem] p-8 shadow-sm">
              <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-4 block">
                Your Schedule
              </span>
              <p className="font-display text-3xl font-medium text-[#1D1D1F] mb-3">
                Every <span className="capitalize">{primaryDay}</span> at{" "}
                {format(new Date(`2000-01-01T${primaryTime}`), "h:mm a")}
                {secondDay && secondDayTime && (
                  <>
                    <br />
                    <span className="text-2xl text-[#1D1D1F]/80 mt-2 block">
                      + <span className="capitalize">{otherDay}</span> at{" "}
                      {format(new Date(`2000-01-01T${secondDayTime}`), "h:mm a")}
                    </span>
                  </>
                )}
              </p>
              <p className="font-ui text-sm text-[#86868B] mb-8">
                {months.find((m) => m.value === selectedMonth)?.label} &middot;{" "}
                {totalLessons} lessons &middot; {duration} min each
              </p>
              <div className="flex items-end justify-between border-t border-black/5 pt-6">
                <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-widest">Total</span>
                <span className="font-display text-4xl text-[#1D1D1F] tracking-tighter">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!primaryTime || (secondDay && !secondDayTime)}
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
