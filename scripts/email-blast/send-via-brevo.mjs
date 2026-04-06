#!/usr/bin/env node
/**
 * Send announcement.html via Brevo (Sendinblue) HTTP API — no Gmail "App Password" required.
 *
 * Setup (free tier: 300 emails / day — use --limit 300 + --sent-log, finish next day):
 *   1. Create a free account: https://www.brevo.com
 *   2. Settings → Senders, domains, dedicated IPs → Senders → Add a sender
 *      Use swimtosurfemail@gmail.com — Brevo emails you a link; click it (no app password).
 *   3. Settings → SMTP & API → API keys → Create a new API key (copy the key, starts with xkeysib-)
 *
 * In .env.local (never commit):
 *   BREVO_API_KEY=xkeysib-...
 *   BREVO_SENDER_EMAIL=swimtosurfemail@gmail.com
 *
 * Usage:
 *   node scripts/email-blast/send-via-brevo.mjs --dry-run --csv ~/Downloads/cleaned_emails.csv
 *   node scripts/email-blast/send-via-brevo.mjs --csv ~/Downloads/cleaned_emails.csv --to you@gmail.com --send
 *   node scripts/email-blast/send-via-brevo.mjs --csv ~/Downloads/cleaned_emails.csv --send --limit 300 --sent-log scripts/email-blast/sent-brevo.log
 */

import { readFileSync, existsSync, appendFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

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

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function parseArgs(argv) {
  const out = {
    dryRun: false,
    send: false,
    csv: null,
    to: null,
    limit: null,
    delayMs: 2000,
    sentLog: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--send") out.send = true;
    else if (a === "--csv" && argv[i + 1]) out.csv = argv[++i];
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
    else if (a === "--limit" && argv[i + 1]) out.limit = Number(argv[++i]);
    else if (a === "--delay-ms" && argv[i + 1]) out.delayMs = Number(argv[++i]);
    else if (a === "--sent-log" && argv[i + 1]) out.sentLog = argv[++i];
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

function loadSentSet(sentLogPath) {
  if (!sentLogPath || !existsSync(sentLogPath)) return new Set();
  const raw = readFileSync(sentLogPath, "utf8");
  const set = new Set();
  for (const line of raw.split("\n")) {
    const t = line.trim().toLowerCase();
    if (t && t.includes("@")) set.add(t);
  }
  return set;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendOne(apiKey, senderEmail, senderName, to, html) {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: SUBJECT,
      htmlContent: html,
      textContent: PLAIN_TEXT,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.message || j.error || JSON.stringify(j);
    } catch {
      /* keep text */
    }
    throw new Error(`${res.status} ${msg}`);
  }
  return text;
}

async function main() {
  const args = parseArgs(process.argv);
  const htmlPath = join(__dirname, "announcement.html");
  const html = readFileSync(htmlPath, "utf8");

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Swim To Surf";

  if (!args.csv) {
    console.error(
      "Usage: node scripts/email-blast/send-via-brevo.mjs --csv /path/to.csv [--dry-run] [--send] [--to test@gmail.com] [--limit 300] [--sent-log path] [--delay-ms 2000]"
    );
    process.exit(1);
  }

  const csvPath = resolve(args.csv);
  if (!existsSync(csvPath)) {
    console.error("CSV not found:", csvPath);
    process.exit(1);
  }

  let allEmails = parseEmails(csvPath);
  const sentSet = args.sentLog ? loadSentSet(resolve(args.sentLog)) : new Set();
  if (sentSet.size > 0) {
    const before = allEmails.length;
    allEmails = allEmails.filter((e) => !sentSet.has(e));
    console.log(`Skipping ${before - allEmails.length} already in sent log; ${allEmails.length} remaining.`);
  }

  if (args.limit != null && args.limit > 0) {
    allEmails = allEmails.slice(0, args.limit);
  }

  console.log(`Recipients to process: ${allEmails.length}`);

  if (args.dryRun || !args.send) {
    console.log("\nDry run (no mail). First 5:");
    console.log(allEmails.slice(0, 5).join("\n"));
    console.log("\nFree Brevo: 300 emails/day — use --limit 300 and run again tomorrow with --sent-log.");
    console.log("Setup: https://www.brevo.com → verify sender email → API key in .env.local");
    console.log("Test:   --to you@gmail.com --send");
    console.log("Blast:  --send + BREVO_API_KEY + BREVO_SENDER_EMAIL\n");
    return;
  }

  if (!apiKey || !senderEmail) {
    console.error("Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env.local (see script header comments).");
    process.exit(1);
  }

  if (args.to) {
    await sendOne(apiKey, senderEmail, senderName, args.to, html);
    console.log(`Test sent to ${args.to}`);
    return;
  }

  let ok = 0;
  let fail = 0;
  const sentLogResolved = args.sentLog ? resolve(args.sentLog) : null;

  for (let i = 0; i < allEmails.length; i++) {
    const to = allEmails[i];
    try {
      await sendOne(apiKey, senderEmail, senderName, to, html);
      ok++;
      if (sentLogResolved) appendFileSync(sentLogResolved, `${to}\n`, "utf8");
      if ((i + 1) % 25 === 0 || i === allEmails.length - 1) {
        console.log(`Progress: ${i + 1}/${allEmails.length} (ok ${ok}, fail ${fail})`);
      }
    } catch (e) {
      fail++;
      console.error(`FAIL ${to}:`, e instanceof Error ? e.message : e);
    }
    if (i < allEmails.length - 1) await sleep(args.delayMs);
  }

  console.log(`\nDone. Sent: ${ok}, failed: ${fail}`);
  if (sentLogResolved) console.log(`Log: ${sentLogResolved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
