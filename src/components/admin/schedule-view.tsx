"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Booking } from "@/lib/database.types";
import {
  buildSlotsByDate,
  dayLessonStats,
  findDayConflictIndices,
  type ExpandedLessonSlot,
} from "@/lib/admin-schedule-expand";
import { ContactInfoToggle } from "@/components/admin/contact-info-toggle";
import { Button } from "@/components/ui/button";

type ViewMode = "day" | "week" | "month";
type InstructorFilter = "all" | "lukaah" | "estee";

interface Props {
  bookings: Booking[];
  onReschedule?: (booking: Booking) => void;
}

function filterBookings(bookings: Booking[], instructor: InstructorFilter): Booking[] {
  if (instructor === "all") return bookings;
  return bookings.filter((b) => b.instructor === instructor);
}

function slotKey(slot: ExpandedLessonSlot, index?: number): string {
  return `${slot.booking.id}-${slot.timeHm}-${slot.esteeSlot ?? index ?? 0}`;
}

function slotStatusClass(status: string, hasConflict: boolean): string {
  if (hasConflict) return "border-l-4 border-l-red-500 bg-red-50 ring-1 ring-red-200";
  if (status === "confirmed") return "border-l-4 border-l-success bg-success/5";
  if (status === "pending_payment") return "border-l-4 border-l-amber-500 bg-amber-50";
  return "border-l-4 border-l-muted bg-secondary/40";
}

function endTimeLabel(slot: ExpandedLessonSlot): string {
  const end = parse(
    `${String(Math.floor(slot.endMinutes / 60)).padStart(2, "0")}:${String(slot.endMinutes % 60).padStart(2, "0")}`,
    "HH:mm",
    new Date()
  );
  return format(end, "h:mm a");
}

function LessonCard({
  slot,
  hasConflict,
  compact = false,
  onReschedule,
}: {
  slot: ExpandedLessonSlot;
  hasConflict: boolean;
  compact?: boolean;
  onReschedule?: (booking: Booking) => void;
}) {
  const b = slot.booking;

  return (
    <div
      className={`rounded-lg border border-black/10 shadow-sm ${slotStatusClass(b.status, hasConflict)} ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-dark truncate ${compact ? "text-xs" : "text-sm"}`}>
            {slot.timeHm}–{endTimeLabel(slot).replace(/^0/, "")} · {b.swimmer_name}
          </div>
          <div className={`text-muted truncate ${compact ? "text-[10px] mt-0.5" : "mt-0.5 text-xs"}`}>
            {b.parent_name} · {b.lesson_duration} min · {b.instructor}
          </div>
          <ContactInfoToggle booking={b} compact={compact} />
          {b.status === "confirmed" && onReschedule && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`mt-1 h-auto px-0 py-0 font-ui text-primary hover:bg-transparent hover:underline ${
                compact ? "text-[10px]" : "text-[11px]"
              }`}
              onClick={() => onReschedule(b)}
            >
              Reschedule
            </Button>
          )}
        </div>
        {hasConflict && (
          <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
            Overlap
          </span>
        )}
      </div>
    </div>
  );
}

