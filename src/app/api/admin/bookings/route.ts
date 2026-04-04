import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instructor = searchParams.get("instructor");

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL 
      && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (instructor && instructor !== "all") {
      query = query.eq("instructor", instructor);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
