import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instructor = searchParams.get("instructor");
  const weekStart = searchParams.get("week_start");
  const month = searchParams.get("month");
  const status = searchParams.get("status") || "confirmed";

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from("bookings")
    .select("lesson_time, second_day_time, day_of_week, week_start, month, lesson_duration")
    .eq("status", status);

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
