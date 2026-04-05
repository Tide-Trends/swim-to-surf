import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function cleanUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!u || u.includes("your-supabase")) return null;
  return u;
}

/**
 * Server-side Supabase: prefers service role (admin, manage, cancel).
 * Falls back to anon key so booking + public slot reads work when only NEXT_PUBLIC_SUPABASE_ANON_KEY is set on Vercel.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = cleanUrl();
  if (!url) return null;

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (service && service.length > 30 && !service.includes("your-supabase")) {
    return createClient(url, service);
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon && anon.length > 30) {
    console.warn(
      "[Supabase] Using ANON key on server: booking & slot checks work if RLS allows. Add SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role) for admin dashboard, manage page, and cancel/cron."
    );
    return createClient(url, anon);
  }

  return null;
}

export function hasSupabaseServerConfig(): boolean {
  const url = cleanUrl();
  if (!url) return false;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const hasService = Boolean(service && service.length > 30 && !service.includes("your-supabase"));
  const hasAnon = Boolean(anon && anon.length > 30);
  return hasService || hasAnon;
}
