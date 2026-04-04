import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

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
      console.warn("⚠ Resend not configured — no emails will be sent. Set RESEND_API_KEY in .env.local (get one from https://resend.com/api-keys)");
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
        && process.env.STRIPE_SECRET_KEY.startsWith("sk_");

      if (!hasStripe) {
        return NextResponse.json({ error: "Card payments are not yet configured. Please use Venmo or Cash." }, { status: 400 });
      }

      // @ts-expect-error - ignoring strict API version type
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
      try {
        const basePriceCents = priceInfo.price;
        const priceWithFeeCents = Math.round((basePriceCents + 30) / 0.971);
        const feeAmountCents = priceWithFeeCents - basePriceCents;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
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
          mode: "payment",
          success_url: `${origin}/book/success?bookingId=${bookingId}`,
          cancel_url: `${origin}/book`,
          client_reference_id: bookingId,
          metadata: { bookingId },
        });

        return NextResponse.json({ url: session.url });
      } catch (stripeErr: unknown) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
        console.error("Stripe Checkout Error:", errMsg, stripeErr);
        return NextResponse.json({ error: `Card payment failed: ${errMsg}` }, { status: 400 });
      }
    }

    // 3. Build schedule summary for emails
    const instructorName = instructor === "lukaah" ? "Lukaah" : "Estee";
    let scheduleText = "";
    if (schedule.type === "weekly") {
      scheduleText = `Mon–Fri at ${schedule.time}, week of ${schedule.weekStart}`;
    } else {
      const dayName = schedule.primaryDay.charAt(0).toUpperCase() + schedule.primaryDay.slice(1);
      scheduleText = `Every ${dayName} at ${schedule.primaryTime}, ${schedule.month}`;
      if (schedule.secondDay && schedule.secondDayTime) {
        const otherDay = schedule.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
        scheduleText += ` + ${otherDay} at ${schedule.secondDayTime}`;
      }
    }

    // 4. Send confirmation email to customer
    if (resend && swimmerInfo.parentEmail) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [swimmerInfo.parentEmail],
          subject: "Your Swim Session is Booked! 🏊",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 40px 0; text-align: center; border-bottom: 1px solid #E8E8ED;">
                <h1 style="font-size: 28px; font-weight: 600; margin: 0 0 8px;">You're booked! 🏊</h1>
                <p style="color: #86868B; font-size: 16px; margin: 0;">Swim to Surf · Order #${bookingId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <div style="padding: 32px 0;">
                <p style="font-size: 16px; line-height: 1.6;">Hi ${swimmerInfo.parentName || swimmerInfo.swimmerName},</p>
                <p style="font-size: 16px; line-height: 1.6;">You are officially booked for <strong>${priceInfo.totalLessons} lessons</strong> with <strong>${instructorName}</strong>!</p>
                
                <div style="margin: 20px 0; padding: 16px 20px; background: #E8F4FD; border-radius: 12px; border: 1px solid #B8DFF0;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: #0077B6; font-weight: 600;">📅 Schedule</p>
                  <p style="margin: 0; font-size: 15px; color: #1D3557;">${scheduleText}</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;"><strong>Please bring payment (Venmo/Cash) to your first session.</strong></p>
              </div>
              
              <div style="margin: 24px 0; padding: 24px; background: #F5F5F7; border-radius: 16px; border: 1px solid #E8E8ED;">
                <h3 style="margin: 0 0 16px; color: #1D1D1F; font-size: 16px;">⚠️ Important Reminders</h3>
                <ul style="padding-left: 20px; margin: 0; color: #333; line-height: 1.8; font-size: 14px;">
                  <li><strong>Cancellations:</strong> Full cancellations require 7 days advance notice.</li>
                  <li><strong>Missed Lessons:</strong> Notify us 24 hours in advance if you need to miss a lesson. Makeup sessions are not guaranteed.</li>
                  <li><strong>No-shows:</strong> No refunds or makeups for no-shows or late cancellations.</li>
                  <li><strong>Parking:</strong> Park on the <strong>south side of 1300 N</strong>. Do not block neighbors.</li>
                  <li><strong>Waiver:</strong> By booking, you signed and agreed to the liability waiver.</li>
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

    // 5. Send admin notification email to Lukaah
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: `🆕 New Booking: ${swimmerInfo.swimmerName} with ${instructorName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 32px 0; text-align: center; border-bottom: 2px solid #0077B6;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #0077B6;">🆕 New Booking Received</h1>
                <p style="color: #86868B; font-size: 14px; margin: 0;">Order #${bookingId.slice(0, 8).toUpperCase()} · ${paymentMethod === 'stripe' ? '💳 Card' : paymentMethod === 'venmo' ? '📱 Venmo' : '💵 Cash'}</p>
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
                    <td style="padding: 12px 0;">${scheduleText}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Lessons</td>
                    <td style="padding: 12px 0;">${priceInfo.totalLessons} × ${priceInfo.duration} min</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #86868B;">Price</td>
                    <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #0077B6;">$${(priceInfo.price / 100).toFixed(2)}</td>
                  </tr>
                  ${swimmerInfo.notes ? `<tr><td style="padding: 12px 0; font-weight: 600; color: #86868B;">Notes</td><td style="padding: 12px 0;">${swimmerInfo.notes}</td></tr>` : ''}
                </table>
              </div>
              
              <p style="color: #86868B; font-size: 12px; margin-top: 24px; border-top: 1px solid #E8E8ED; padding-top: 16px; text-align: center;">
                Swim to Surf Admin Notification · Booking ID: ${bookingId}
              </p>
            </div>
          `,
        });
        console.log("✅ Admin notification email sent to:", ADMIN_EMAIL);
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
