import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lukaahWeekOverlapsBlackout } from "@/lib/lukaah-availability";
import { sendRescheduleEmails } from "@/lib/booking-emails";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      id?: string;
      newData?: {
        week_start?: string | null;
        month?: string | null;
        day_of_week?: string[];
        lesson_time?: string;
        second_day_time?: string | null;
      };
      scheduleText?: string;
      specificDays?: string;
      sendEmail?: boolean;
    };

    const { id, newData, scheduleText, specificDays, sendEmail = true } = body;
    if (!id || !newData?.lesson_time || !scheduleText || !specificDays) {
      return NextResponse.json({ error: "Missing reschedule fields." }, { status: 400 });
    }

    const supabase = createClient(url, key);
    const { data: booking, error: fetchErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Only confirmed bookings can be rescheduled." }, { status: 400 });
    }

    if (booking.instructor === "lukaah") {
      if (!newData.week_start) {
        return NextResponse.json({ error: "week_start is required for Lukaah." }, { status: 400 });
      }
      if (lukaahWeekOverlapsBlackout(newData.week_start)) {
        return NextResponse.json({ error: "That week is unavailable (instructor away)." }, { status: 400 });
      }
    } else if (!newData.month) {
      return NextResponse.json({ error: "month is required for Estee." }, { status: 400 });
    }

    if (booking.instructor === "lukaah" && newData.week_start) {
      const { data: conflicts } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "confirmed")
        .eq("instructor", "lukaah")
        .eq("week_start", newData.week_start)
        .eq("lesson_time", newData.lesson_time.length === 5 ? `${newData.lesson_time}:00` : newData.lesson_time);

      const realConflicts = (conflicts ?? []).filter((c) => c.id !== id);
      if (realConflicts.length > 0) {
        return NextResponse.json({ error: "That time slot is already booked for that week." }, { status: 409 });
      }
    }

    const lessonTime = newData.lesson_time.includes(":") && newData.lesson_time.length <= 5
      ? `${newData.lesson_time}:00`
      : newData.lesson_time;

    const secondTime = newData.second_day_time
      ? newData.second_day_time.length <= 5
        ? `${newData.second_day_time}:00`
        : newData.second_day_time
      : null;

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        week_start: booking.instructor === "lukaah" ? newData.week_start : null,
        month: booking.instructor === "estee" ? newData.month : null,
        day_of_week: newData.day_of_week ?? booking.day_of_week,
        lesson_time: lessonTime,
        second_day_time: secondTime,
        reminder_sent: false,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("Admin reschedule update error:", updateErr);
      const msg = updateErr.message ?? "Update failed";
      if (msg.includes("overlap") || updateErr.code === "23505") {
        return NextResponse.json({ error: "That time overlaps another lesson." }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const emailResult = sendEmail
      ? await sendRescheduleEmails({
          booking: {
            id: booking.id,
            swimmer_name: booking.swimmer_name,
            parent_name: booking.parent_name,
            parent_email: booking.parent_email,
            instructor: booking.instructor as "lukaah" | "estee",
          },
          scheduleText,
          specificDays,
        })
      : { customerEmailSent: false, adminEmailSent: false, emailSkipped: true };

    return NextResponse.json({ success: true, ...emailResult });
  } catch (error) {
    console.error("Admin reschedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