export function ScheduleView({ bookings, onReschedule }: Props) {
  const [view, setView] = useState<ViewMode>("day");
  const [instructor, setInstructor] = useState<InstructorFilter>("lukaah");
  const [dayCursor, setDayCursor] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const filtered = useMemo(() => filterBookings(bookings, instructor), [bookings, instructor]);
  const slotsByDate = useMemo(() => buildSlotsByDate(filtered), [filtered]);

  const todayYmd = format(new Date(), "yyyy-MM-dd");
  const dayYmd = format(dayCursor, "yyyy-MM-dd");
  const daySlots = slotsByDate.get(dayYmd) ?? [];
  const dayConflicts = useMemo(() => findDayConflictIndices(daySlots), [daySlots]);
  const dayStats = dayLessonStats(daySlots);

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

  const weekTotal = useMemo(() => {
    let count = 0;
    for (const day of weekDays) {
      count += (slotsByDate.get(format(day, "yyyy-MM-dd")) ?? []).length;
    }
    return count;
  }, [weekDays, slotsByDate]);

  const todaySlots = slotsByDate.get(todayYmd) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark">Schedule</h2>
        <p className="text-muted font-ui text-sm mt-1">
          Lesson timeline. Click for contact info or reschedule — parent gets an email on reschedule.
        </p>
      </div>

      {todaySlots.length > 0 && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-ui text-sm font-bold text-dark">
              Today · {format(new Date(), "EEEE, MMM d")} · {todaySlots.length} lesson
              {todaySlots.length === 1 ? "" : "s"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setView("day");
                setDayCursor(new Date());
              }}
              className="cursor-pointer rounded-md bg-primary px-3 py-1 font-ui text-xs font-semibold text-white hover:opacity-90"
            >
              Open day view
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {todaySlots.map((slot, i) => (
              <LessonCard
                key={slotKey(slot, i)}
                slot={slot}
                hasConflict={findDayConflictIndices(todaySlots).has(i)}
                compact
                onReschedule={onReschedule}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-black/10 bg-secondary p-1">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`cursor-pointer rounded-md px-4 py-2 font-ui text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"
              }`}
            >
              {v}
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

      {view === "day" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDayCursor((d) => addDays(d, -1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setDayCursor(new Date())}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDayCursor((d) => addDays(d, 1))}
                className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 font-ui text-sm font-medium hover:bg-secondary"
              >
                Next →
              </button>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-dark">{format(dayCursor, "EEEE, MMMM d, yyyy")}</p>
              <p className="font-ui text-xs text-muted">
                {dayStats.count} lesson{dayStats.count === 1 ? "" : "s"} · ~
                {Math.round(dayStats.totalMinutes / 60 * 10) / 10}h teaching
                {dayConflicts.size > 0 && (
                  <span className="ml-2 font-semibold text-red-600">· {dayConflicts.size} overlap conflicts</span>
                )}
              </p>
            </div>
          </div>

          {daySlots.length === 0 ? (
            <div className="rounded-xl border-2 border-sand bg-white p-12 text-center font-ui text-sm text-muted">
              No lessons scheduled for this day.
            </div>
          ) : (
            <div className="relative space-y-0">
              {daySlots.map((slot, i) => {
                const key = slotKey(slot, i);
                return (
                  <div key={key} className="flex gap-4 pb-4">
                    <div className="w-16 shrink-0 pt-2 text-right font-ui text-sm font-bold tabular-nums text-dark">
                      {slot.timeHm}
                    </div>
                    <div className="relative flex-1 pb-2">
                      <div className="absolute -left-2 top-3 h-2 w-2 rounded-full bg-primary" />
                      <div className="absolute -left-[5px] top-5 bottom-0 w-px bg-sand" />
                      <LessonCard slot={slot} hasConflict={dayConflicts.has(i)} onReschedule={onReschedule} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                onClick={() => setWeekAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
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
            <div className="text-right">
              <p className="font-ui text-sm font-semibold text-dark">
                {format(weekAnchor, "MMM d")} – {format(endOfWeek(weekAnchor, { weekStartsOn: 1 }), "MMM d, yyyy")}
              </p>
              <p className="font-ui text-xs text-muted">{weekTotal} lessons this week</p>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-7 lg:gap-2">
            {weekDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(ymd) ?? [];
              const conflicts = findDayConflictIndices(slots);
              const isToday = ymd === todayYmd;
              const stats = dayLessonStats(slots);
              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => {
                    setDayCursor(day);
                    setView("day");
                  }}
                  className={`min-h-[180px] cursor-pointer rounded-xl border-2 p-2 text-left transition-shadow hover:shadow-md ${
                    isToday ? "border-primary bg-primary/5" : "border-sand bg-white"
                  }`}
                >
                  <div className="mb-2 border-b border-black/5 pb-2 text-center">
                    <div className="font-ui text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {format(day, "EEE")}
                    </div>
                    <div className="font-display text-lg font-bold text-dark">{format(day, "d")}</div>
                    {stats.count > 0 && (
                      <div className="font-ui text-[10px] text-muted">{stats.count} lessons</div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {slots.length === 0 ? (
                      <p className="text-center font-ui text-[11px] text-muted">—</p>
                    ) : (
                      slots.slice(0, 4).map((slot, i) => (
                        <div
                          key={slotKey(slot, i)}
                          className={`truncate rounded border px-1.5 py-0.5 font-ui text-[10px] ${slotStatusClass(
                            slot.booking.status,
                            conflicts.has(i)
                          )}`}
                          title={`${slot.timeHm} ${slot.booking.swimmer_name} (${slot.booking.parent_name})`}
                        >
                          <span className="font-semibold">{slot.timeHm}</span> {slot.booking.swimmer_name}
                        </div>
                      ))
                    )}
                    {slots.length > 4 && (
                      <p className="font-ui text-[10px] font-medium text-primary">+{slots.length - 4} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 lg:hidden">
            {weekDays.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(ymd) ?? [];
              if (slots.length === 0) return null;
              const conflicts = findDayConflictIndices(slots);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={ymd}
                  className={`rounded-xl border-2 p-4 ${isToday ? "border-primary bg-primary/5" : "border-sand bg-white"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDayCursor(day);
                      setView("day");
                    }}
                    className="mb-3 w-full cursor-pointer text-left font-ui text-sm font-semibold text-dark hover:text-primary"
                  >
                    {format(day, "EEEE, MMM d")} · {slots.length} lessons →
                  </button>
                  <div className="space-y-2">
                    {slots.map((slot, i) => (
                      <LessonCard
                        key={slotKey(slot, i)}
                        slot={slot}
                        hasConflict={conflicts.has(i)}
                        compact
                        onReschedule={onReschedule}
                      />
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
                onClick={() => setMonthCursor(startOfMonth(new Date()))}
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
                <button
                  key={ymd}
                  type="button"
                  onClick={() => {
                    if (slots.length > 0) {
                      setDayCursor(day);
                      setView("day");
                    }
                  }}
                  className={`min-h-[100px] bg-white p-1 text-left sm:min-h-[120px] sm:p-2 ${
                    !inMonth ? "opacity-40" : ""
                  } ${isToday ? "ring-2 ring-primary ring-inset" : ""} ${
                    slots.length > 0 ? "cursor-pointer hover:bg-primary/5" : "cursor-default"
                  }`}
                >
                  <div className="mb-1 font-ui text-xs font-semibold text-dark">{format(day, "d")}</div>
                  {slots.length > 0 && (
                    <div className="mb-1 font-ui text-[9px] font-medium text-muted">{slots.length} lessons</div>
                  )}
                  <div className="space-y-1">
                    {slots.slice(0, 3).map((slot, i) => (
                      <div
                        key={slotKey(slot, i)}
                        className={`truncate rounded border px-1 py-0.5 font-ui text-[10px] leading-tight sm:text-[11px] ${slotStatusClass(
                          slot.booking.status,
                          false
                        )}`}
                        title={`${slot.timeHm} ${slot.booking.swimmer_name}`}
                      >
                        <span className="font-semibold">{slot.timeHm}</span> {slot.booking.swimmer_name}
                      </div>
                    ))}
                    {slots.length > 3 && (
                      <p className="font-ui text-[10px] text-muted">+{slots.length - 3} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
