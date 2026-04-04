"use client";

import { format } from "date-fns";
import type { Booking } from "@/lib/database.types";

interface Props {
  bookings: Booking[];
}

export function ScheduleView({ bookings }: Props) {
  const today = new Date();
  const dayName = format(today, "EEEE").toLowerCase();

  const todayLessons = bookings
    .filter((b) => b.day_of_week.includes(dayName) && b.status === "confirmed")
    .sort((a, b) => a.lesson_time.localeCompare(b.lesson_time));

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-dark mb-2">
        Today&rsquo;s Schedule — {format(today, "EEEE, MMMM d")}
      </h2>
      <p className="text-muted font-ui text-sm mb-6">
        {todayLessons.length} lesson{todayLessons.length !== 1 ? "s" : ""} scheduled
      </p>

      {todayLessons.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-sand p-12 text-center">
          <p className="text-muted font-ui">No lessons scheduled for today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayLessons.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border-2 border-sand p-5 flex items-center gap-6">
              <div className="text-center min-w-[70px]">
                <p className="font-display text-2xl font-bold text-primary">
                  {format(new Date(`2000-01-01T${b.lesson_time}`), "h:mm")}
                </p>
                <p className="text-xs text-muted font-ui">
                  {format(new Date(`2000-01-01T${b.lesson_time}`), "a")}
                </p>
              </div>
              <div className="h-12 w-px bg-sand" />
              <div className="flex-1">
                <p className="font-ui font-semibold text-dark">
                  {b.swimmer_name} <span className="text-muted font-normal">(age {b.swimmer_age})</span>
                </p>
                <p className="text-sm text-muted font-ui">
                  {b.lesson_duration} min &middot; {b.parent_name} &middot;{" "}
                  <a href={`tel:${b.parent_phone}`} className="text-primary hover:underline">
                    {b.parent_phone}
                  </a>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                  {b.instructor}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
