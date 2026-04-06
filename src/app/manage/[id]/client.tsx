"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepSchedule } from "@/components/booking/step-schedule";
import { Button } from "@/components/ui/button";
import type { ScheduleSelection } from "@/lib/booking-schema";

export function ManageBookingClient({
  booking,
  canSelfServe,
}: {
  booking: Record<string, unknown> & {
    id: string;
    instructor: "lukaah" | "estee";
    swimmer_name: string;
    swimmer_age: number;
    week_start?: string | null;
    month?: string | null;
    day_of_week: string[];
    lesson_time: string;
    second_day_time?: string | null;
    status: string;
  };
  canSelfServe: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "reschedule">("view");

  const instructorName = booking.instructor === "lukaah" ? "Lukaah" : "Estee";
  const isLukaah = booking.instructor === "lukaah";

  function formatTime(time24: string) {
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  let currentSchedule = "";
  if (isLukaah) {
    currentSchedule = `Week of ${booking.week_start} — Mon-Fri @ ${formatTime(booking.lesson_time)}`;
  } else {
    const daysCap = booking.day_of_week.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(" & ");
    let t = formatTime(booking.lesson_time);
    if (booking.second_day_time) t += ` & ${formatTime(booking.second_day_time)}`;
    currentSchedule = `${booking.month} — Every ${daysCap} @ ${t}`;
  }

  async function handleCancel() {
    if (!canSelfServe) {
      alert(
        "Self-serve cancellation isn’t available within 7 days of your first lesson. Please contact us by email or phone."
      );
      return;
    }
    if (!confirm("Are you sure you want to cancel your entire booking? This action cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/manage/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      alert("Booking cancelled successfully.");
      router.refresh(); // Refresh server component
    } catch (err) {
      alert("Error cancelling booking.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule(sel: ScheduleSelection) {
    if (!canSelfServe) {
      alert(
        "Self-serve rescheduling isn’t available within 7 days of your first lesson. Please contact us by email or phone."
      );
      return;
    }
    setLoading(true);
    const newData: any = {};
    let scheduleText = "";
    let specificDays = "";

    if (sel.type === "weekly") {
      newData.week_start = sel.weekStart;
      newData.lesson_time = sel.time;
      newData.day_of_week = ['monday','tuesday','wednesday','thursday','friday'];
      scheduleText = `Monday – Friday at ${formatTime(sel.time)}`;
      specificDays = `Week of ${sel.weekStart}`;
    } else {
      newData.month = sel.month;
      newData.lesson_time = sel.primaryTime;
      newData.second_day_time = sel.secondDayTime || null;
      newData.day_of_week = sel.secondDay ? [sel.primaryDay, sel.primaryDay === "wednesday" ? "thursday" : "wednesday"] : [sel.primaryDay];
      
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
      const res = await fetch(`/api/manage/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", newData, scheduleText, specificDays }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to reschedule");
      }
      alert("Booking rescheduled successfully!");
      setMode("view");
      router.refresh();
    } catch (err: any) {
      alert("Error rescheduling: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (booking.status === "cancelled") {
    return (
      <div className="text-center bg-white p-12 rounded-[2rem] border border-black/5 shadow-sm">
        <h2 className="text-2xl font-display font-medium text-[#1D1D1F] mb-2">Booking Cancelled</h2>
        <p className="text-[#86868B] font-ui">This booking has been cancelled and cannot be modified.</p>
        <Button onClick={() => router.push("/")} className="mt-8 rounded-full">Return Home</Button>
      </div>
    );
  }

  // If they are in reschedule mode, show the StepSchedule
  if (mode === "reschedule") {
    return (
      <div>
        <h2 className="text-3xl font-display font-medium mb-8 tracking-tight">Pick a New Schedule</h2>
        <StepSchedule
          instructor={booking.instructor}
          swimmers={[
            {
              swimmerName: String(booking.swimmer_name ?? "Swimmer"),
              swimmerAge: Number(booking.swimmer_age),
              lessonTier: "auto",
            },
          ]}
          onBack={() => setMode("view")}
          onSelect={(schedules) => {
            const sel = schedules[0];
            if (sel) void handleReschedule(sel);
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
      <div className="p-8 sm:p-12 border-b border-black/5 bg-[#F5F5F7]">
        <h1 className="text-3xl font-display font-medium tracking-tight text-[#1D1D1F] mb-2">
          Manage Your Booking
        </h1>
        <p className="text-[#86868B]">ID: {booking.id.slice(0, 8).toUpperCase()}</p>
      </div>
      
      <div className="p-8 sm:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#86868B] mb-1">Swimmer</p>
            <p className="text-lg font-medium text-[#1D1D1F]">{booking.swimmer_name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#86868B] mb-1">Instructor</p>
            <p className="text-lg font-medium text-[#1D1D1F]">{instructorName}</p>
          </div>
          <div className="sm:col-span-2 bg-[#E8F4FD] border border-[#B8DFF0] p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest font-semibold text-[#0077B6] mb-1">Current Schedule</p>
            <p className="text-lg font-medium text-[#1D3557]">{currentSchedule}</p>
          </div>
        </div>

        {!canSelfServe && (
          <p className="text-sm text-[#1D3557] bg-[#E8F4FD] border border-[#B8DFF0] rounded-xl px-4 py-3 mb-6 font-ui leading-relaxed">
            Your first lesson is within 7 days (or has already started). Self-serve cancel and reschedule are turned off —
            please email or call us and we’ll help.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 border-t border-black/5 pt-8">
          <Button
            onClick={() => setMode("reschedule")}
            disabled={loading || !canSelfServe}
            className="flex-1 rounded-full py-6 bg-[#0077B6] text-white hover:bg-[#005f92] disabled:opacity-50 disabled:pointer-events-none"
          >
            Reschedule Lesson
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading || !canSelfServe}
            variant="outline"
            className="flex-1 rounded-full py-6 text-[#EF476F] hover:text-[#EF476F] hover:bg-[#EF476F]/5 border-[#EF476F]/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel Entire Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
