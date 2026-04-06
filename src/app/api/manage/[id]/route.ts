import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { canSelfServeManageBooking } from "@/lib/booking-first-lesson";
import { lukaahWeekOverlapsBlackout } from "@/lib/lukaah-availability";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { action, scheduleText, specificDays, newData } = body;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured. Add Supabase keys on the server." },
        { status: 503 }
      );
    }

    const usingServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

    // Fetch existing
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const policyOk = canSelfServeManageBooking(booking);

    if (action === "cancel") {
      if (!policyOk) {
        return NextResponse.json(
          {
            error:
              "Self-serve changes aren’t available within 7 days of your first lesson. Please email or call us for help.",
          },
          { status: 403 }
        );
      }
      if (!usingServiceRole) {
        return NextResponse.json(
          {
            error:
              "Cancel/reschedule requires SUPABASE_SERVICE_ROLE_KEY on the server (anon clients cannot update bookings). Add it in Vercel → Environment Variables.",
          },
          { status: 503 }
        );
      }
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);

      // Email instructor
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const adminEmail = booking.instructor === "estee" ? "esteemarlowe@gmail.com" : (process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com");
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: `❌ Cancellation: ${booking.swimmer_name}`,
          html: `<p>The booking for ${booking.swimmer_name} has been cancelled by the customer.</p>`
        });
        
        if (booking.parent_email) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [booking.parent_email],
            subject: `Lesson Cancelled`,
            html: `<p>Your booking for ${booking.swimmer_name} has been cancelled.</p>`
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "reschedule") {
      if (!policyOk) {
        return NextResponse.json(
          {
            error:
              "Self-serve changes aren’t available within 7 days of your first lesson. Please email or call us for help.",
          },
          { status: 403 }
        );
      }
      if (!usingServiceRole) {
        return NextResponse.json(
          {
            error:
              "Reschedule requires SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel → Environment Variables.",
          },
          { status: 503 }
        );
      }
      if (booking.instructor === "lukaah" && newData.week_start && lukaahWeekOverlapsBlackout(newData.week_start)) {
        return NextResponse.json(
          { error: "That summer week is unavailable. Please pick a different week." },
          { status: 400 }
        );
      }

      // Validate slot availability
      let query = supabase.from("bookings").select("id").eq("status", "confirmed").eq("instructor", booking.instructor);
      if (booking.instructor === "lukaah") {
        query = query.eq("week_start", newData.week_start).eq("lesson_time", newData.lesson_time);
      } else {
        query = query.eq("month", newData.month);
      }
      
      const { data: conflicts } = await query;
      // We must ignore the current booking
      const realConflicts = (conflicts || []).filter(c => c.id !== id);

      if (booking.instructor === "lukaah" && realConflicts.length > 0) {
        return NextResponse.json({ error: "Slot no longer available" }, { status: 400 });
      }

      // If Estee, it's more complex to validate slot strictly on the backend since her days/times vary, 
      // but assuming the front-end fetched availability correctly, we update it.
      
      const { error: updateErr } = await supabase.from("bookings").update({
        week_start: newData.week_start || null,
        month: newData.month || null,
        day_of_week: newData.day_of_week || booking.day_of_week,
        lesson_time: newData.lesson_time || booking.lesson_time,
        second_day_time: newData.second_day_time || null,
        // Reset reminder since date changed
        reminder_sent: false
      }).eq("id", id);

      if (updateErr) throw updateErr;

      // Send email
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const adminEmail = booking.instructor === "estee" ? "esteemarlowe@gmail.com" : (process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com");
        const msg = `<p>${booking.swimmer_name}'s lesson has been rescheduled to:<br/><b>${scheduleText}</b><br/>${specificDays}</p>`;
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: `🔄 Rescheduled: ${booking.swimmer_name}`,
          html: msg
        });
        
        if (booking.parent_email) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [booking.parent_email],
            subject: `Lesson Rescheduled`,
            html: msg
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Manage API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
