import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

export async function GET(req: Request) {
  try {
    // Basic auth check for Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: bookings, error } = await getUpcomingBookings();
    if (error) throw error;

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Filter and send to Lukaah
    const lukaahBookings = bookings.filter(b => b.instructor === 'lukaah');
    if (lukaahBookings.length > 0) {
      await sendInstructorSchedule(resend, LUKAAH_EMAIL, "Lukaah", lukaahBookings);
    }

    // Filter and send to Estee
    const esteeBookings = bookings.filter(b => b.instructor === 'estee');
    if (esteeBookings.length > 0) {
      await sendInstructorSchedule(resend, ESTEE_EMAIL, "Estee", esteeBookings);
    }

    return NextResponse.json({ success: true, processed: bookings.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getUpcomingBookings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Simple query for all active bookings
  return supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed");
}

async function sendInstructorSchedule(resend: Resend, to: string, name: string, bookings: any[]) {
  const html = `
    <div style="font-family: sans-serif; color: #1D1D1F; max-width: 600px;">
      <h1 style="color: #0077B6;">Weekly Schedule Update 🏊</h1>
      <p>Hi ${name}, here are your confirmed bookings for the upcoming week:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #F5F5F7; text-align: left;">
            <th style="padding: 12px; border: 1px solid #E8E8ED;">Swimmer</th>
            <th style="padding: 12px; border: 1px solid #E8E8ED;">Time</th>
            <th style="padding: 12px; border: 1px solid #E8E8ED;">Details</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map(b => `
            <tr>
              <td style="padding: 12px; border: 1px solid #E8E8ED;">
                <strong>${b.swimmer_name}</strong><br/>
                <span style="font-size: 12px; color: #86868B;">${b.parent_name}</span>
              </td>
              <td style="padding: 12px; border: 1px solid #E8E8ED;">
                ${b.lesson_time}${b.second_day_time ? ` & ${b.second_day_time}` : ''}
              </td>
              <td style="padding: 12px; border: 1px solid #E8E8ED; font-size: 13px;">
                ${b.week_start ? `Week of ${b.week_start}` : b.month}<br/>
                ${b.day_of_week.join(', ')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 30px; font-size: 14px; color: #86868B;">View full details at <a href="https://swimtosurf.com/admin" style="color: #0077B6;">swimtosurf.com/admin</a></p>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `🏊 Your Weekly Swim Schedule - ${name}`,
    html,
  });
}
