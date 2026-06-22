"use client";

import { useState } from "react";
import { StepSchedule } from "@/components/booking/step-schedule";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/database.types";
import type { ScheduleSelection } from "@/lib/booking-schema";

function formatTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function AdminRescheduleModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReschedule(sel: ScheduleSelection) {
    setLoading(true);
    setError(null);

    const newData: Record<string, unknown> = {};
    let scheduleText = "";
    let specificDays = "";

    if (sel.type === "weekly") {
      newData.week_start = sel.weekStart;
      newData.lesson_time = sel.time;
      newData.day_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      scheduleText = `Monday – Friday at ${formatTime(sel.time)}`;
      specificDays = `Week of ${sel.weekStart}`;
    } else {
      newData.month = sel.month;
      newData.lesson_time = sel.primaryTime;
      newData.second_day_time = sel.secondDayTime || null;
      newData.day_of_week = sel.secondDay
        ? [sel.primaryDay, sel.primaryDay === "wednesday" ? "thursday" : "wednesday"]
        : [sel.primaryDay];

      const dayName = sel.primaryDay.charAt(0).toUpperCase() + sel.primaryDay.slice(1);
      scheduleText = `Every ${dayName} at ${formatTime(sel.primaryTime)}`;
      specificDays = `${sel.month} · Every ${dayName}`;
      if (sel.secondDayTime) {
        const otherDay = sel.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
        scheduleText += ` + ${otherDay} at ${formatTime(sel.secondDayTime)}`;
        specificDays += ` & ${otherDay}`;
      }
    }

    try {
      const res = await fetch("/api/admin/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: booking.id, newData, scheduleText, specificDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to reschedule");
      }

      const emailNote =
        data.customerEmailSent === false
          ? " Booking updated, but the confirmation email may not have sent — check logs."
          : " Confirmation email sent to the parent.";
      alert(`Rescheduled successfully.${emailNote}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-reschedule-title"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-reschedule-title" className="font-display text-2xl font-bold text-dark">
              Reschedule {booking.swimmer_name}
            </h2>
            <p className="mt-1 font-ui text-sm text-muted">
              Pick a new week or month and time. The parent and instructor will get an email.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center font-ui text-muted">Saving and sending email…</p>
        ) : (
          <StepSchedule
            instructor={booking.instructor}
            swimmers={[
              {
                swimmerName: booking.swimmer_name,
                swimmerAge: booking.swimmer_age,
                lessonTier: "auto",
              },
            ]}
            onBack={onClose}
            onSelect={(schedules) => {
              const sel = schedules[0];
              if (sel) void handleReschedule(sel);
            }}
          />
        )}
      </div>
    </div>
  );
}
