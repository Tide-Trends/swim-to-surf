import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const SLOT_SELECT =
  "lesson_time, second_day_time, day_of_week, week_start, month, lesson_duration";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instructor = searchParams.get("instructor");
  const weekStart = searchParams.get("week_start");
  const month = searchParams.get("month");
  const status = searchParams.get("status") || "confirmed";
  const availability = searchParams.get("availability");

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  if (availability === "1" || availability === "true") {
    const now = new Date().toISOString();
    let qConfirmed = supabase.from("bookings").select(SLOT_SELECT).eq("status", "confirmed");
    let qHeld = supabase
      .from("bookings")
      .select(SLOT_SELECT)
      .eq("status", "pending_payment")
      .gt("payment_hold_expires_at", now);

    if (instructor) {
      qConfirmed = qConfirmed.eq("instructor", instructor as "lukaah" | "estee");
      qHeld = qHeld.eq("instructor", instructor as "lukaah" | "estee");
    }
    if (weekStart) {
      qConfirmed = qConfirmed.eq("week_start", weekStart);
      qHeld = qHeld.eq("week_start", weekStart);
    }
    if (month) {
      qConfirmed = qConfirmed.eq("month", month);
      qHeld = qHeld.eq("month", month);
    }

    const [{ data: confirmed, error: e1 }, { data: held, error: e2 }] = await Promise.all([
      qConfirmed,
      qHeld,
    ]);

    if (e1 || e2) {
      console.error("Bookings availability fetch error:", e1 || e2);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }

    return NextResponse.json([...(confirmed || []), ...(held || [])]);
  }

  let query = supabase.from("bookings").select(SLOT_SELECT).eq("status", status);

  if (instructor) query = query.eq("instructor", instructor as "lukaah" | "estee");
  if (weekStart) query = query.eq("week_start", weekStart);
  if (month) query = query.eq("month", month);

  const { data, error } = await query;

  if (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
