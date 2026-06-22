import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Booking } from "@/lib/database.types";
import {
  filterBookingsForWeek,
  generateInstructorWeekIcs,
  getUpcomingScheduleWeek,
  icsAttachmentFilename,
} from "@/lib/instructor-week-calendar";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

function formatTime(time24: string): string {
  const hm = time24.trim().slice(0, 5);
  const [h, m] = hm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function bookingSummary(b: Booking): string {
  if (b.week_start) {
    return `Week of ${b.week_start.slice(0, 10)} · Mon–Fri`;
  }
  const days = b.day_of_week.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(" & ");
  return `${b.month} · ${days}`;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
      return new Response("Unauthorized", { status: 401 });
    }

    const week = getUpcomingScheduleWeek();
    const { data: bookings, error } = await getConfirmedBookings();
    if (error) throw error;

    const resend = new Resend(process.env.RESEND_API_KEY!);
    let sent = 0;

    const lukaahAll = bookings.filter((b) => b.instructor === "lukaah");
    const lukaahWeek = filterBookingsForWeek(lukaahAll, week.startYmd, week.endYmd);
    if (lukaahWeek.length > 0) {
      await sendInstructorSchedule(resend, LUKAAH_EMAIL, "Lukaah", lukaahWeek, week);
      sent++;
    }

    const esteeAll = bookings.filter((b) => b.instructor === "estee");
    const esteeWeek = filterBookingsForWeek(esteeAll, week.startYmd, week.endYmd);
    if (esteeWeek.length > 0) {
      await sendInstructorSchedule(resend, ESTEE_EMAIL, "Estee", esteeWeek, week);
      sent++;
    }

    return NextResponse.json({
      success: true,
      week: week.label,
      lukaah: lukaahWeek.length,
      estee: esteeWeek.length,
      emailsSent: sent,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getConfirmedBookings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return supabase.from("bookings").select("*").eq("status", "confirmed");
}

async function sendInstructorSchedule(
  resend: Resend,
  to: string,
  name: string,
  bookings: Booking[],
  week: ReturnType<typeof getUpcomingScheduleWeek>
) {
  const ics = generateInstructorWeekIcs(bookings, name, week.startYmd, week.endYmd);
  const filename = icsAttachmentFilename(week.startYmd);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0c2d43; max-width: 600px;">
      <h1 style="color: #0a4a5c; font-size: 22px; margin: 0 0 8px;">Weekly schedule — ${week.label}</h1>
      <p style="color: #243847; line-height: 1.6; margin: 0 0 20px;">
        Hi ${name}, here are your confirmed lessons for this week (${bookings.length} swimmer${bookings.length === 1 ? "" : "s"}).
      </p>

      <div style="margin: 0 0 24px; padding: 16px 18px; background: #f0ebe3; border-radius: 12px; border: 1px solid #d4a053;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0a4a5c; text-transform: uppercase; letter-spacing: 0.06em;">
          Apple Calendar
        </p>
        <p style="margin: 0; font-size: 15px; line-height: 1.55; color: #243847;">
          Open the attached <strong>${filename}</strong> file. On iPhone or Mac, tap the attachment and choose
          <strong>Add to Calendar</strong> — all ${bookings.length === 1 ? "lesson" : "lessons"} for the week import at once.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #0a4a5c; color: #fff; text-align: left;">
            <th style="padding: 10px 12px;">Swimmer</th>
            <th style="padding: 10px 12px;">Time</th>
            <th style="padding: 10px 12px;">Schedule</th>
          </tr>
        </thead>
        <tbody>
          ${bookings
            .map(
              (b, i) => `
            <tr style="background: ${i % 2 === 0 ? "#fff" : "#f8fafb"};">
              <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8ed;">
                <strong>${b.swimmer_name}</strong><br/>
                <span style="font-size: 12px; color: #3d5563;">${b.parent_name}</span>
              </td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8ed;">
                ${formatTime(b.lesson_time)}${b.second_day_time ? `<br/><span style="font-size:12px;color:#3d5563;">+ ${formatTime(b.second_day_time)}</span>` : ""}
              </td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8ed; font-size: 13px; color: #243847;">
                ${bookingSummary(b)}
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <p style="margin-top: 24px; font-size: 13px; color: #3d5563;">
        Full admin schedule: <a href="https://swimtosurf.co/admin" style="color: #0891b2; font-weight: 600;">swimtosurf.co/admin</a>
      </p>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `🏊 ${week.label} — ${name} (${bookings.length} lesson${bookings.length === 1 ? "" : "s"})`,
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(ics, "utf-8").toString("base64"),
        contentType: "text/calendar; charset=utf-8",
      },
    ],
  });
}
