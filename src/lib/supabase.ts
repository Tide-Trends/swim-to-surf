import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-supabase-url") {
    // Return a mock client during build or when not configured
    return createMockClient();
  }

  _client = createClient<Database>(url, key);
  return _client;
}

export const supabase = typeof window !== "undefined" ? getSupabase() : (null as unknown as SupabaseClient<Database>);

export function createServerSupabase() {
  return getSupabase();
}

function createMockClient(): SupabaseClient<Database> {
  const mockResponse = { data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } };
  const chainable: Record<string, unknown> = {};
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      if (prop === "data") return null;
      if (prop === "error") return mockResponse.error;
      return new Proxy(() => chainable, handler);
    },
    apply: () => new Proxy(chainable, handler),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({} as any, handler) as SupabaseClient<Database>;
}
