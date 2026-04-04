import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * Stripe Checkout session creation endpoint.
 *
 * To enable:
 * 1. npm install stripe
 * 2. Set STRIPE_SECRET_KEY in .env.local
 * 3. Uncomment the Stripe logic below
 */
export async function POST(request: Request) {
  const config = getStripeConfig();

  if (!config.isConfigured) {
    return NextResponse.json(
      { error: "Stripe is not configured. Payments are handled offline." },
      { status: 501 }
    );
  }


  const stripe = new Stripe(config.secretKey);
  const body = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Swim Lessons — ${body.swimmerName} with ${body.instructorName}`,
          description: `${body.totalLessons} lessons, ${body.duration} minutes each`,
        },
        unit_amount: body.price,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/book`,
    metadata: { bookingId: body.bookingId },
  });

  return NextResponse.json({ url: session.url });

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
