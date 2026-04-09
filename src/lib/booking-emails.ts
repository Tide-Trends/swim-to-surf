import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";
import { getArrivalDetailsHtml, getManageBookingLinkHtml } from "@/lib/email-templates";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { formatLessonTimeHm, lessonLocalToUtcIso } from "@/lib/timezone";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "swimtosurfemail@gmail.com";

/** Ops inbox for fallbacks (parse env reply-to or default Gmail). */
function opsInboxEmail(): string {
  const raw = REPLY_TO.trim();
  const m = raw.match(/<([^>]+)>/);
  const addr = (m?.[1] ?? raw).trim();
  return addr.includes("@") ? addr : "swimtosurfemail@gmail.com";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Normalize addresses from iOS autofill / unicode spaces so Resend accepts them. */
export function normalizeBookingEmail(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let e = raw.normalize("NFKC").trim().toLowerCase();
  e = e.replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function bccOpsIfUseful(primaryTo: string): string[] {
  const ops = normalizeBookingEmail(opsInboxEmail());
  if (!ops || ops.toLowerCase() === primaryTo.toLowerCase()) return [];
  return [ops];
}

export function resendApiKeyConfigured(): boolean {
  const k = process.env.RESEND_API_KEY?.trim();
  return Boolean(k && k.length > 10 && !k.includes("your-resend"));
}

/** Same env as `scripts/email-blast/send-via-gmail.mjs` — App Password, not your normal Gmail password. */
export function gmailBookingTransportConfigured(): boolean {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "").trim();
  return Boolean(user && pass && user.includes("@"));
}

/**
 * Use Gmail SMTP for booking confirmations when Resend’s “from” is still the default test domain
 * (delivery to arbitrary customer addresses is blocked), or when BOOKING_USE_GMAIL_SMTP=1.
 */
export function shouldUseGmailForBookingEmails(): boolean {
  if (!gmailBookingTransportConfigured()) return false;
  const force = process.env.BOOKING_USE_GMAIL_SMTP?.trim();
  if (force === "1" || force?.toLowerCase() === "true") return true;
  return FROM_EMAIL.includes("resend.dev");
}

function getBookingGmailTransporter(): Transporter {
  const user = process.env.GMAIL_USER!.trim();
  const pass = process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "").trim();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

function logResendFailure(label: string, err: unknown) {
  const detail =
    err && typeof err === "object"
      ? JSON.stringify(err)
      : err instanceof Error
        ? err.message
        : String(err);
  console.error(`[Resend] ${label} failed:`, detail);
}

type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
  bcc?: string | string[];
};

async function resendSendWithRetries(
  resend: Resend,
  label: string,
  payload: ResendEmailPayload,
  idempotencyKey: string
): Promise<boolean> {
  const delays = [0, 1200, 2500, 5000, 8000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]! > 0) await sleep(delays[attempt]!);
    try {
      const result = await resend.emails.send(payload, { idempotencyKey });
      if (!result.error) {
        console.log(`[Resend] ${label} ok (attempt ${attempt + 1})`);
        return true;
      }
      logResendFailure(`${label} attempt ${attempt + 1}`, result.error);
    } catch (e) {
      logResendFailure(`${label} attempt ${attempt + 1}`, e);
    }
  }
  return false;
}

async function smtpSendWithRetries(
  transporter: Transporter,
  label: string,
  mail: SendMailOptions
): Promise<boolean> {
  const delays = [0, 1200, 2500, 5000, 8000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]! > 0) await sleep(delays[attempt]!);
    try {
      await transporter.sendMail(mail);
      console.log(`[Gmail SMTP] ${label} ok (attempt ${attempt + 1})`);
      return true;
    } catch (e) {
      logResendFailure(`[SMTP] ${label} attempt ${attempt + 1}`, e);
    }
  }
  return false;
}

export function getAdminEmail(instructor: string): string {
  return instructor === "estee" ? ESTEE_EMAIL : LUKAAH_EMAIL;
}

function buildCalendarLink(title: string, startDate: string, time: string, durationMin: number): string {
  const d = lessonLocalToUtcIso(startDate, time);
  const start = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const endDate = new Date(d.getTime() + durationMin * 60000);
  const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: `Swimming lesson with Swim to Surf. Questions? Email swimtosurfemail@gmail.com or call 385-499-8036.`,
    location: "1299 N 500 W, American Fork, UT 84003",
  });

  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

