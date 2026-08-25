import { NextResponse } from "next/server";
import { loadAvailabilitySettings } from "@/lib/availability-settings-server";

/** Public: booking wizard loads open months / hours / season. */
export async function GET() {
  try {
    const settings = await loadAvailabilitySettings();
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Availability GET error:", error);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
