import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPrepEmailContent } from "@/lib/email-templates";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: bookings, error } = await getUpcomingBookingsMissingReminder();
    if (error) throw error;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const host = req.headers.get("host") || "swimtosurf.com";
    const origin = host.includes("localhost") ? `http://${host}` : `https://${host}`;

    let processedCount = 0;
    const now = new Date();
    // 8 days from now
    const targetDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const b of bookings) {
      if (!b.parent_email) continue;

      let firstLessonDateStr = b.week_start;

      // If month-based (Estee), calculate the first lesson date
      if (!firstLessonDateStr && b.month && b.day_of_week && b.day_of_week.length > 0) {
        const primaryDay = b.day_of_week[0].toLowerCase();
        const [year, monthNum] = b.month.split("-");
        const firstDay = new Date(Number(year), Number(monthNum) - 1, 1);
        const targetDow = primaryDay === "wednesday" ? 3 : primaryDay === "thursday" ? 4 : 1;
        while (firstDay.getDay() !== targetDow) {
          firstDay.setDate(firstDay.getDate() + 1);
        }
        firstLessonDateStr = firstDay.toISOString().split("T")[0];
      }

      if (!firstLessonDateStr) continue;

      // If the first lesson starts on our target date (8 days from now)
      if (firstLessonDateStr === targetDateStr) {
        
        // Build schedule strings
        const instructorName = b.instructor === "lukaah" ? "Lukaah" : "Estee";
        let scheduleText = "";
        let specificDays = "";

        if (b.instructor === "lukaah") {
          const timeFormatted = formatTime(b.lesson_time);
          scheduleText = `Monday – Friday at ${timeFormatted}`;
          specificDays = `Week of ${b.week_start} (Mon – Fri)`;
        } else {
          const daysCap = b.day_of_week.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(" & ");
          let timeFormatted = formatTime(b.lesson_time);
          if (b.second_day_time) {
            timeFormatted += ` & ${formatTime(b.second_day_time)}`;
          }
          scheduleText = `Every ${daysCap} at ${timeFormatted}`;
          specificDays = `${b.month} · Every ${daysCap}`;
        }

        const html = getPrepEmailContent(
          b.parent_name || b.swimmer_name,
          instructorName,
          scheduleText,
          specificDays,
          b.id,
          origin
        );

        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [b.parent_email],
            subject: `Reminder: Your Swim Lessons start in 8 days! 🌊`,
            html: `
              <div style="font-family: sans-serif; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0077B6;">Get Ready to Swim! 🏊</h2>
                <p style="color: #86868B;">Your lessons are coming up next week.</p>
              </div>
              ${html}
            `
          });

          // Mark as sent
          await supabase.from("bookings").update({ reminder_sent: true }).eq("id", b.id);
          processedCount++;
        } catch (e) {
          console.error(`Failed to send reminder to ${b.parent_email}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error("Reminder Cron Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getUpcomingBookingsMissingReminder() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return supabase
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .eq("reminder_sent", false) // only process ones that haven't been sent
    .gte("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()); // Look back 60 days max
}
