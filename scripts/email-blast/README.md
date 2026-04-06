# Booking announcement email (free via Resend)

Uses the same **[Resend](https://resend.com)** account as the site. Free tier is typically **3,000 emails/month** — enough for 500+ recipients in one campaign if you haven’t used the quota elsewhere.

## Before you send

1. **Verify your domain** in Resend (DNS records) so `RESEND_FROM_EMAIL` is something like `Swim To Surf <hello@swimtosurf.co>`, not `onboarding@resend.dev` (test addresses are limited).
2. Copy **`cleaned_emails.csv`** somewhere accessible (or point `--csv` at `~/Downloads/cleaned_emails.csv`).
3. Ensure **`RESEND_API_KEY`** is set (same as Vercel / `.env.local`).

## Commands

From the **project root** (`swim-to-surf/`):

```bash
# Preview (no send)
node scripts/email-blast/send-announcement.mjs --dry-run --csv ~/Downloads/cleaned_emails.csv

# One test email to yourself
node scripts/email-blast/send-announcement.mjs --csv ~/Downloads/cleaned_emails.csv --to you@yourdomain.com

# Send to everyone in the CSV
node scripts/email-blast/send-announcement.mjs --csv ~/Downloads/cleaned_emails.csv --send
```

## Files

- **`announcement.html`** — HTML body (edit copy/design here).
- **`send-announcement.mjs`** — reads CSV, dedupes emails, sends in batches of 100 via `resend.batch.send`.

## Legal / polite use

Only send to people who agreed to hear from you (customers, waitlist, etc.). The template includes a simple reply-to **UNSUBSCRIBE** line.
