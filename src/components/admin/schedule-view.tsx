"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Booking } from "@/lib/database.types";
import { buildSlotsByDate, type ExpandedLessonSlot } from "@/lib/admin-schedule-expand";

type ViewMode = "week" | "month";
type InstructorFilter = "all" | "lukaah" | "estee";

interface Props {
  bookings: Booking[];
}

function filterBookings(bookings: Booking[], instructor: InstructorFilter): Booking[] {
  if (instructor === "all") return bookings;
  return bookings.filter((b) => b.instructor === instructor);
}

function slotStatusClass(status: string): string {
  if (status === "confirmed") return "border-l-4 border-l-success bg-success/5";
  if (status === "pending_payment") return "border-l-4 border-l-amber-500 bg-amber-50";
  return "border-l-4 border-l-muted bg-secondary/40";
}

function LessonChip({ slot }: { slot: ExpandedLessonSlot }) {
  const { booking: b } = slot;
  return (
    <div
      className={`rounded-md border border-black/10 px-2 py-1.5 text-left text-xs shadow-sm ${slotStatusClass(b.status)}`}
    >
      <div className="font-semibold text-dark truncate" title={b.swimmer_name}>
        {slot.timeHm} · {b.swimmer_name}
      </div>
      <div className="text-muted truncate capitalize">
        {b.lesson_duration} min · {b.instructor} ·{" "}
        {b.status === "pending_payment" ? "Pending pay" : b.status}
      </div>
    </div>
  );
}

export function ScheduleView({ bookings }: Props) {
  const [view, setView] = useState<ViewMode>("week");
  const [instructor, setInstructor] = useState<InstructorFilter>("all");
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const filtered = useMemo(() => filterBookings(bookings, instructor), [bookings, instructor]);
  const slotsByDate = useMemo(() => buildSlotsByDate(filtered), [filtered]);

  const weekDays = useMemo(() => {
    const end = endOfWeek(weekAnchor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekAnchor, end });
  }, [weekAnchor]);

  const monthGridDays = useMemo(() => {
    const ms = startOfMonth(monthCursor);
    const me = endOfMonth(monthCursor);
    const calStart = startOfWeek(ms, { weekStartsOn: 1 });
    const calEnd = endOfWeek(me, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [monthCursor]);

  const todayYmd = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark">Schedule overview</h2>
        <p className="text-muted font-ui text-sm mt-1">
          Week-by-week (Lukaah: Mon–Fri blocks) and month grid (Estee: Wed/Thu dates). Pending payments appear until
          confirmed or expired.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-black/10 bg-secondary p-1">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`cursor-pointer rounded-md px-4 py-2 font-ui text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"
              }`}
            >
              {v} view
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "lukaah", "estee"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setInstructor(f)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 font-ui text-xs font-medium capitalize transition-colors ${
                instructor === f
                  ? "border-primary bg-primary text-white"
                  : "border-black/10 bg-white text-dark hover:border-black/25"
              }`}
            >
              {f === "all" ? "All teachers" : f}
            </button>
          ))}
        </div>
      </div>

      {view === "week" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                ← Prev week
              </button>
              <button
                type="button"
                onClick={() => setWeekAnchor(() => startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                This week
              </button>
              <button
                type="button"
                onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                Next week →
              </button>
            </div>
            <p className="font-ui text-sm font-semibold text-dark">
              {format(weekAnchor, "MMM d")} – {format(endOfWeek(weekAnchor, { weekStartsOn: 1 }), "MMM d, yyyy")}
            </p>
          </div>

          <div className="hidden md:grid md:grid-cols-7 md:gap-2">
            {weekDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(ymd) ?? [];
              const isToday = ymd === todayYmd;
              return (
                <div
                  key={ymd}
                  className={`min-h-[140px] rounded-xl border-2 p-2 ${
                    isToday ? "border-primary bg-primary/5" : "border-sand bg-white"
                  }`}
                >
                  <div className="mb-2 border-b border-black/5 pb-2 text-center">
                    <div className="font-ui text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {format(day, "EEE")}
                    </div>
                    <div className="font-display text-lg font-bold text-dark">{format(day, "d")}</div>
                  </div>
                  <div className="space-y-2">
                    {slots.length === 0 ? (
                      <p className="text-center font-ui text-[11px] text-muted">—</p>
                    ) : (
                      slots.map((slot, i) => (
                        <LessonChip key={`${slot.booking.id}-${slot.timeHm}-${slot.esteeSlot ?? i}`} slot={slot} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 md:hidden">
            {weekDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(ymd) ?? [];
              if (slots.length === 0) return null;
              const isToday = ymd === todayYmd;
              return (
                <div
                  key={ymd}
                  className={`rounded-xl border-2 p-4 ${isToday ? "border-primary bg-primary/5" : "border-sand bg-white"}`}
                >
                  <div className="mb-3 font-ui text-sm font-semibold text-dark">
                    {format(day, "EEEE, MMM d")}
                  </div>
                  <div className="space-y-2">
                    {slots.map((slot, i) => (
                      <LessonChip key={`${slot.booking.id}-${slot.timeHm}-${slot.esteeSlot ?? i}`} slot={slot} />
                    ))}
                  </div>
                </div>
              );
            })}
            {weekDays.every((day) => (slotsByDate.get(format(day, "yyyy-MM-dd")) ?? []).length === 0) && (
              <div className="rounded-xl border-2 border-sand bg-white p-8 text-center font-ui text-sm text-muted">
                No lessons this week for this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonthCursor((d) => addMonths(d, -1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                ← Prev month
              </button>
              <button
                type="button"
                onClick={() => setMonthCursor(() => startOfMonth(new Date()))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                This month
              </button>
              <button
                type="button"
                onClick={() => setMonthCursor((d) => addMonths(d, 1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                Next month →
              </button>
            </div>
            <p className="font-ui text-sm font-semibold text-dark">{format(monthCursor, "MMMM yyyy")}</p>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border-2 border-sand bg-sand">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((h) => (
              <div key={h} className="bg-secondary px-1 py-2 text-center font-ui text-[10px] font-bold uppercase text-muted">
                {h}
              </div>
            ))}
            {monthGridDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(ymd) ?? [];
              const inMonth = isSameMonth(day, monthCursor);
              const isToday = ymd === todayYmd;
              return (
                <div
                  key={ymd}
                  className={`min-h-[100px] bg-white p-1 sm:min-h-[120px] sm:p-2 ${
                    !inMonth ? "opacity-40" : ""
                  } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                >
                  <div className="mb-1 font-ui text-xs font-semibold text-dark">{format(day, "d")}</div>
                  <div className="space-y-1">
                    {slots.slice(0, 3).map((slot, i) => (
                      <div
                        key={`${slot.booking.id}-${slot.timeHm}-${slot.esteeSlot ?? i}`}
                        className={`truncate rounded border px-1 py-0.5 font-ui text-[10px] leading-tight sm:text-[11px] ${slotStatusClass(slot.booking.status)}`}
                        title={`${slot.timeHm} ${slot.booking.swimmer_name} (${slot.booking.instructor})`}
                      >
                        <span className="font-semibold">{slot.timeHm}</span> {slot.booking.swimmer_name}
                      </div>
                    ))}
                    {slots.length > 3 && (
                      <p className="font-ui text-[10px] text-muted">+{slots.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
