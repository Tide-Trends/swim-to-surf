/**
 * Stripe integration placeholder.
 *
 * To enable Stripe payments:
 * 1. npm install stripe @stripe/stripe-js
 * 2. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY in .env.local
 * 3. Set FEATURES.stripeEnabled = true in lib/constants.ts
 * 4. Uncomment the PaymentSection in step-confirm.tsx
 * 5. Wire up /api/create-checkout to create Stripe Checkout sessions
 */

export function getStripeConfig() {
  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    isConfigured: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY
    ),
  };
}
