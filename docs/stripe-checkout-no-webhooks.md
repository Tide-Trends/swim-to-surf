# Stripe Checkout without webhooks

Card bookings use **Stripe Checkout**. Your app **does not use Stripe webhooks**. Finalization works in two ways:

## 1. Success redirect (primary)

After payment, Stripe sends the customer to:

`/book?checkout=success&session_id={CHECKOUT_SESSION_ID}`

The booking wizard calls **`GET /api/book/verify-session?session_id=...`**, which:

1. Retrieves the Checkout session from Stripe with your **secret key**
2. Checks `payment_status === "paid"`
3. Updates `pending_payment` rows to `confirmed` and sends confirmation emails (idempotent)

**Env vars (required):**

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Retrieve sessions and create Checkout |
| `NEXT_PUBLIC_SITE_URL` | Email links when the server has no browser host (production URL, no trailing slash) |

You do **not** need `STRIPE_WEBHOOK_SECRET` or a Dashboard webhook endpoint.

## 2. Cron reconciliation (backup)

Some customers pay and **close the tab** before the success page runs. A Vercel Cron job calls **`GET /api/cron/stripe-pending`** every 10 minutes (see `vercel.json`). It:

- Finds all `pending_payment` rows with a `stripe_checkout_session_id`
- For each session, calls the Stripe API: if **paid** → same confirm + emails as above; if **expired** (or open past `expires_at`) → marks those rows **cancelled**

**Auth:** Same as your other crons — `Authorization: Bearer $CRON_SECRET`. Vercel injects this automatically for scheduled invocations.

## Local testing

1. Complete a test Checkout; you should land on `/book` and see the success step.
2. Optional: hit the cron locally (with `CRON_SECRET` in `.env.local`):

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/stripe-pending
```

## Optional: remove old Stripe webhook

If you previously added `https://your-domain/api/webhooks/stripe` in the Stripe Dashboard, you can **delete that endpoint** — this codebase no longer exposes it.
