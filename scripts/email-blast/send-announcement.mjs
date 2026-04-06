#!/usr/bin/env node
/**
 * Send the booking announcement to a list of emails via Resend (free tier: 3,000/mo typical).
 *
 * Prereqs:
 *   - RESEND_API_KEY in .env.local or environment (same as the site)
 *   - RESEND_FROM_EMAIL using a verified domain (see README if Wix blocks DNS)
 *   - Optional: RESEND_REPLY_TO — inbox where replies go (e.g. your Gmail) if "from" uses another domain
 *
 * Usage:
 *   node scripts/email-blast/send-announcement.mjs --dry-run --csv /path/to/cleaned_emails.csv
 *   node scripts/email-blast/send-announcement.mjs --csv /path/to/cleaned_emails.csv --to you@gmail.com
 *   node scripts/email-blast/send-announcement.mjs --csv /path/to/cleaned_emails.csv --send
 *
 * Without --send, only prints what would happen (safe default).
 */

import { readFileSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function loadDotEnvLocal() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvLocal();

const SUBJECT = "Swim To Surf — booking is live";

const PLAIN_TEXT = `Swim To Surf — booking is now live

Book private swim lessons:
https://www.swimtosurf.co

New scheduling options this season. Spots fill fast — secure your time early.

Swim To Surf
American Fork, Utah
https://www.swimtosurf.co

Questions? Reply to this email.

To opt out of future messages, reply with UNSUBSCRIBE.
`;

function parseArgs(argv) {
  const out = { dryRun: false, send: false, csv: null, to: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--send") out.send = true;
    else if (a === "--csv" && argv[i + 1]) {
      out.csv = argv[++i];
    } else if (a === "--to" && argv[i + 1]) {
      out.to = argv[++i];
    }
  }
  return out;
}

function parseEmails(csvPath) {
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase();
  const start = header === "email" ? 1 : 0;
  const set = new Set();
  for (let i = start; i < lines.length; i++) {
    let e = lines[i].replace(/^"|"$/g, "").trim().toLowerCase();
    if (!e.includes("@")) continue;
    set.add(e);
  }
  return [...set];
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  const htmlPath = join(__dirname, "announcement.html");
  const html = readFileSync(htmlPath, "utf8");

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.RESEND_FROM_EMAIL?.trim() || "Swim To Surf <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  const baseFields = () => {
    const o = {};
    if (replyTo) o.replyTo = replyTo;
    return o;
  };

  if (!args.csv) {
    console.error("Usage: node scripts/email-blast/send-announcement.mjs --csv /path/to/cleaned_emails.csv [--dry-run] [--send] [--to test@email.com]");
    process.exit(1);
  }

  const csvPath = resolve(args.csv);
  if (!existsSync(csvPath)) {
    console.error("CSV not found:", csvPath);
    process.exit(1);
  }

  const allEmails = parseEmails(csvPath);
  console.log(`Loaded ${allEmails.length} unique addresses from ${csvPath}`);

  if (args.to) {
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY");
      process.exit(1);
    }
    const resend = new Resend(apiKey);
    console.log(`Sending test to ${args.to} ...`);
    const { data, error } = await resend.emails.send({
      from: fromRaw,
      to: [args.to],
      subject: SUBJECT,
      html,
      text: PLAIN_TEXT,
      ...baseFields(),
    });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log("Sent. Id:", data?.id);
    return;
  }

  if (args.dryRun || !args.send) {
    console.log("\nDry run (no emails sent). First 5 addresses:");
    console.log(allEmails.slice(0, 5).join("\n"));
    console.log("\nTo send a test:  --to your@email.com");
    console.log("To send to all:  --send   (requires RESEND_API_KEY + verified from domain for best delivery)\n");
    if (!args.dryRun && !args.send) {
      console.log("Tip: add --dry-run explicitly to suppress this reminder.");
    }
    return;
  }

  if (!apiKey) {
    console.error("Set RESEND_API_KEY (e.g. in .env.local)");
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const BATCH = 100;
  const batches = chunk(allEmails, BATCH);
  let sent = 0;
  let failed = 0;

  for (let b = 0; b < batches.length; b++) {
    const group = batches[b];
    const payload = group.map((to) => ({
      from: fromRaw,
      to: [to],
      subject: SUBJECT,
      html,
      text: PLAIN_TEXT,
      ...baseFields(),
    }));

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      console.error(`Batch ${b + 1}/${batches.length} failed:`, error);
      failed += group.length;
      continue;
    }
    // API returns { data: [ { id }, ... ] } on success
    const inner = Array.isArray(data?.data) ? data.data : [];
    const n = inner.length || group.length;
    sent += n;
    console.log(`Batch ${b + 1}/${batches.length}: OK (${n} messages)`);
    if (b < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log(`\nDone. Sent (reported): ${sent}, failed: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
