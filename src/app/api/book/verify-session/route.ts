import { NextResponse } from "next/server";
import {
  promotePaidCheckoutSession,
  verifyStripeCheckoutPaid,
} from "@/lib/stripe-checkout-confirm";

function requestOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Called from the booking success page after Stripe redirects with ?session_id=...
 * Confirms payment with Stripe, promotes pending rows to confirmed, sends emails (idempotent with webhook).
 */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "session_id is required" }, { status: 400 });
  }

  const paid = await verifyStripeCheckoutPaid(sessionId);
  if (!paid) {
    return NextResponse.json(
      { ok: false, reason: "not_paid", error: "Payment is not complete yet." },
      { status: 402 }
    );
  }

  const origin = requestOrigin(req);
  const result = await promotePaidCheckoutSession(sessionId, origin);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason || "unknown", error: "Could not finalize booking." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    bookingIds: result.bookingIds,
    instructor: result.instructor,
    swimmers: result.swimmers,
    schedules: result.schedules,
    customerEmailSent: result.customerEmailSent,
    adminEmailSent: result.adminEmailSent,
  });
}
