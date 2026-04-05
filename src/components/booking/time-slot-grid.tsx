"use client";

import { formatLessonTimeHm, SITE_TIMEZONE_LABEL } from "@/lib/timezone";

interface Props {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  duration: number;
  selected: string | null;
  takenSlots: string[];
  onSelect: (time: string) => void;
  /** Show Utah timezone once above the grid (set false on nested grids). */
  showTimezoneHint?: boolean;
}

function generateSlots(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  duration: number
): string[] {
  const slots: string[] = [];
  let h = startHour;
  let m = startMinute;

  const endTotal = endHour * 60 + endMinute;

  while (h * 60 + m + duration <= endTotal) {
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push(time);
    m += duration;
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
  selected,
  takenSlots,
  onSelect,
  showTimezoneHint = false,
}: Props) {
  const slots = generateSlots(startHour, startMinute, endHour, endMinute, duration);

  return (
    <div>
      {showTimezoneHint && (
        <p className="mb-4 rounded-xl border border-ocean-deep/10 bg-ocean-surf/40 px-4 py-2.5 font-ui text-xs leading-relaxed text-dark/80">
          <span className="font-semibold text-ocean-deep">Times shown in {SITE_TIMEZONE_LABEL}</span>
          <span className="text-muted"> — American Fork, Utah. If you&rsquo;re traveling, plan around this local time.</span>
        </p>
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
              className={`cursor-pointer rounded-xl border px-4 py-3 text-center transition-all duration-300 ${
                taken
                  ? "cursor-not-allowed border-sand/50 bg-sand/30 text-muted/40 line-through"
                  : active
                    ? "border-primary bg-primary font-medium text-white shadow-md"
                    : "border-sand/50 bg-white text-dark hover:border-sand hover:shadow-sm"
              }`}
            >
              <span className="block font-ui text-sm">{clock}</span>
              <span
                className={`font-ui text-[10px] uppercase tracking-wider ${active ? "text-white/80" : "text-muted"}`}
              >
                {ampm}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
