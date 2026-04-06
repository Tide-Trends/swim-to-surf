# Booking announcement email (free options)

The HTML template **`announcement.html`** works with **any** tool. Pick one path below.

---

## Brevo (best if Gmail “App Password” is disabled) — **no DNS, no app password**

Google often **won’t allow App Passwords** (Workspace rules, account type, etc.). **Brevo** (free) uses a normal **API key** and you only **verify your Gmail in their dashboard** (they email you a link — click it).

- **Free tier:** **300 emails per day** (then run again tomorrow with `--sent-log`).
- **Setup:**
  1. Sign up: [brevo.com](https://www.brevo.com)
  2. **Senders** → add `swimtosurfemail@gmail.com` → confirm the email from your inbox.
  3. **Settings → SMTP & API → API keys** → create key → copy (starts with `xkeysib-`).

**`.env.local`:**

```env
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=swimtosurfemail@gmail.com
```

Optional: `BREVO_SENDER_NAME=Swim To Surf`

```bash
npm run email:announce:brevo -- --dry-run --csv ~/Downloads/cleaned_emails.csv
npm run email:announce:brevo -- --csv ~/Downloads/cleaned_emails.csv --to YOUR@gmail.com --send
# Day 1: up to 300
npm run email:announce:brevo -- --csv ~/Downloads/cleaned_emails.csv --send --limit 300 --sent-log scripts/email-blast/sent-brevo.log
# Day 2: skips addresses in the log
npm run email:announce:brevo -- --csv ~/Downloads/cleaned_emails.csv --send --sent-log scripts/email-blast/sent-brevo.log
```

Script: **`send-via-brevo.mjs`**

---

## Gmail SMTP (only if App Passwords work on your account)

Google lets you send from that inbox using an **App Password** (not your normal password). Free Gmail has a **rolling limit of about 500 messages per 24 hours** — if your list is ~550, send **~450 today** and the rest **tomorrow** using the sent log.

### One-time setup

1. Open the Google account: [Google Account → Security](https://myaccount.google.com/security).
2. Enable **2-Step Verification** (required for app passwords).
3. Go to [App passwords](https://myaccount.google.com/apppasswords), create one for “Mail” / “Other”, copy the **16-character** password.

### Add to `.env.local` (never commit this file)

```env
GMAIL_USER=swimtosurfemail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

Spaces in the app password are optional; the script strips them.

### Commands

```bash
# Preview
npm run email:announce:gmail -- --dry-run --csv ~/Downloads/cleaned_emails.csv

# Send yourself one test
npm run email:announce:gmail -- --csv ~/Downloads/cleaned_emails.csv --to you@gmail.com --send

# First batch (~450) + log file so you can resume tomorrow
npm run email:announce:gmail -- --csv ~/Downloads/cleaned_emails.csv --send --limit 450 --sent-log scripts/email-blast/sent.log

# Next day: same command skips addresses already in sent.log
npm run email:announce:gmail -- --csv ~/Downloads/cleaned_emails.csv --send --sent-log scripts/email-blast/sent.log
```

Optional: `--delay-ms 1500` to slow down if Google throttles (default 1400).

- **`send-via-gmail.mjs`** — nodemailer + Gmail SMTP.
- **`send-announcement.mjs`** — Resend batch API (needs verified domain).

---

## Resend (same as the site)

The script uses **[Resend](https://resend.com)**. Free tier is typically **3,000 emails/month** — enough for 500+ recipients if you’ve verified a domain.

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

## “Send everything at once” — can I use Gmail?

**One identical email to everyone:** yes. In **Gmail → Compose**, paste your subject + body (or paste HTML from `announcement.html` using a browser extension, or send a simple rich-text version). Put **your own address** in **To**, put **all recipients in BCC** (blind carbon copy). Gmail allows **up to 500 addresses per message** (To + CC + BCC combined). For ~550 people you’d send **two messages** (e.g. 300 BCC + 250 BCC) or trim the list.

Caveats: everyone gets the **same** email (no per-person tracking), some inboxes are stricter on bulk BCC (spam folder), and you must still only mail people who opted in.

**Separate emails to each address (better for deliverability):** use **Brevo** in two days at 300/day, or a paid email tool — Gmail is not meant to fire hundreds of individual SMTP sends in a few minutes.

## Legal / polite use

Only send to people who agreed to hear from you (customers, waitlist, etc.). The template includes a simple reply-to **UNSUBSCRIBE** line.
