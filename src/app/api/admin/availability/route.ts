import { NextResponse } from "next/server";
import {
  defaultAvailabilitySettings,
  mergeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/lib/availability-settings";
import { loadAvailabilitySettings, saveAvailabilitySettings } from "@/lib/availability-settings-server";

export async function GET() {
  try {
    const settings = await loadAvailabilitySettings();
    return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin availability GET error:", error);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<AvailabilitySettings>;
    const merged = mergeAvailabilitySettings(defaultAvailabilitySettings(), body);
    const result = await saveAvailabilitySettings(merged);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          needsMigration: result.needsMigration ?? false,
          migrationHint:
            result.needsMigration
              ? "Run supabase-migrations/007_availability_settings.sql in the Supabase SQL editor, then try Save again."
              : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(merged);
  } catch (error) {
    console.error("Admin availability PUT error:", error);
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
  }
}
