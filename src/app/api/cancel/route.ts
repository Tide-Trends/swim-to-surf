import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
