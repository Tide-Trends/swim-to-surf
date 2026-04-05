"use client";

import { formatLessonTimeHm, SITE_TIMEZONE_LABEL } from "@/lib/timezone";

interface Props {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  /** Actual lesson length (15 or 30). Start times advance every `gridStepMinutes`. */
  duration: number;
  /** Grid step for offered start times (default 15 so 30-min lessons align with 15-min infants). */
  gridStepMinutes?: number;
  selected: string | null;
  /** HH:mm starts that overlap existing bookings (already computed for this duration). */
  takenSlots: string[];
  onSelect: (time: string) => void;
  showTimezoneHint?: boolean;
}

/** All valid HH:mm start times in range for a lesson of `duration`, stepping by `gridStepMinutes`. */
export function generateSlotStartTimes(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  lessonDuration: number,
  gridStepMinutes: number = 15
): string[] {
  const slots: string[] = [];
  let h = startHour;
  let m = startMinute;
  const endTotal = endHour * 60 + endMinute;

  while (true) {
    const cur = h * 60 + m;
    if (cur + lessonDuration > endTotal) break;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += gridStepMinutes;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }

  return slots;
}

export function TimeSlotGrid({
  startHour,
  startMinute,
  endHour,
  endMinute,
  duration,
  gridStepMinutes = 15,
  selected,
  takenSlots,
  onSelect,
  showTimezoneHint = false,
}: Props) {
  const slots = generateSlotStartTimes(
    startHour,
    startMinute,
    endHour,
    endMinute,
    duration,
    gridStepMinutes
  );

  return (
    <div>
      {showTimezoneHint && (
        <div className="mb-4 space-y-2">
          <p className="rounded-xl border border-ocean-deep/10 bg-ocean-surf/40 px-4 py-2.5 font-ui text-xs leading-relaxed text-dark/80">
            <span className="font-semibold text-ocean-deep">Times shown in {SITE_TIMEZONE_LABEL}</span>
            <span className="text-muted"> — American Fork, Utah.</span>
          </p>
          {gridStepMinutes < duration && (
            <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-2.5 font-ui text-xs font-medium leading-relaxed text-amber-950">
              Start times are listed every {gridStepMinutes} minutes.{" "}
              <strong>Your lesson is {duration} minutes</strong> from that start time through finish — not a{" "}
              {gridStepMinutes}-minute slot.
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot) => {
          const taken = takenSlots.includes(slot);
          const active = selected === slot;
          const display = formatLessonTimeHm(slot);
          const ampm = display.slice(-2).toUpperCase();
          const clock = display.replace(/ am$/i, "").replace(/ pm$/i, "").trim();

          return (
            <button
              key={slot}
              type="button"
              onClick={() => !taken && onSelect(slot)}
              disabled={taken}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center transition-all duration-200 sm:px-4 ${
                taken
                  ? "cursor-not-allowed border-sand/50 bg-sand/30 text-muted/40 line-through"
                  : active
                    ? "border-primary bg-primary font-medium text-white shadow-md"
                    : "border-sand/50 bg-white text-dark hover:border-sand hover:shadow-sm"
              }`}
            >
              <span className="block font-ui text-sm font-semibold">{clock}</span>
              <span
                className={`font-ui text-[10px] uppercase tracking-wider ${active ? "text-white/80" : "text-muted"}`}
              >
                {ampm}
              </span>
              {duration > gridStepMinutes && (
                <span
                  className={`mt-1 block font-ui text-[9px] font-bold uppercase tracking-wide ${
                    active ? "text-white/90" : "text-ocean-deep"
                  }`}
                >
                  {duration} min
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
