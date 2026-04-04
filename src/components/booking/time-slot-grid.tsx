"use client";

import { format } from "date-fns";

interface Props {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  duration: number;
  selected: string | null;
  takenSlots: string[];
  onSelect: (time: string) => void;
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
}: Props) {
  const slots = generateSlots(startHour, startMinute, endHour, endMinute, duration);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {slots.map((slot) => {
        const taken = takenSlots.includes(slot);
        const active = selected === slot;
        const display = format(new Date(`2000-01-01T${slot}`), "h:mm a");

        return (
          <button
            key={slot}
            onClick={() => !taken && onSelect(slot)}
            disabled={taken}
            className={`px-4 py-3 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
              taken
                ? "border-sand/50 bg-sand/30 text-muted/40 cursor-not-allowed line-through"
                : active
                ? "border-primary bg-primary text-white font-medium shadow-md"
                : "border-sand/50 bg-white hover:border-sand hover:shadow-sm text-dark"
            }`}
          >
            <span className="font-ui text-sm block">{display.replace(" AM", "").replace(" PM", "")}</span>
            <span className={`font-ui text-[10px] uppercase tracking-wider ${active ? "text-white/80" : "text-muted"}`}>{display.slice(-2)}</span>
          </button>
        );
      })}
    </div>
  );
}
