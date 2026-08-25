import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  defaultAvailabilitySettings,
  mergeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/lib/availability-settings";

export async function loadAvailabilitySettings(): Promise<AvailabilitySettings> {
  const base = defaultAvailabilitySettings();
  const supabase = getSupabaseServerClient();
  if (!supabase) return base;

  try {
    const { data, error } = await supabase
      .from("availability_settings")
      .select("settings")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      // Table may not exist yet — fall back to defaults.
      console.warn("[availability] load failed, using defaults:", error.message);
      return base;
    }

    return mergeAvailabilitySettings(base, (data?.settings as Partial<AvailabilitySettings>) ?? null);
  } catch (e) {
    console.warn("[availability] load exception, using defaults:", e);
    return base;
  }
}

export async function saveAvailabilitySettings(
  settings: AvailabilitySettings
): Promise<{ ok: true } | { ok: false; error: string; needsMigration?: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }

  const { error } = await supabase.from("availability_settings").upsert({
    id: "default",
    settings,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    const msg = error.message || "Failed to save";
    const needsMigration =
      /relation .*availability_settings.* does not exist/i.test(msg) ||
      /Could not find the table/i.test(msg);
    return { ok: false, error: msg, needsMigration };
  }

  return { ok: true };
}
