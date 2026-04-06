# Booking announcement email (free options)

The HTML template here works with **any** tool you use to send. The script uses **[Resend](https://resend.com)** (same as the site). Free tier is typically **3,000 emails/month** — enough for 500+ recipients if you haven’t used the quota elsewhere.

## Domain on Wix and you can’t add DNS until later?

Resend (and most senders) need **DNS records** (TXT/CNAME) to send “from” `@swimtosurf.co`. If Wix won’t let you change DNS until June, you have three practical paths:

### A) Use Wix’s own email marketing (often easiest)

If the site lives on **Wix**, open the **Wix dashboard → Marketing → Email marketing** (name may vary). Import your CSV or paste contacts, paste the contents of **`announcement.html`** into a campaign (or recreate the blocks), and send from **Wix** so you don’t touch Resend DNS at all.

### B) Resend with a domain you *can* verify (temporary sender)

1. Use any domain where **you control DNS** (cheap extra domain, a subdomain on Cloudflare, etc.).
2. Add that domain in Resend and complete verification.
3. Set in `.env.local`:
   - `RESEND_FROM_EMAIL=Swim To Surf <hello@yourverifieddomain.com>`
   - `RESEND_REPLY_TO=you@gmail.com` (or the inbox you actually read — replies go here even though “from” is the other domain)

Then run the script as below. Recipients still tap **swimtosurf.co** in the email body; only the technical “from” address changes until June.

### C) Another free ESP (no code)

**[Brevo](https://www.brevo.com)** (free tier includes daily limits) and similar tools let you upload a **list + HTML** in the browser. Paste **`announcement.html`**, send a test, then the full list — no Resend domain needed.

---

## Before you send (Resend script)

1. **`RESEND_API_KEY`** in `.env.local` (same as Vercel).
2. **`RESEND_FROM_EMAIL`** — must use a **verified** domain in Resend (not `onboarding@resend.dev` for a real blast). Use option **B** above if `swimtosurf.co` is blocked on Wix.
3. Optional: **`RESEND_REPLY_TO`** — where replies should go.
4. Point `--csv` at **`cleaned_emails.csv`** (or your export path).

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
