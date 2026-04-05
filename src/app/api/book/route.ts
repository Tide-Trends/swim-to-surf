import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";
import { getPrepEmailContent } from "@/lib/email-templates";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { formatLessonTimeHm, lessonLocalToUtcIso } from "@/lib/timezone";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  formatPrice,
} from "@/lib/constants";
import {
  esteeProposalConflicts,
  lukaahProposalConflicts,
  type BookingSlotRow,
} from "@/lib/booking-slots";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

function getAdminEmail(instructor: string): string {
  return instructor === "estee" ? ESTEE_EMAIL : LUKAAH_EMAIL;
}

/** Generate an .ics calendar event URL */
function buildCalendarLink(title: string, startDate: string, time: string, durationMin: number): string {
  const d = lessonLocalToUtcIso(startDate, time);
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

function computeScheduleEmailFields(
  instructor: "lukaah" | "estee",
  schedule: ScheduleSelection,
  priceInfo: { duration: number }
) {
  const instructorName = instructor === "lukaah" ? "Lukaah" : "Estee";
  let scheduleText = "";
  let specificDays = "";
  let calendarLink = "";

  if (schedule.type === "weekly") {
    const time24 = schedule.time;
    const timeFormatted = formatLessonTimeHm(time24);
    const weekStart = schedule.weekStart;
    scheduleText = `Monday – Friday at ${timeFormatted}`;
    specificDays = `Week of ${weekStart} (Mon – Fri)`;
    calendarLink = buildCalendarLink(`🏊 Swim Lesson with ${instructorName}`, weekStart, time24, priceInfo.duration);
  } else {
    const dayName = schedule.primaryDay.charAt(0).toUpperCase() + schedule.primaryDay.slice(1);
    const timeFormatted = formatLessonTimeHm(schedule.primaryTime);
    scheduleText = `Every ${dayName} at ${timeFormatted}`;
    specificDays = `${schedule.month} · Every ${dayName}`;

    if (schedule.secondDay && schedule.secondDayTime) {
      const otherDay = schedule.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
      const otherTimeFormatted = formatLessonTimeHm(schedule.secondDayTime);
      scheduleText += ` + ${otherDay} at ${otherTimeFormatted}`;
      specificDays += ` & ${otherDay}`;
    }

    const [year, monthNum] = schedule.month.split("-").map(Number);
    const targetDow = schedule.primaryDay === "wednesday" ? 3 : 4;
    const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
    let firstLessonYmd = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    for (let dom = 1; dom <= daysInMonth; dom++) {
      if (new Date(Date.UTC(year, monthNum - 1, dom)).getUTCDay() === targetDow) {
        firstLessonYmd = `${year}-${String(monthNum).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
        break;
      }
    }
    calendarLink = buildCalendarLink(
      `🏊 Swim Lesson with ${instructorName}`,
      firstLessonYmd,
      schedule.primaryTime,
      priceInfo.duration
    );
  }

  return { instructorName, scheduleText, specificDays, calendarLink };
}

type SwimmerPayload = {
  swimmerName: string;
  swimmerAge: number;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
};

async function sendBookingEmails(args: {
  resend: Resend | null;
  bookingId: string;
  instructor: string;
  swimmerInfo: SwimmerPayload;
  instructorName: string;
  scheduleText: string;
  specificDays: string;
  calendarLink: string;
  priceFormatted: string;
  priceInfo: { totalLessons: number; duration: number; price: number };
  paymentMethod: string;
  origin: string;
}): Promise<{ customerEmailSent: boolean; adminEmailSent: boolean }> {
  const {
    resend,
    bookingId,
    instructor,
    swimmerInfo,
    instructorName,
    scheduleText,
    specificDays,
    calendarLink,
    priceFormatted,
    priceInfo,
    paymentMethod,
    origin,
  } = args;

  let customerEmailSent = false;
  let adminEmailSent = false;

  const customerTo = swimmerInfo.parentEmail?.trim();
  if (!resend) {
    return { customerEmailSent: false, adminEmailSent: false };
  }

  const paymentBlurb =
    paymentMethod === "stripe"
      ? "<p style=\"font-size: 16px; line-height: 1.6;\"><strong>Card payment:</strong> Complete checkout on the next screen. You&rsquo;ll get a receipt from Stripe when payment succeeds.</p>"
      : '<p style="font-size: 16px; line-height: 1.6;"><strong>💳 Payment:</strong> Please bring payment (Venmo or Cash) to your first lesson.</p>';

  if (customerTo) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [customerTo],
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

                ${paymentBlurb}
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
      customerEmailSent = true;
      console.log("✅ Customer confirmation email sent to:", customerTo);
    } catch (e) {
      console.error("Resend Error (customer):", e instanceof Error ? e.message : e);
    }
  } else {
    console.warn("⚠ No customer email address — skipping confirmation email. Admin will still be notified if Resend is configured.");
  }

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
                <p style="color: #86868B; font-size: 14px; margin: 0;">Confirmation #${bookingId.slice(0, 8).toUpperCase()} · ${paymentMethod === "stripe" ? "💳 Card" : paymentMethod === "venmo" ? "📱 Venmo" : "💵 Cash"}</p>
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
                    <td style="padding: 12px 0;"><a href="mailto:${swimmerInfo.parentEmail || ""}" style="color: #0077B6;">${swimmerInfo.parentEmail || "Not provided"}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Phone</td>
                    <td style="padding: 12px 0;"><a href="tel:${swimmerInfo.parentPhone || ""}" style="color: #0077B6;">${swimmerInfo.parentPhone || "Not provided"}</a></td>
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
                  ${swimmerInfo.notes ? `<tr><td style="padding: 12px 0; font-weight: 600; color: #86868B;">Notes</td><td style="padding: 12px 0;">${swimmerInfo.notes}</td></tr>` : ""}
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
    adminEmailSent = true;
    console.log("✅ Admin notification email sent to:", adminEmail);
  } catch (e) {
    console.error("Resend Error (admin):", e instanceof Error ? e.message : e);
  }

  return { customerEmailSent, adminEmailSent };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instructor, swimmerInfo, schedule, priceInfo, paymentMethod } = body as {
      instructor: "lukaah" | "estee";
      swimmerInfo: {
        swimmerName: string;
        swimmerAge: number;
        swimmerMonths?: number;
        lessonTier?: "auto" | "infant" | "standard";
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        notes?: string;
      };
      schedule: ScheduleSelection;
      priceInfo: { duration: number; price: number; totalLessons: number };
      paymentMethod: string;
    };

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-supabase-anon-key";

    const hasResend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your-resend-api-key";

    const resend = hasResend ? new Resend(process.env.RESEND_API_KEY) : null;
    if (!hasResend) {
      console.warn("⚠ Resend not configured — no emails will be sent. Set RESEND_API_KEY in .env.local");
    }

    let bookingId = crypto.randomUUID();

    const tier = effectiveLessonTier(swimmerInfo.swimmerAge, swimmerInfo.lessonTier ?? "auto");
    const basePricing =
      instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);

    let expectedLessons: number;
    let expectedPrice: number;
    if (schedule.type === "weekly") {
      expectedLessons = 5;
      expectedPrice = basePricing.price;
    } else {
      expectedLessons = schedule.secondDay ? 8 : 4;
      expectedPrice = schedule.secondDay ? basePricing.price * 2 : basePricing.price;
    }

    if (basePricing.duration !== priceInfo.duration || expectedLessons !== priceInfo.totalLessons) {
      return NextResponse.json(
        { error: "Lesson length does not match swimmer age and options. Please refresh and try again." },
        { status: 400 }
      );
    }
    if (Math.abs(expectedPrice - priceInfo.price) > 1) {
      return NextResponse.json(
        { error: `Price mismatch (expected ${formatPrice(expectedPrice)}). Please refresh and try again.` },
        { status: 400 }
      );
    }

    // 1. Create booking in Supabase (if configured)
    if (hasSupabase) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      if (schedule.type === "weekly") {
        const { data: existing, error: exErr } = await supabase
          .from("bookings")
          .select("lesson_time, week_start")
          .eq("instructor", "lukaah")
          .eq("week_start", schedule.weekStart)
          .eq("status", "confirmed");
        if (exErr) {
          console.error("Slot check error:", exErr);
          return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
        }
        if (lukaahProposalConflicts((existing || []) as BookingSlotRow[], schedule.weekStart, schedule.time)) {
          return NextResponse.json(
            { error: "That time slot was just booked for this week. Please pick another time." },
            { status: 409 }
          );
        }
      } else {
        const { data: existing, error: exErr } = await supabase
          .from("bookings")
          .select("lesson_time, second_day_time, day_of_week")
          .eq("instructor", "estee")
          .eq("month", schedule.month)
          .eq("status", "confirmed");
        if (exErr) {
          console.error("Slot check error:", exErr);
          return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
        }
        if (esteeProposalConflicts((existing || []) as BookingSlotRow[], schedule)) {
          return NextResponse.json(
            { error: "One of those times is no longer available this month. Please choose different times." },
            { status: 409 }
          );
        }
      }

      const tierNote =
        swimmerInfo.lessonTier && swimmerInfo.lessonTier !== "auto"
          ? `Lesson tier: ${tier} (manual: ${swimmerInfo.lessonTier})`
          : "";
      const notesCombined = [
        swimmerInfo.swimmerAge === 0 && typeof swimmerInfo.swimmerMonths === "number"
          ? `Age detail: ${swimmerInfo.swimmerMonths} months`
          : "",
        tierNote,
        swimmerInfo.notes || "",
      ]
        .filter(Boolean)
        .join(" | ") || null;

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
          notes: notesCombined,
          status: "confirmed",
          price: priceInfo.price,
          total_lessons: priceInfo.totalLessons,
          month: schedule.type === "monthly" ? schedule.month : null,
          week_start: schedule.type === "weekly" ? schedule.weekStart : null,
          day_of_week:
            schedule.type === "weekly"
              ? ["monday", "tuesday", "wednesday", "thursday", "friday"]
              : schedule.secondDay
                ? [schedule.primaryDay, schedule.primaryDay === "wednesday" ? "thursday" : "wednesday"]
                : [schedule.primaryDay],
          lesson_time: schedule.type === "weekly" ? schedule.time : schedule.primaryTime,
          second_day_time: schedule.type === "monthly" ? schedule.secondDayTime || null : null,
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

    const persisted = hasSupabase;

    const { instructorName, scheduleText, specificDays, calendarLink } = computeScheduleEmailFields(
      instructor as "lukaah" | "estee",
      schedule as ScheduleSelection,
      priceInfo
    );
    const priceFormatted = `$${(priceInfo.price / 100).toFixed(2)}`;

    const emailPayload = {
      resend,
      bookingId,
      instructor,
      swimmerInfo,
      instructorName,
      scheduleText,
      specificDays,
      calendarLink,
      priceFormatted,
      priceInfo,
      paymentMethod,
      origin,
    };

    // 2. Stripe: create checkout, then send emails (same as Venmo — previously emails never ran for card checkout)
    if (paymentMethod === "stripe") {
      const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder";

      if (!hasStripe) {
        return NextResponse.json({ error: "Card payments not configured. Please use Venmo or Cash." }, { status: 400 });
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
        });

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
                  description: `${priceInfo.totalLessons} lessons (includes $${(feeAmountCents / 100).toFixed(2)} processing fee)`,
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

        const { customerEmailSent, adminEmailSent } = await sendBookingEmails(emailPayload);

        return NextResponse.json({
          url: session.url,
          id: bookingId,
          persisted,
          customerEmailSent,
          adminEmailSent,
        });
      } catch (stripeErr: unknown) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
        console.error("Stripe Checkout Error:", errMsg, stripeErr);
        return NextResponse.json({ error: `Card payment failed: ${errMsg}` }, { status: 400 });
      }
    }

    const { customerEmailSent, adminEmailSent } = await sendBookingEmails(emailPayload);

    return NextResponse.json({
      id: bookingId,
      persisted,
      customerEmailSent,
      adminEmailSent,
    });
  } catch (error) {
    console.error("Booking handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

