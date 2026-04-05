import Stripe from "stripe";
import { Resend } from "resend";
import type { ScheduleSelection, SwimmerInfo } from "@/lib/booking-schema";
import { lessonDurationMinutesForSwimmer } from "@/lib/constants";
import {
  computeScheduleEmailFields,
  resendApiKeyConfigured,
  sendBookingEmails,
  type SwimmerPayload,
} from "@/lib/booking-emails";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type BookingRow = {
  id: string;
  instructor: string;
  swimmer_name: string;
  swimmer_age: number;
  lesson_duration: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  notes: string | null;
  day_of_week: string[];
  lesson_time: string;
  second_day_time: string | null;
  week_start: string | null;
  month: string | null;
  total_lessons: number;
  price: number;
  status: string;
  stripe_checkout_session_id: string | null;
};

function normalizeTime(t: string): string {
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

export function rowToSchedule(row: BookingRow): ScheduleSelection {
  if (row.week_start) {
    return { type: "weekly", weekStart: row.week_start, time: normalizeTime(row.lesson_time) };
  }
  const primaryDay = row.day_of_week[0] === "thursday" ? "thursday" : "wednesday";
  return {
    type: "monthly",
    month: row.month!,
    primaryDay,
    primaryTime: normalizeTime(row.lesson_time),
    secondDay: Boolean(row.second_day_time),
    secondDayTime: row.second_day_time ? normalizeTime(row.second_day_time) : null,
  };
}

function rowsToSwimmerPayloads(rows: BookingRow[]): SwimmerPayload[] {
  return rows.map((r) => ({
    swimmerName: r.swimmer_name,
    swimmerAge: r.swimmer_age,
    parentName: rows[0]!.parent_name,
    parentEmail: rows[0]!.parent_email,
    parentPhone: rows[0]!.parent_phone,
    notes: r.notes ?? undefined,
  }));
}

function rowsToSwimmerInfo(rows: BookingRow[]): SwimmerInfo[] {
  const p0 = rows[0]!;
  return rows.map((r) => ({
    swimmerName: r.swimmer_name,
    swimmerAge: r.swimmer_age,
    lessonTier: "auto",
    parentName: p0.parent_name,
    parentEmail: p0.parent_email,
    parentPhone: p0.parent_phone,
    notes: r.notes ?? undefined,
  }));
}

/**
 * After Stripe reports payment, flip pending rows to confirmed and send emails once.
 * Idempotent: if rows are already confirmed, skips update and email.
 */
export async function promotePaidCheckoutSession(
  checkoutSessionId: string,
  origin: string
): Promise<{
  ok: boolean;
  reason?: string;
  bookingIds: string[];
  customerEmailSent: boolean;
  adminEmailSent: boolean;
  instructor?: "lukaah" | "estee";
  swimmers?: SwimmerInfo[];
  schedules?: ScheduleSelection[];
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "no_database", bookingIds: [], customerEmailSent: false, adminEmailSent: false };
  }

  const { data: group, error: selErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .order("created_at", { ascending: true });

  if (selErr || !group?.length) {
    console.error("[stripe confirm] no rows for session", checkoutSessionId, selErr);
    return { ok: false, reason: "not_found", bookingIds: [], customerEmailSent: false, adminEmailSent: false };
  }

  const rows = group as unknown as BookingRow[];
  const bookingIds = rows.map((r) => r.id);
  const allConfirmed = rows.every((r) => r.status === "confirmed");

  if (allConfirmed) {
    const instructor = rows[0]!.instructor as "lukaah" | "estee";
    return {
      ok: true,
      bookingIds,
      customerEmailSent: true,
      adminEmailSent: true,
      instructor,
      swimmers: rowsToSwimmerInfo(rows),
      schedules: rows.map(rowToSchedule),
    };
  }

  const { data: updated, error: upErr } = await supabase
    .from("bookings")
    .update({ status: "confirmed", payment_hold_expires_at: null })
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .eq("status", "pending_payment")
    .select("id");

  if (upErr) {
    console.error("[stripe confirm] update failed", upErr);
    return { ok: false, reason: "update_failed", bookingIds, customerEmailSent: false, adminEmailSent: false };
  }

  if (!updated?.length) {
    const instructor = rows[0]!.instructor as "lukaah" | "estee";
    return {
      ok: true,
      bookingIds,
      customerEmailSent: true,
      adminEmailSent: true,
      instructor,
      swimmers: rowsToSwimmerInfo(rows),
      schedules: rows.map(rowToSchedule),
    };
  }

  const { data: fresh } = await supabase.from("bookings").select("*").in("id", bookingIds).order("created_at", { ascending: true });

  const freshRows = (fresh || rows) as unknown as BookingRow[];
  const instructor = freshRows[0]!.instructor as "lukaah" | "estee";
  const instKey = instructor;
  const schedules = freshRows.map(rowToSchedule);
  const firstSch = schedules[0]!;
  const swimmersPayload = rowsToSwimmerPayloads(freshRows);
  const totalPrice = freshRows.reduce((s, r) => s + r.price, 0);
  const durationSummary =
    freshRows.length === 1
      ? `${freshRows[0]!.lesson_duration} min`
      : freshRows.map((r) => `${r.swimmer_name}: ${r.lesson_duration} min`).join(" · ");
  const calendarDuration = lessonDurationMinutesForSwimmer(instKey, {
    swimmerAge: freshRows[0]!.swimmer_age,
    lessonTier: "auto",
  });

  const { instructorName, scheduleText, specificDays, calendarLink } = computeScheduleEmailFields(
    instructor,
    firstSch,
    { duration: calendarDuration }
  );

  const hasResend = resendApiKeyConfigured();
  const resend = hasResend ? new Resend(process.env.RESEND_API_KEY!.trim()) : null;

  const { customerEmailSent, adminEmailSent } = await sendBookingEmails({
    resend,
    bookingIds,
    swimmers: swimmersPayload,
    instructor,
    instructorName,
    scheduleText,
    specificDays,
    calendarLink,
    priceFormatted: `$${(totalPrice / 100).toFixed(2)}`,
    priceInfo: {
      totalLessons: freshRows[0]!.total_lessons,
      price: totalPrice,
      duration: calendarDuration,
      durationSummary,
    },
    paymentMethod: "stripe",
    origin,
  });

  return {
    ok: true,
    bookingIds,
    customerEmailSent,
    adminEmailSent,
    instructor,
    swimmers: rowsToSwimmerInfo(freshRows),
    schedules,
  };
}

export async function cancelPendingCheckoutSession(checkoutSessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .eq("status", "pending_payment");
}

export async function verifyStripeCheckoutPaid(sessionId: string): Promise<boolean> {
  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  if (!sk || sk === "sk_test_placeholder" || sk.length < 20) return false;
  const stripe = new Stripe(sk, { apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === "paid";
}

export async function expireStripeCheckoutSession(sessionId: string): Promise<void> {
  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  if (!sk || sk === "sk_test_placeholder" || sk.length < 20) return;
  try {
    const stripe = new Stripe(sk, { apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion });
    await stripe.checkout.sessions.expire(sessionId);
  } catch (e) {
    console.warn("[stripe] expire session failed (may already be used)", sessionId, e);
  }
}
