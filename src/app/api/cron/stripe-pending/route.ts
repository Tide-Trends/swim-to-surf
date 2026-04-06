import { NextResponse } from "next/server";
import { reconcileAllPendingStripeSessions } from "@/lib/stripe-checkout-confirm";

export const runtime = "nodejs";

function cronOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Reconciles pending Stripe checkouts by calling the Stripe API (no webhooks):
 * - paid sessions → confirm bookings + emails (e.g. customer closed tab before success page)
 * - expired / past-expires open sessions → cancel pending rows
 *
 * Schedule in vercel.json (Hobby: once daily; Pro can use a tighter schedule). Protect with CRON_SECRET.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const origin = cronOrigin(req);
  const result = await reconcileAllPendingStripeSessions(origin);

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
