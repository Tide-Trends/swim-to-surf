#!/usr/bin/env node
/**
 * Send announcement.html via Gmail SMTP (free personal Gmail: ~500 messages / 24h — split runs if needed).
 *
 * Setup (one-time):
 *   1. Use a Google account you control (e.g. swimtosurfemail@gmail.com).
 *   2. Turn on 2-Step Verification: https://myaccount.google.com/security
 *   3. Create an App Password: https://myaccount.google.com/apppasswords → Mail / Other → copy 16-char password.
 *
 * In .env.local (do NOT commit):
 *   GMAIL_USER=swimtosurfemail@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * Usage:
 *   node scripts/email-blast/send-via-gmail.mjs --dry-run --csv ~/Downloads/cleaned_emails.csv
 *   node scripts/email-blast/send-via-gmail.mjs --csv ~/Downloads/cleaned_emails.csv --to you@gmail.com
 *   node scripts/email-blast/send-via-gmail.mjs --csv ~/Downloads/cleaned_emails.csv --send --limit 450
 *   node scripts/email-blast/send-via-gmail.mjs --csv ~/Downloads/cleaned_emails.csv --send --sent-log ./scripts/email-blast/sent.log
 *
 * --sent-log appends each successful address; re-run with same file to skip already-sent (resume next day).
 */

import { readFileSync, existsSync, appendFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

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
  const out = {
    dryRun: false,
    send: false,
    csv: null,
    to: null,
    limit: null,
    delayMs: 1400,
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

async function main() {
  const args = parseArgs(process.argv);
  const htmlPath = join(__dirname, "announcement.html");
  const html = readFileSync(htmlPath, "utf8");

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "").trim();

  if (!args.csv) {
    console.error(
      "Usage: node scripts/email-blast/send-via-gmail.mjs --csv /path/to/cleaned_emails.csv [--dry-run] [--send] [--to test@gmail.com] [--limit 450] [--sent-log path] [--delay-ms 1400]"
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
    console.log("\nGmail free accounts: ~500 sends / 24h — use --limit 450 and finish the rest tomorrow with --sent-log.");
    console.log("Test one:  --to your@gmail.com");
    console.log("Full send:  --send   (+ GMAIL_USER + GMAIL_APP_PASSWORD in .env.local)\n");
    return;
  }

  if (!user || !pass) {
    console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local (App Password, not your normal Gmail password).");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.verify();

  if (args.to) {
    await transporter.sendMail({
      from: `"Swim To Surf" <${user}>`,
      to: args.to,
      subject: SUBJECT,
      text: PLAIN_TEXT,
      html,
    });
    console.log(`Test sent to ${args.to}`);
    return;
  }

  let ok = 0;
  let fail = 0;
  const sentLogResolved = args.sentLog ? resolve(args.sentLog) : null;

  for (let i = 0; i < allEmails.length; i++) {
    const to = allEmails[i];
    try {
      await transporter.sendMail({
        from: `"Swim To Surf" <${user}>`,
        to,
        subject: SUBJECT,
        text: PLAIN_TEXT,
        html,
      });
      ok++;
      if (sentLogResolved) {
        appendFileSync(sentLogResolved, `${to}\n`, "utf8");
      }
      if ((i + 1) % 25 === 0 || i === allEmails.length - 1) {
        console.log(`Progress: ${i + 1}/${allEmails.length} (ok ${ok}, fail ${fail})`);
      }
    } catch (e) {
      fail++;
      console.error(`FAIL ${to}:`, e.message || e);
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
