import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";
const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL 
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url"
      && process.env.SUPABASE_SERVICE_ROLE_KEY
      && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-supabase-anon-key";

    if (!hasSupabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the booking first so we can send a cancellation email
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    // Cancel it
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
    }

    // Send cancellation emails
    const hasResend = process.env.RESEND_API_KEY 
      && process.env.RESEND_API_KEY !== "your-resend-api-key";

    if (hasResend) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const instructorName = booking.instructor === "lukaah" ? "Lukaah" : "Estee";
      const adminEmail = booking.instructor === "estee" ? ESTEE_EMAIL : LUKAAH_EMAIL;

      // Email the customer
      if (booking.parent_email) {
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [booking.parent_email],
            subject: `Booking Cancelled - ${booking.swimmer_name}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
                <div style="padding: 40px 0; text-align: center; border-bottom: 1px solid #E8E8ED;">
                  <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Booking Cancelled</h1>
                  <p style="color: #86868B; font-size: 14px; margin: 8px 0 0;">Confirmation #${id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div style="padding: 32px 0;">
                  <p style="font-size: 16px; line-height: 1.6;">Hi ${booking.parent_name || booking.swimmer_name},</p>
                  <p style="font-size: 16px; line-height: 1.6;">Your swim lessons for <strong>${booking.swimmer_name}</strong> with <strong>${instructorName}</strong> have been cancelled.</p>
                  <p style="font-size: 16px; line-height: 1.6;">If you'd like to rebook, visit <a href="https://swimtosurf.com/book" style="color: #0077B6;">swimtosurf.com/book</a>.</p>
                  <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">Thank you,<br/>Swim to Surf</p>
                </div>
                <p style="color: #86868B; font-size: 13px; border-top: 1px solid #E8E8ED; padding-top: 24px;">
                  Swim to Surf LLC · American Fork, Utah<br/>
                  swimtosurfemail@gmail.com · 385-499-8036
                </p>
              </div>
            `,
          });
        } catch (e) {
          console.error("Cancel email (customer) error:", e);
        }
      }

      // Email the instructor
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: `❌ Cancelled: ${booking.swimmer_name} with ${instructorName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 32px 0; text-align: center; border-bottom: 2px solid #EF476F;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #EF476F;">❌ Booking Cancelled</h1>
                <p style="color: #86868B; font-size: 14px; margin: 8px 0 0;">#${id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div style="padding: 24px 0;">
                <p style="font-size: 16px;"><strong>${booking.swimmer_name}</strong> (age ${booking.swimmer_age}) — lessons have been cancelled.</p>
                <p style="font-size: 14px; color: #86868B;">Time slot is now open for new bookings.</p>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error("Cancel email (admin) error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
