import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  formatPrice,
  lessonDurationMinutesForSwimmer,
} from "@/lib/constants";
import {
  esteeProposalConflicts,
  lukaahProposalConflicts,
  type BookingSlotRow,
} from "@/lib/booking-slots";
import {
  computeScheduleEmailFields,
  FROM_EMAIL,
  resendApiKeyConfigured,
  sendBookingEmails,
  shouldUseGmailForBookingEmails,
  type SwimmerPayload,
} from "@/lib/booking-emails";
import { expireStripeCheckoutSession } from "@/lib/stripe-checkout-confirm";
import { lukaahWeekOverlapsBlackout } from "@/lib/lukaah-availability";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      instructor: "lukaah" | "estee";
      swimmers?: Array<{
        swimmerName: string;
        swimmerAge: number;
        swimmerMonths?: number;
        lessonTier?: "auto" | "infant" | "standard";
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        notes?: string;
      }>;
      swimmerInfo?: {
        swimmerName: string;
        swimmerAge: number;
        swimmerMonths?: number;
        lessonTier?: "auto" | "infant" | "standard";
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        notes?: string;
      };
      /** One schedule per swimmer (week/month/pattern may differ per swimmer). */
      schedules?: ScheduleSelection[];
      /** @deprecated single-schedule; use schedules */
      schedule?: ScheduleSelection;
      priceInfo: { duration?: number; price: number; totalLessons: number };
      paymentMethod: string;
    };

    const { instructor, priceInfo, paymentMethod } = body;

    const schedulesList: ScheduleSelection[] =
      Array.isArray(body.schedules) && body.schedules.length > 0
        ? body.schedules
        : body.schedule
          ? [body.schedule]
          : [];

    const swimmersList =
      Array.isArray(body.swimmers) && body.swimmers.length > 0
        ? body.swimmers
        : body.swimmerInfo
          ? [body.swimmerInfo]
          : [];

    if (swimmersList.length === 0) {
      return NextResponse.json({ error: "Swimmer details are required." }, { status: 400 });
    }

    if (schedulesList.length !== swimmersList.length) {
      return NextResponse.json(
        { error: "Each swimmer needs a schedule (times can differ). Please go back to the schedule step." },
        { status: 400 }
      );
    }

    const firstSch = schedulesList[0]!;
    for (const sch of schedulesList) {
      if (instructor === "lukaah" && sch.type !== "weekly") {
        return NextResponse.json({ error: "Invalid schedule type for Lukaah." }, { status: 400 });
      }
      if (instructor === "estee" && sch.type !== "monthly") {
        return NextResponse.json({ error: "Invalid schedule type for Estee." }, { status: 400 });
      }
      if (sch.type === "weekly" && lukaahWeekOverlapsBlackout(sch.weekStart)) {
        return NextResponse.json(
          {
            error:
              "That summer week is unavailable (instructor away). Please choose a different week.",
          },
          { status: 400 }
        );
      }
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const supabase = getSupabaseServerClient();
    const canPersist = Boolean(supabase);

    const hasResend = resendApiKeyConfigured();
    const resend = hasResend ? new Resend(process.env.RESEND_API_KEY!.trim()) : null;
    const bookViaGmail = shouldUseGmailForBookingEmails();
    if (bookViaGmail) {
      console.log(
        "[book] Confirmations will use Gmail SMTP (set by GMAIL_USER + GMAIL_APP_PASSWORD; avoids Resend domain verification)."
      );
    } else {
      if (!hasResend) {
        console.warn(
          "No booking email transport: set GMAIL_USER + GMAIL_APP_PASSWORD (Gmail App Password) or RESEND_API_KEY."
        );
      }
      if (FROM_EMAIL.includes("resend.dev")) {
        console.warn(
          "[Resend] resend.dev \"from\" limits who receives mail — add Gmail App Password env vars so confirmations use SMTP."
        );
      }
    }

    const n = swimmersList.length;

    const instKey = instructor as "lukaah" | "estee";
    const expectedTotalLessons = schedulesList.reduce((sum, sch) => {
      if (sch.type === "weekly") return sum + 5;
      return sum + (sch.secondDay && sch.secondDayTime ? 8 : 4);
    }, 0);

    if (expectedTotalLessons !== priceInfo.totalLessons) {
      return NextResponse.json(
        { error: "Lesson count does not match. Please refresh and try again." },
        { status: 400 }
      );
    }

    let expectedTotalCents = 0;
    for (let i = 0; i < n; i++) {
      const s = swimmersList[i]!;
      const sch = schedulesList[i]!;
      const tier = effectiveLessonTier(s.swimmerAge, s.lessonTier ?? "auto");
      const base = instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
      if (sch.type === "weekly") {
        expectedTotalCents += base.price;
      } else if (sch.type === "monthly") {
        expectedTotalCents += sch.secondDay && sch.secondDayTime ? base.price * 2 : base.price;
      }
    }

    const durationSummary =
      n === 1
        ? `${lessonDurationMinutesForSwimmer(instKey, swimmersList[0]!)} min`
        : swimmersList
            .map((s) => `${s.swimmerName}: ${lessonDurationMinutesForSwimmer(instKey, s)} min`)
            .join(" · ");

    if (Math.abs(expectedTotalCents - priceInfo.price) > 1) {
      return NextResponse.json(
        { error: `Price mismatch (expected ${formatPrice(expectedTotalCents)}). Please refresh and try again.` },
        { status: 400 }
      );
    }

    if (paymentMethod === "stripe" && !canPersist) {
      return NextResponse.json(
        {
          error:
            "Online checkout requires the database to be configured. Use pay later or set NEXT_PUBLIC_SUPABASE_URL and a Supabase key on the server.",
        },
        { status: 400 }
      );
    }

    let bookingIds: string[] = [];
    let stripeCheckoutUrl: string | null = null;
    const nowIso = new Date().toISOString();

    if (canPersist && supabase) {
      let existing: BookingSlotRow[] = [];

      if (firstSch.type === "weekly") {
        const weekSet = [...new Set(schedulesList.filter((s) => s.type === "weekly").map((s) => s.weekStart))];
        for (const wk of weekSet) {
          const { data: conf, error: cErr } = await supabase
            .from("bookings")
            .select("lesson_time, week_start, lesson_duration")
            .eq("instructor", instructor)
            .eq("week_start", wk)
            .eq("status", "confirmed");
          if (cErr) {
            console.error("Slot check error:", cErr);
            return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
          }
          const { data: held, error: hErr } = await supabase
            .from("bookings")
            .select("lesson_time, week_start, lesson_duration")
            .eq("instructor", instructor)
            .eq("week_start", wk)
            .eq("status", "pending_payment")
            .gt("payment_hold_expires_at", nowIso);
          if (hErr) {
            console.error("Slot hold check error:", hErr);
            return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
          }
          existing = [...existing, ...((conf || []) as BookingSlotRow[]), ...((held || []) as BookingSlotRow[])];
        }
      } else {
        const monthSet = [...new Set(schedulesList.filter((s) => s.type === "monthly").map((s) => s.month))];
        for (const mo of monthSet) {
          const { data: conf, error: cErr } = await supabase
            .from("bookings")
            .select("lesson_time, second_day_time, day_of_week, lesson_duration, month")
            .eq("instructor", "estee")
            .eq("month", mo)
            .eq("status", "confirmed");
          if (cErr) {
            console.error("Slot check error:", cErr);
            return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
          }
          const { data: held, error: hErr } = await supabase
            .from("bookings")
            .select("lesson_time, second_day_time, day_of_week, lesson_duration, month")
            .eq("instructor", "estee")
            .eq("month", mo)
            .eq("status", "pending_payment")
            .gt("payment_hold_expires_at", nowIso);
          if (hErr) {
            console.error("Slot hold check error:", hErr);
            return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
          }
          existing = [...existing, ...((conf || []) as BookingSlotRow[]), ...((held || []) as BookingSlotRow[])];
        }
      }

      const pool: BookingSlotRow[] = [...existing];

      for (let i = 0; i < n; i++) {
        const sch = schedulesList[i]!;
        const s = swimmersList[i]!;
        const durI = lessonDurationMinutesForSwimmer(instKey, s);
        if (sch.type === "weekly") {
          if (lukaahProposalConflicts(pool, sch.weekStart, sch.time, durI)) {
            return NextResponse.json(
              { error: "That time slot was just booked for this week. Please pick another time." },
              { status: 409 }
            );
          }
          pool.push({
            lesson_time: sch.time,
            week_start: sch.weekStart,
            lesson_duration: durI,
            day_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            second_day_time: null,
          });
        } else {
          if (esteeProposalConflicts(pool, sch, durI)) {
            return NextResponse.json(
              { error: "One of those times is no longer available this month. Please choose different times." },
              { status: 409 }
            );
          }
          pool.push({
            lesson_time: sch.primaryTime,
            second_day_time: sch.secondDay && sch.secondDayTime ? sch.secondDayTime : null,
            day_of_week:
              sch.secondDay && sch.secondDayTime
                ? [sch.primaryDay, sch.primaryDay === "wednesday" ? "thursday" : "wednesday"]
                : [sch.primaryDay],
            month: sch.month,
            lesson_duration: durI,
          });
        }
      }

      const stripeDescription =
        n > 1 ? `${n} swimmers · ${priceInfo.totalLessons} lessons total` : `${priceInfo.totalLessons} lessons`;

      let checkoutSessionId: string | null = null;
      let holdExpiresIso: string | null = null;

      if (paymentMethod === "stripe") {
        const sk = process.env.STRIPE_SECRET_KEY?.trim();
        const hasStripe = Boolean(sk && sk !== "sk_test_placeholder" && sk.length > 20);
        if (!hasStripe) {
          return NextResponse.json({ error: "Card payments not configured. Please use pay later." }, { status: 400 });
        }
        try {
          const stripe = new Stripe(sk!, {
            apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
          });
          const feePercent = 0.035;
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
                    description: `${stripeDescription} (includes $${(feeAmountCents / 100).toFixed(2)} processing fee). Card or Apple Pay in checkout.`,
                  },
                  unit_amount: priceWithFeeCents,
                },
                quantity: 1,
              },
            ],
            metadata: { instructor, swimmer_count: String(n) },
            success_url: `${origin}/book?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/book?canceled=true`,
          });
          checkoutSessionId = session.id;
          holdExpiresIso = new Date(session.expires_at * 1000).toISOString();
          stripeCheckoutUrl = session.url;
        } catch (stripeErr: unknown) {
          const errMsg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
          console.error("Stripe Checkout create error:", errMsg, stripeErr);
          return NextResponse.json({ error: `Could not start checkout: ${errMsg}` }, { status: 400 });
        }
      }

      const insertStatus = paymentMethod === "stripe" ? "pending_payment" : "confirmed";
      const createdIds: string[] = [];

      try {
        for (let i = 0; i < n; i++) {
          const s = swimmersList[i]!;
          const sch = schedulesList[i]!;
          const tier = effectiveLessonTier(s.swimmerAge, s.lessonTier ?? "auto");
          const tierNote =
            s.lessonTier && s.lessonTier !== "auto" ? `Lesson tier: ${tier} (manual: ${s.lessonTier})` : "";
          const notesCombined =
            [
              s.swimmerAge === 0 && typeof s.swimmerMonths === "number"
                ? `Age detail: ${s.swimmerMonths} months`
                : "",
              tierNote,
              s.notes || "",
            ]
              .filter(Boolean)
              .join(" | ") || null;

          const lessonTime = sch.type === "weekly" ? sch.time : sch.primaryTime;
          const secondT = sch.type === "monthly" && sch.secondDay && sch.secondDayTime ? sch.secondDayTime : null;

          const base = instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
          const perSwimmerPrice =
            sch.type === "weekly" ? base.price : sch.secondDay ? base.price * 2 : base.price;
          const durInsert = lessonDurationMinutesForSwimmer(instKey, s);
          const lessonsThisSwimmer =
            sch.type === "weekly" ? 5 : sch.secondDay && sch.secondDayTime ? 8 : 4;

          const { data: booking, error: dbError } = await supabase
            .from("bookings")
            .insert({
              instructor,
              swimmer_name: s.swimmerName,
              swimmer_age: s.swimmerAge,
              lesson_duration: durInsert,
              parent_name: s.parentName || "Adult Swimmer",
              parent_email: s.parentEmail?.trim() || "",
              parent_phone: s.parentPhone?.trim() || "",
              notes: notesCombined,
              status: insertStatus,
              stripe_checkout_session_id: checkoutSessionId,
              payment_hold_expires_at: holdExpiresIso,
              price: perSwimmerPrice,
              total_lessons: lessonsThisSwimmer,
              month: sch.type === "monthly" ? sch.month : null,
              week_start: sch.type === "weekly" ? sch.weekStart : null,
              day_of_week:
                sch.type === "weekly"
                  ? ["monday", "tuesday", "wednesday", "thursday", "friday"]
                  : sch.secondDay
                    ? [sch.primaryDay, sch.primaryDay === "wednesday" ? "thursday" : "wednesday"]
                    : [sch.primaryDay],
              lesson_time: lessonTime,
              second_day_time: secondT,
            })
            .select("id")
            .single();

          if (dbError || !booking) {
            throw dbError || new Error("insert failed");
          }
          createdIds.push(booking.id);
        }
      } catch (dbError: unknown) {
        console.error("Supabase Error:", dbError);
        if (createdIds.length > 0) {
          await supabase.from("bookings").delete().in("id", createdIds);
        }
        if (checkoutSessionId) {
          await expireStripeCheckoutSession(checkoutSessionId);
        }
        const code = dbError && typeof dbError === "object" && "code" in dbError ? String(dbError.code) : "";
        const msg = dbError instanceof Error ? dbError.message : String(dbError);
        if (
          code === "23505" ||
          msg.includes("duplicate") ||
          msg.includes("just booked") ||
          msg.includes("no longer available") ||
          msg.includes("overlaps")
        ) {
          return NextResponse.json(
            { error: "That time slot was just taken. Please pick another time." },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: "Failed to save booking. Please try again." }, { status: 400 });
      }

      bookingIds = createdIds;
    } else {
      console.warn(
        "⚠ Supabase not configured — booking not persisted. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
      );
      if (paymentMethod === "stripe") {
        return NextResponse.json({ error: "Database required for card checkout." }, { status: 400 });
      }
      bookingIds = swimmersList.map(() => crypto.randomUUID());
    }

    const persisted = canPersist;

    const calendarDuration = lessonDurationMinutesForSwimmer(instKey, swimmersList[0]!);
    const { instructorName, scheduleText, specificDays, calendarLink } = computeScheduleEmailFields(
      instructor as "lukaah" | "estee",
      firstSch as ScheduleSelection,
      { duration: calendarDuration }
    );
    const priceFormatted = `$${(priceInfo.price / 100).toFixed(2)}`;

    const emailPayload = {
      resend,
      bookingIds,
      swimmers: swimmersList as SwimmerPayload[],
      instructor,
      instructorName,
      scheduleText,
      specificDays,
      calendarLink,
      priceFormatted,
      priceInfo: {
        ...priceInfo,
        duration: calendarDuration,
        durationSummary,
      },
      paymentMethod,
      origin,
    };

    if (paymentMethod === "stripe") {
      if (!stripeCheckoutUrl) {
        return NextResponse.json({ error: "Checkout could not be created. Please try again." }, { status: 500 });
      }
      return NextResponse.json({
        url: stripeCheckoutUrl,
        id: bookingIds[0]!,
        bookingIds,
        persisted,
        paymentPending: true,
        customerEmailSent: false,
        adminEmailSent: false,
        message:
          "Complete payment in Stripe. Your spots are held until checkout expires; confirmation emails send after payment succeeds.",
      });
    }

    const { customerEmailSent, adminEmailSent } = await sendBookingEmails(emailPayload);

    return NextResponse.json({
      id: bookingIds[0]!,
      bookingIds,
      persisted,
      customerEmailSent,
      adminEmailSent,
    });
  } catch (error) {
    console.error("Booking handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

