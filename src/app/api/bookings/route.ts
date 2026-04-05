import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instructor = searchParams.get("instructor");
  const weekStart = searchParams.get("week_start");
  const month = searchParams.get("month");
  const status = searchParams.get("status") || "confirmed";

  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL 
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url"
    && process.env.SUPABASE_SERVICE_ROLE_KEY
    && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-supabase-anon-key";

  if (!hasSupabase) {
    // Return empty array — no bookings yet, all time slots are available
    return NextResponse.json([]);
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let query = supabase
    .from("bookings")
    .select("lesson_time, second_day_time, day_of_week, week_start, month")
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
