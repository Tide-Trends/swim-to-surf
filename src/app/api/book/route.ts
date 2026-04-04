import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { getPrepEmailContent } from "@/lib/email-templates";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

function getAdminEmail(instructor: string): string {
  return instructor === "estee" ? ESTEE_EMAIL : LUKAAH_EMAIL;
}

/** Generate an .ics calendar event URL */
function buildCalendarLink(title: string, startDate: string, time: string, durationMin: number): string {
  // Parse the date and time
  const [h, m] = time.split(":").map(Number);
  const d = new Date(startDate + "T12:00:00");
  d.setHours(h, m, 0, 0);
  
  const start = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const endDate = new Date(d.getTime() + durationMin * 60000);
  const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: `Swimming lesson with Swim to Surf. Questions? Email swimtosurfemail@gmail.com or call 385-499-8036.`,
    location: "American Fork, Utah",
  });
  
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instructor, swimmerInfo, schedule, priceInfo, paymentMethod } = body;
    
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL 
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url"
      && process.env.SUPABASE_SERVICE_ROLE_KEY
      && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-supabase-anon-key";

    const hasResend = process.env.RESEND_API_KEY 
      && process.env.RESEND_API_KEY !== "your-resend-api-key";

    const resend = hasResend ? new Resend(process.env.RESEND_API_KEY) : null;
    if (!hasResend) {
      console.warn("⚠ Resend not configured — no emails will be sent. Set RESEND_API_KEY in .env.local");
    }

    let bookingId = crypto.randomUUID();

    // 1. Create booking in Supabase (if configured)
    if (hasSupabase) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: booking, error: dbError } = await supabase
        .from("bookings")
        .insert({
          instructor,
          swimmer_name: swimmerInfo.swimmerName,
          swimmer_age: swimmerInfo.swimmerAge,
          lesson_duration: priceInfo.duration,
          parent_name: swimmerInfo.parentName || "Adult Swimmer",
          parent_email: swimmerInfo.parentEmail || null,
          parent_phone: swimmerInfo.parentPhone || null,
          notes: [
            swimmerInfo.swimmerAge === 0 && typeof swimmerInfo.swimmerMonths === "number"
              ? `Age detail: ${swimmerInfo.swimmerMonths} months`
              : "",
            swimmerInfo.notes || "",
          ].filter(Boolean).join(" | ") || null,
          status: 'confirmed',
          price: priceInfo.price,
          total_lessons: priceInfo.totalLessons,
          month: schedule.month || null,
          week_start: schedule.weekStart || null,
          day_of_week: schedule.type === 'weekly' ? ['monday','tuesday','wednesday','thursday','friday'] : (schedule.secondDay ? [schedule.primaryDay, schedule.primaryDay === 'wednesday' ? 'thursday' : 'wednesday'] : [schedule.primaryDay]),
          lesson_time: schedule.time || schedule.primaryTime,
          second_day_time: schedule.secondDayTime || null,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("Supabase Error:", dbError);
        return NextResponse.json({ error: "Failed to save booking. Please try again." }, { status: 400 });
      }
      bookingId = booking.id;
    } else {
      console.warn("⚠ Supabase not configured — booking saved locally only. ID:", bookingId);
    }

    // 2. Handle Stripe payments
    if (paymentMethod === "stripe") {
      const hasStripe = process.env.STRIPE_SECRET_KEY 
        && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder";

      if (!hasStripe) {
        return NextResponse.json({ error: "Card payments not configured. Please use Venmo or Cash." }, { status: 400 });
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion });
        
        const feePercent = 0.035; // 3.5% processing fee
        const feeAmountCents = Math.round(priceInfo.price * feePercent);
        const priceWithFeeCents = priceInfo.price + feeAmountCents;

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Swim Lessons with ${instructor === "lukaah" ? "Lukaah" : "Estee"}`,
                  description: `${priceInfo.totalLessons} lessons (includes $${(feeAmountCents / 100).toFixed(2)} processing fee)`
                },
                unit_amount: priceWithFeeCents,
              },
              quantity: 1,
            },
          ],
          metadata: { bookingId, instructor },
          success_url: `${origin}/book?success=true&booking=${bookingId}`,
          cancel_url: `${origin}/book?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
      } catch (stripeErr: unknown) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
        console.error("Stripe Checkout Error:", errMsg, stripeErr);
        return NextResponse.json({ error: `Card payment failed: ${errMsg}` }, { status: 400 });
      }
    }

    // 3. Build schedule details for emails
    const instructorName = instructor === "lukaah" ? "Lukaah" : "Estee";
    let scheduleText = "";
    let specificDays = "";
    let calendarLink = "";
    
    if (schedule.type === "weekly") {
      const time24 = schedule.time;
      const timeFormatted = formatTime(time24);
      const weekStart = schedule.weekStart;
      scheduleText = `Monday – Friday at ${timeFormatted}`;
      specificDays = `Week of ${weekStart} (Mon – Fri)`;
      calendarLink = buildCalendarLink(
        `🏊 Swim Lesson with ${instructorName}`,
        weekStart,
        time24,
        priceInfo.duration
      );
    } else {
      const dayName = schedule.primaryDay.charAt(0).toUpperCase() + schedule.primaryDay.slice(1);
      const timeFormatted = formatTime(schedule.primaryTime);
      scheduleText = `Every ${dayName} at ${timeFormatted}`;
      specificDays = `${schedule.month} · Every ${dayName}`;
      
      if (schedule.secondDay && schedule.secondDayTime) {
        const otherDay = schedule.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
        const otherTimeFormatted = formatTime(schedule.secondDayTime);
        scheduleText += ` + ${otherDay} at ${otherTimeFormatted}`;
        specificDays += ` & ${otherDay}`;
      }
      
      // Build calendar link for first lesson date
      const [year, month] = schedule.month.split("-");
      const firstDay = new Date(Number(year), Number(month) - 1, 1);
      const targetDow = schedule.primaryDay === "wednesday" ? 3 : 4;
      while (firstDay.getDay() !== targetDow) firstDay.setDate(firstDay.getDate() + 1);
      calendarLink = buildCalendarLink(
        `🏊 Swim Lesson with ${instructorName}`,
        firstDay.toISOString().split("T")[0],
        schedule.primaryTime,
        priceInfo.duration
      );
    }

    const cancelLink = `${origin}/contact`;
    const priceFormatted = `$${(priceInfo.price / 100).toFixed(2)}`;

    // 4. Send confirmation email to customer
    if (resend && swimmerInfo.parentEmail) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [swimmerInfo.parentEmail],
          subject: `Your Swim Lessons are Booked! 🏊`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 40px 0; text-align: center; border-bottom: 1px solid #E8E8ED;">
                <h1 style="font-size: 28px; font-weight: 600; margin: 0 0 8px;">You're booked! 🏊</h1>
                <p style="color: #86868B; font-size: 16px; margin: 0;">Swim to Surf · Confirmation #${bookingId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <div style="padding: 32px 0;">
                <p style="font-size: 16px; line-height: 1.6;">Hi ${swimmerInfo.parentName || swimmerInfo.swimmerName},</p>
                <p style="font-size: 16px; line-height: 1.6;">You are officially booked for <strong>${priceInfo.totalLessons} lessons</strong> with <strong>${instructorName}</strong>!</p>
                
                <div style="margin: 24px 0; padding: 20px; background: #E8F4FD; border-radius: 16px; border: 1px solid #B8DFF0;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: #0077B6; font-weight: 700;">📅 YOUR SCHEDULE</p>
                  <p style="margin: 0 0 8px; font-size: 17px; color: #1D3557; font-weight: 600;">${scheduleText}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: #1D3557;">${specificDays}</p>
                  <p style="margin: 0; font-size: 14px; color: #1D3557;">${priceInfo.totalLessons} × ${priceInfo.duration}-minute lessons · <strong>${priceFormatted}</strong></p>
                </div>

                <div style="text-align: center; margin: 24px 0;">
                  <a href="${calendarLink}" style="display: inline-block; background: #0077B6; color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 600;">📅 Add to Calendar</a>
                </div>
                
                ${paymentMethod !== "stripe" ? '<p style="font-size: 16px; line-height: 1.6;"><strong>💳 Payment:</strong> Please bring payment (Venmo or Cash) to your first lesson.</p>' : ''}
              </div>
              
              <div style="margin: 24px 0; padding: 24px; background: #FFF; border-radius: 16px; border: 1px solid #E8E8ED;">
                ${getPrepEmailContent(swimmerInfo.parentName || swimmerInfo.swimmerName, instructorName, scheduleText, specificDays, bookingId, origin)}
              </div>
              
              <div style="margin: 24px 0; padding: 24px; background: #F5F5F7; border-radius: 16px; border: 1px solid #E8E8ED;">
                <h3 style="margin: 0 0 16px; color: #1D1D1F; font-size: 16px;">⚠️ Additional Policies</h3>
                <ul style="padding-left: 20px; margin: 0; color: #333; line-height: 1.8; font-size: 14px;">
                  <li><strong>Full Cancellation:</strong> 7 days advance notice required for a full refund.</li>
                  <li><strong>Missed Lesson:</strong> Notify us 24 hours in advance. We'll try to accommodate, but makeups are not guaranteed.</li>
                  <li><strong>No-shows:</strong> No refunds or rescheduling for no-shows or late cancellations.</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">We can't wait to see you in the water! 🌊</p>
              <p style="color: #86868B; font-size: 13px; margin-top: 32px; border-top: 1px solid #E8E8ED; padding-top: 24px;">
                Swim to Surf LLC · American Fork, Utah<br/>
                swimtosurfemail@gmail.com · 385-499-8036
              </p>
            </div>
          `,
        });
        console.log("✅ Customer confirmation email sent to:", swimmerInfo.parentEmail);
      } catch (e) {
        console.error("Resend Error (customer):", e);
      }
    }

    // 5. Send admin notification email to the correct instructor
    if (resend) {
      const adminEmail = getAdminEmail(instructor);
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: `🆕 New Booking: ${swimmerInfo.swimmerName} with ${instructorName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 32px 0; text-align: center; border-bottom: 2px solid #0077B6;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #0077B6;">🆕 New Booking Received</h1>
                <p style="color: #86868B; font-size: 14px; margin: 0;">Confirmation #${bookingId.slice(0, 8).toUpperCase()} · ${paymentMethod === 'stripe' ? '💳 Card' : paymentMethod === 'venmo' ? '📱 Venmo' : '💵 Cash'}</p>
              </div>
              
              <div style="padding: 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B; width: 140px;">Instructor</td>
                    <td style="padding: 12px 0;">${instructorName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Swimmer</td>
                    <td style="padding: 12px 0;">${swimmerInfo.swimmerName} (age ${swimmerInfo.swimmerAge})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Guardian</td>
                    <td style="padding: 12px 0;">${swimmerInfo.parentName || "N/A"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Email</td>
                    <td style="padding: 12px 0;"><a href="mailto:${swimmerInfo.parentEmail || ''}" style="color: #0077B6;">${swimmerInfo.parentEmail || "Not provided"}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Phone</td>
                    <td style="padding: 12px 0;"><a href="tel:${swimmerInfo.parentPhone || ''}" style="color: #0077B6;">${swimmerInfo.parentPhone || "Not provided"}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Schedule</td>
                    <td style="padding: 12px 0;">${scheduleText}<br/><span style="color:#86868B;font-size:13px;">${specificDays}</span></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Lessons</td>
                    <td style="padding: 12px 0;">${priceInfo.totalLessons} × ${priceInfo.duration} min</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Price</td>
                    <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #0077B6;">${priceFormatted}</td>
                  </tr>
                  ${swimmerInfo.notes ? `<tr><td style="padding: 12px 0; font-weight: 600; color: #86868B;">Notes</td><td style="padding: 12px 0;">${swimmerInfo.notes}</td></tr>` : ''}
                </table>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${calendarLink}" style="display: inline-block; background: #0077B6; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 600;">📅 Add to Your Calendar</a>
              </div>

              <p style="color: #86868B; font-size: 12px; margin-top: 24px; border-top: 1px solid #E8E8ED; padding-top: 16px; text-align: center;">
                Swim to Surf Admin Notification · Booking ID: ${bookingId}
              </p>
            </div>
          `,
        });
        console.log("✅ Admin notification email sent to:", adminEmail);
      } catch (e) {
        console.error("Resend Error (admin):", e);
      }
    }

    return NextResponse.json({ id: bookingId });

  } catch (error) {
    console.error("Booking handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
