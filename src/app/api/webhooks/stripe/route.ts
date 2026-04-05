import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cancelPendingCheckoutSession, promotePaidCheckoutSession } from "@/lib/stripe-checkout-confirm";

export const runtime = "nodejs";

function webhookOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "https://localhost";
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!sig || !whsec) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET or stripe-signature missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  if (!sk || sk.length < 20) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(sk, { apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whsec);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const origin = webhookOrigin();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await promotePaidCheckoutSession(session.id, origin);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await cancelPendingCheckoutSession(session.id);
    }
  } catch (e) {
    console.error("[stripe webhook] handler error", event.type, e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