export function computeScheduleEmailFields(
  instructor: "lukaah" | "estee",
  schedule: ScheduleSelection,
  priceInfo: { duration: number }
) {
  const instructorName = instructor === "lukaah" ? "Lukaah" : "Estee";
  let scheduleText = "";
  let specificDays = "";
  let calendarLink = "";

  if (schedule.type === "weekly") {
    const time24 = schedule.time;
    const timeFormatted = formatLessonTimeHm(time24);
    const weekStart = schedule.weekStart;
    scheduleText = `Monday – Friday at ${timeFormatted}`;
    specificDays = `Week of ${weekStart} (Mon – Fri)`;
    calendarLink = buildCalendarLink(`🏊 Swim Lesson with ${instructorName}`, weekStart, time24, priceInfo.duration);
  } else {
    const dayName = schedule.primaryDay.charAt(0).toUpperCase() + schedule.primaryDay.slice(1);
    const timeFormatted = formatLessonTimeHm(schedule.primaryTime);
    scheduleText = `Every ${dayName} at ${timeFormatted}`;
    specificDays = `${schedule.month} · Every ${dayName}`;

    if (schedule.secondDay && schedule.secondDayTime) {
      const otherDay = schedule.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
      const otherTimeFormatted = formatLessonTimeHm(schedule.secondDayTime);
      scheduleText += ` + ${otherDay} at ${otherTimeFormatted}`;
      specificDays += ` & ${otherDay}`;
    }

    const [year, monthNum] = schedule.month.split("-").map(Number);
    const targetDow = schedule.primaryDay === "wednesday" ? 3 : 4;
    const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
    let firstLessonYmd = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    for (let dom = 1; dom <= daysInMonth; dom++) {
      if (new Date(Date.UTC(year, monthNum - 1, dom)).getUTCDay() === targetDow) {
        firstLessonYmd = `${year}-${String(monthNum).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
        break;
      }
    }
    calendarLink = buildCalendarLink(
      `🏊 Swim Lesson with ${instructorName}`,
      firstLessonYmd,
      schedule.primaryTime,
      priceInfo.duration
    );
  }

  return { instructorName, scheduleText, specificDays, calendarLink };
}

export type SwimmerPayload = {
  swimmerName: string;
  swimmerAge: number;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function swimmersListHtml(swimmers: SwimmerPayload[]): string {
  return swimmers
    .map(
      (s) =>
        `<li style="margin: 6px 0;"><strong>${escapeHtml(s.swimmerName)}</strong> (age ${s.swimmerAge})${s.notes ? ` — ${escapeHtml(s.notes)}` : ""}</li>`
    )
    .join("");
}

export async function sendBookingEmails(args: {
  resend: Resend | null;
  bookingIds: string[];
  swimmers: SwimmerPayload[];
  instructor: string;
  instructorName: string;
  scheduleText: string;
  specificDays: string;
  calendarLink: string;
  priceFormatted: string;
  priceInfo: { totalLessons: number; price: number; duration?: number; durationSummary?: string };
  paymentMethod: string;
  origin: string;
}): Promise<{ customerEmailSent: boolean; adminEmailSent: boolean }> {
  const {
    resend,
    bookingIds,
    swimmers,
    instructor,
    instructorName,
    scheduleText,
    specificDays,
    calendarLink,
    priceFormatted,
    priceInfo,
    paymentMethod,
    origin,
  } = args;

  const bookingId = bookingIds[0]!;
  const swimmerInfo = swimmers[0]!;
  const multi = swimmers.length > 1;
  const lessonsLine = multi
    ? `${swimmers.length} swimmers, each with <strong>${priceInfo.totalLessons} lessons</strong>`
    : `<strong>${priceInfo.totalLessons} lessons</strong>`;
  const confirmCodes = bookingIds.map((id) => id.slice(0, 8).toUpperCase()).join(" · ");

  const useGmail = shouldUseGmailForBookingEmails();
  if (!useGmail && !resend) {
    return { customerEmailSent: false, adminEmailSent: false };
  }

  if (useGmail) {
    console.log(
      "[Booking email] Using Gmail SMTP for confirmations — delivers to any customer inbox without Resend domain DNS."
    );
  } else if (FROM_EMAIL.includes("resend.dev")) {
    console.error(
      "[Resend] FROM is onboarding@resend.dev — set GMAIL_USER + GMAIL_APP_PASSWORD in production so bookings use Gmail SMTP, " +
        "or set RESEND_FROM_EMAIL on a verified domain."
    );
  }

  const customerTo = normalizeBookingEmail(swimmerInfo.parentEmail);
  const paymentBlurb =
    paymentMethod === "stripe"
      ? "<p style=\"font-size: 16px; line-height: 1.6; color: #1D1D1F;\"><strong>Payment received:</strong> Thank you for paying with Stripe. You&rsquo;ll have a receipt from Stripe. You can also use Apple Pay or a card in person when we meet.</p>"
      : '<p style="font-size: 16px; line-height: 1.6; color: #1D1D1F;"><strong>Pay later:</strong> Bring Venmo, cash, check, Apple Pay in person, or a card — we&rsquo;ll confirm at the pool. Venmo: @swimtosurf</p>';

  const calendarBtn = (label: string) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
      <tr>
        <td bgcolor="#005f8a" style="background-color: #005f8a; border-radius: 999px;">
          <a href="${calendarLink}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; font-weight: 700; color: #ffffff !important; text-decoration: none; line-height: 1.2;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;

  const adminEmail = getAdminEmail(instructor);
  const payLabel =
    paymentMethod === "stripe"
      ? "Stripe (card / Apple Pay)"
      : paymentMethod === "venmo"
        ? "Pay later (Venmo / cash / in person)"
        : String(paymentMethod);

  const swimmerNamesSubject = swimmers.map((s) => s.swimmerName).join(" + ");

  const adminHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 32px 0; text-align: center; border-bottom: 2px solid #0077B6;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #0077B6;">New booking</h1>
                <p style="color: #1D1D1F; font-size: 15px; margin: 0; font-weight: 600;">${confirmCodes} · ${payLabel}</p>
              </div>

              <div style="padding: 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333; width: 140px;">Instructor</td>
                    <td style="padding: 12px 0; color: #1D1D1F;">${instructorName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333; vertical-align: top;">Swimmers</td>
                    <td style="padding: 12px 0; color: #1D1D1F;"><ul style="margin:0;padding-left:18px;">${swimmersListHtml(swimmers)}</ul></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Guardian</td>
                    <td style="padding: 12px 0; color: #1D1D1F;">${escapeHtml(swimmerInfo.parentName || "N/A")}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Email</td>
                    <td style="padding: 12px 0;"><a href="mailto:${encodeURIComponent(swimmerInfo.parentEmail || "")}" style="color: #005f8a; font-weight: 600;">${swimmerInfo.parentEmail ? escapeHtml(swimmerInfo.parentEmail) : "Not provided"}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Phone</td>
                    <td style="padding: 12px 0;"><a href="tel:${String(swimmerInfo.parentPhone || "").replace(/[^\d+]/g, "")}" style="color: #005f8a; font-weight: 600;">${swimmerInfo.parentPhone ? escapeHtml(swimmerInfo.parentPhone) : "Not provided"}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Schedule</td>
                    <td style="padding: 12px 0; color: #1D1D1F;">${scheduleText}<br/><span style="color:#555;font-size:14px;">${specificDays}</span></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Lessons</td>
                    <td style="padding: 12px 0; color: #1D1D1F;">${swimmers.length} × (${priceInfo.totalLessons} lessons each) · ${priceInfo.durationSummary || `${priceInfo.duration} min`}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E8E8ED;">
                    <td style="padding: 12px 0; font-weight: 600; color: #333;">Price</td>
                    <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #005f8a;">${priceFormatted}</td>
                  </tr>
                </table>
              </div>

              ${calendarBtn("Add to Google Calendar")}

              <p style="color: #555; font-size: 13px; margin-top: 24px; border-top: 1px solid #E8E8ED; padding-top: 16px; text-align: center;">
                Swim to Surf · Booking ID(s): ${confirmCodes}
              </p>
            </div>
          `;

  const manageExtra =
    multi
      ? `<p style="font-size: 13px; color: #555; margin-top: 12px;">You have multiple confirmation codes (${confirmCodes}). The link below opens details for the first swimmer; reply to this email if you need help with the others.</p>`
      : "";

  const customerHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto;">
              <div style="padding: 40px 0; text-align: center; border-bottom: 1px solid #E8E8ED;">
                <h1 style="font-size: 28px; font-weight: 600; margin: 0 0 8px; color: #1D1D1F;">You&apos;re booked</h1>
                <p style="color: #333; font-size: 16px; margin: 0;">Swim to Surf · ${multi ? `Confirmations ${confirmCodes}` : `Confirmation #${bookingId.slice(0, 8).toUpperCase()}`}</p>
              </div>

              <div style="padding: 32px 0;">
                <p style="font-size: 16px; line-height: 1.6; color: #1D1D1F;">Hi ${escapeHtml(swimmerInfo.parentName || swimmerInfo.swimmerName)},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #1D1D1F;">You are booked for ${lessonsLine} with <strong>${instructorName}</strong>.</p>
                ${
                  multi
                    ? `<ul style="font-size:15px;line-height:1.6;color:#1D1D1F;padding-left:20px;">${swimmersListHtml(swimmers)}</ul>`
                    : ""
                }

                <div style="margin: 24px 0; padding: 20px; background: #E8F4FD; border-radius: 16px; border: 1px solid #B8DFF0;">
                  <p style="margin: 0 0 4px; font-size: 14px; color: #005f8a; font-weight: 700;">YOUR SCHEDULE</p>
                  <p style="margin: 0 0 8px; font-size: 17px; color: #1D3557; font-weight: 600;">${scheduleText}</p>
                  <p style="margin: 0 0 4px; font-size: 14px; color: #1D3557;">${specificDays}</p>
                  <p style="margin: 0; font-size: 14px; color: #1D3557;">${priceInfo.durationSummary || `${priceInfo.duration}-minute lessons`} · <strong>${priceFormatted}</strong> total</p>
                </div>

                ${calendarBtn("Add to Google Calendar")}

                ${paymentBlurb}
              </div>

              <div style="margin: 24px 0; padding: 24px; background: #FFF; border-radius: 16px; border: 1px solid #E8E8ED;">
                ${getArrivalDetailsHtml(origin)}
                ${manageExtra}
                ${getManageBookingLinkHtml(bookingId, origin)}
              </div>

              <p style="font-size: 14px; color: #555; margin: 0 0 16px; text-align: center;">We will send a short reminder before your first lesson with this same address and parking map.</p>

              <div style="margin: 24px 0; padding: 24px; background: #F5F5F7; border-radius: 16px; border: 1px solid #E8E8ED;">
                <h3 style="margin: 0 0 16px; color: #1D1D1F; font-size: 16px;">Policies</h3>
                <ul style="padding-left: 20px; margin: 0; color: #333; line-height: 1.8; font-size: 14px;">
                  <li><strong>Full cancellation:</strong> 7 days advance notice for a full refund.</li>
                  <li><strong>Missed lesson:</strong> Notify us 24 hours in advance; makeups are not guaranteed.</li>
                  <li><strong>No-shows:</strong> No refunds or rescheduling.</li>
                </ul>
              </div>

              <p style="font-size: 16px; line-height: 1.6; margin-top: 24px; color: #1D1D1F;">We can&apos;t wait to see you in the water.</p>
              <p style="color: #555; font-size: 13px; margin-top: 32px; border-top: 1px solid #E8E8ED; padding-top: 24px;">
                Swim to Surf LLC · American Fork, Utah<br/>
                swimtosurfemail@gmail.com · 385-499-8036
              </p>
            </div>
          `;

  const sortedIds = [...bookingIds].sort().join("-");
  const idempotencyAdmin = `sts-${sortedIds}-admin-${paymentMethod}`;
  const idempotencyCustomer = `sts-${sortedIds}-customer-${paymentMethod}`;

  const adminSubject = `New booking: ${swimmerNamesSubject} · ${instructorName} · ${payLabel}`;
  const customerSubject = multi
    ? `You're booked — Swim to Surf (${confirmCodes})`
    : `You're booked — Swim to Surf (confirmation ${bookingId.slice(0, 8).toUpperCase()})`;

  const adminBcc = bccOpsIfUseful(adminEmail);
  let adminEmailSent: boolean;
  let customerEmailSent = false;

  if (useGmail) {
    const transporter = getBookingGmailTransporter();
    const gmailFrom = `"Swim to Surf" <${process.env.GMAIL_USER!.trim()}>`;
    adminEmailSent = await smtpSendWithRetries(transporter, `admin → ${adminEmail}`, {
      from: gmailFrom,
      to: adminEmail,
      ...(adminBcc.length ? { bcc: adminBcc } : {}),
      replyTo: REPLY_TO,
      subject: adminSubject,
      html: adminHtml,
    });
    if (customerTo) {
      const custBcc = bccOpsIfUseful(customerTo);
      customerEmailSent = await smtpSendWithRetries(transporter, `customer → ${customerTo}`, {
        from: gmailFrom,
        to: customerTo,
        ...(custBcc.length ? { bcc: custBcc } : {}),
        replyTo: REPLY_TO,
        subject: customerSubject,
        html: customerHtml,
      });
    } else {
      console.warn("No customer email — admin notification still attempted.");
    }
    if (!adminEmailSent || (customerTo && !customerEmailSent)) {
      const ops = opsInboxEmail();
      const lines = [
        "One or more booking emails failed after retries. Re-send manually if needed.",
        `Admin delivered: ${adminEmailSent ? "yes" : "no"} (to ${adminEmail})`,
        customerTo
          ? `Customer delivered: ${customerEmailSent ? "yes" : "no"} (to ${customerTo})`
          : "Customer email: not provided on booking",
        "",
        `Confirm codes: ${confirmCodes}`,
        `Payment: ${payLabel}`,
        `Schedule: ${scheduleText}`,
        `${specificDays}`,
        `Total: ${priceFormatted}`,
      ];
      const body = lines.join("\n");
      await smtpSendWithRetries(transporter, `ops-alert → ${ops}`, {
        from: gmailFrom,
        to: ops,
        replyTo: REPLY_TO,
        subject: `[Swim to Surf] Booking email delivery issue — ${confirmCodes}`,
        html: `<pre style="font-family:system-ui;font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(body)}</pre>`,
      });
    }
    return { customerEmailSent, adminEmailSent };
  }

  adminEmailSent = await resendSendWithRetries(
    resend!,
    `admin → ${adminEmail}`,
    {
      from: FROM_EMAIL,
      to: [adminEmail],
      ...(adminBcc.length ? { bcc: adminBcc } : {}),
      replyTo: REPLY_TO,
      subject: adminSubject,
      html: adminHtml,
    },
    idempotencyAdmin
  );

  if (customerTo) {
    const custBcc = bccOpsIfUseful(customerTo);
    customerEmailSent = await resendSendWithRetries(
      resend!,
      `customer → ${customerTo}`,
      {
        from: FROM_EMAIL,
        to: [customerTo],
        ...(custBcc.length ? { bcc: custBcc } : {}),
        replyTo: REPLY_TO,
        subject: customerSubject,
        html: customerHtml,
      },
      idempotencyCustomer
    );
  } else {
    console.warn("No customer email — admin notification still attempted.");
  }

  if (!adminEmailSent || (customerTo && !customerEmailSent)) {
    const ops = opsInboxEmail();
    const alertKey = `sts-${sortedIds}-ops-deliver-${paymentMethod}`;
    const lines = [
      "One or more booking emails failed after retries. Re-send manually if needed.",
      `Admin delivered: ${adminEmailSent ? "yes" : "no"} (to ${adminEmail})`,
      customerTo
        ? `Customer delivered: ${customerEmailSent ? "yes" : "no"} (to ${customerTo})`
        : "Customer email: not provided on booking",
      "",
      `Confirm codes: ${confirmCodes}`,
      `Payment: ${payLabel}`,
      `Schedule: ${scheduleText}`,
      `${specificDays}`,
      `Total: ${priceFormatted}`,
    ];
    const body = lines.join("\n");
    await resendSendWithRetries(
      resend!,
      `ops-alert → ${ops}`,
      {
        from: FROM_EMAIL,
        to: [ops],
        replyTo: REPLY_TO,
        subject: `[Swim to Surf] Booking email delivery issue — ${confirmCodes}`,
        html: `<pre style="font-family:system-ui;font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(body)}</pre>`,
      },
      alertKey
    );
  }

  return { customerEmailSent, adminEmailSent };
}
