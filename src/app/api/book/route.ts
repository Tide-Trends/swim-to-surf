import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { getArrivalDetailsHtml, getManageBookingLinkHtml } from "@/lib/email-templates";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { formatLessonTimeHm, lessonLocalToUtcIso } from "@/lib/timezone";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  formatPrice,
} from "@/lib/constants";
import {
  esteeProposalConflicts,
  lukaahProposalConflicts,
  type BookingSlotRow,
} from "@/lib/booking-slots";

const LUKAAH_EMAIL = process.env.ADMIN_EMAIL || "lukaah.marlowe@gmail.com";
const ESTEE_EMAIL = "esteemarlowe@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "swimtosurfemail@gmail.com";

function resendApiKeyConfigured(): boolean {
  const k = process.env.RESEND_API_KEY?.trim();
  return Boolean(k && k.length > 10 && !k.includes("your-resend"));
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

function getAdminEmail(instructor: string): string {
  return instructor === "estee" ? ESTEE_EMAIL : LUKAAH_EMAIL;
}

/** Generate an .ics calendar event URL */
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

function computeScheduleEmailFields(
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

type SwimmerPayload = {
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

async function sendBookingEmails(args: {
  resend: Resend | null;
  bookingIds: string[];
  swimmers: SwimmerPayload[];
  instructor: string;
  instructorName: string;
  scheduleText: string;
  specificDays: string;
  calendarLink: string;
  priceFormatted: string;
  priceInfo: { totalLessons: number; duration: number; price: number };
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

  if (!resend) {
    return { customerEmailSent: false, adminEmailSent: false };
  }

  const customerTo = swimmerInfo.parentEmail?.trim();
  const paymentBlurb =
    paymentMethod === "stripe"
      ? "<p style=\"font-size: 16px; line-height: 1.6; color: #1D1D1F;\"><strong>Stripe checkout:</strong> Pay with card or Apple Pay in your browser. You can also use Apple Pay or a physical card in person when we meet. You&rsquo;ll get a receipt from Stripe when payment succeeds.</p>"
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
                    <td style="padding: 12px 0; color: #1D1D1F;">${swimmers.length} × (${priceInfo.totalLessons} lessons each) · ${priceInfo.duration} min</td>
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
                  <p style="margin: 0; font-size: 14px; color: #1D3557;">${priceInfo.duration}-minute lessons · <strong>${priceFormatted}</strong> total</p>
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

  const baseSend = {
    from: FROM_EMAIL,
    replyTo: REPLY_TO,
  } as const;

  const adminPromise = resend.emails.send({
    ...baseSend,
    to: [adminEmail],
    subject: `New booking: ${swimmerNamesSubject} · ${instructorName} · ${payLabel}`,
    html: adminHtml,
  });

  const customerPromise =
    customerTo != null && customerTo.length > 0
      ? resend.emails.send({
          ...baseSend,
          to: [customerTo],
          subject:
            multi
              ? `You're booked — Swim to Surf (${confirmCodes})`
              : `You're booked — Swim to Surf (confirmation ${bookingId.slice(0, 8).toUpperCase()})`,
          html: customerHtml,
        })
      : Promise.resolve({ data: null, error: null });

  const [adminResult, customerResult] = await Promise.allSettled([adminPromise, customerPromise]);

  let adminEmailSent = false;
  let customerEmailSent = false;

  if (adminResult.status === "fulfilled" && !adminResult.value.error) {
    adminEmailSent = true;
    console.log("Admin notification email sent to:", adminEmail);
  } else {
    const err =
      adminResult.status === "rejected"
        ? adminResult.reason
        : adminResult.status === "fulfilled"
          ? adminResult.value.error
          : null;
    logResendFailure(`admin → ${adminEmail}`, err);
  }

  if (customerTo) {
    if (customerResult.status === "fulfilled" && !customerResult.value.error) {
      customerEmailSent = true;
      console.log("Customer confirmation email sent to:", customerTo);
    } else {
      const err =
        customerResult.status === "rejected"
          ? customerResult.reason
          : customerResult.status === "fulfilled"
            ? customerResult.value.error
            : null;
      logResendFailure(`customer → ${customerTo}`, err);
    }
  } else {
    console.warn("No customer email — admin notification still attempted.");
  }

  return { customerEmailSent, adminEmailSent };
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      instructor: "lukaah" | "estee";
      swimmers?: Array<{
        swimmerName: string;
        swimmerAge: number;
        swimmerMonths?: number;
        lessonTier?: "auto" | "infant" | "standard";
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        notes?: string;
      }>;
      swimmerInfo?: {
        swimmerName: string;
        swimmerAge: number;
        swimmerMonths?: number;
        lessonTier?: "auto" | "infant" | "standard";
        parentName?: string;
        parentEmail?: string;
        parentPhone?: string;
        notes?: string;
      };
      /** One schedule per swimmer (same week/month/day options; times may differ). */
      schedules?: ScheduleSelection[];
      /** @deprecated single-schedule; use schedules */
      schedule?: ScheduleSelection;
      priceInfo: { duration: number; price: number; totalLessons: number };
      paymentMethod: string;
    };

    const { instructor, priceInfo, paymentMethod } = body;

    const schedulesList: ScheduleSelection[] =
      Array.isArray(body.schedules) && body.schedules.length > 0
        ? body.schedules
        : body.schedule
          ? [body.schedule]
          : [];

    const swimmersList =
      Array.isArray(body.swimmers) && body.swimmers.length > 0
        ? body.swimmers
        : body.swimmerInfo
          ? [body.swimmerInfo]
          : [];

    if (swimmersList.length === 0) {
      return NextResponse.json({ error: "Swimmer details are required." }, { status: 400 });
    }

    if (schedulesList.length !== swimmersList.length) {
      return NextResponse.json(
        { error: "Each swimmer needs a schedule (times can differ). Please go back to the schedule step." },
        { status: 400 }
      );
    }

    const firstSch = schedulesList[0]!;
    function schedulesAligned(): boolean {
      for (const s of schedulesList) {
        if (s.type !== firstSch.type) return false;
        if (s.type === "weekly" && firstSch.type === "weekly") {
          if (s.weekStart !== firstSch.weekStart) return false;
        }
        if (s.type === "monthly" && firstSch.type === "monthly") {
          if (s.month !== firstSch.month || s.primaryDay !== firstSch.primaryDay || s.secondDay !== firstSch.secondDay) {
            return false;
          }
        }
      }
      return true;
    }
    if (!schedulesAligned()) {
      return NextResponse.json(
        { error: "All swimmers must share the same week (Lukaah) or month and day pattern (Estee). Only the times may differ." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const supabase = getSupabaseServerClient();
    const canPersist = Boolean(supabase);

    const hasResend = resendApiKeyConfigured();
    const resend = hasResend ? new Resend(process.env.RESEND_API_KEY!.trim()) : null;
    if (!hasResend) {
      console.warn("Resend not configured — set RESEND_API_KEY (and verify RESEND_FROM_EMAIL domain in Resend).");
    }
    if (FROM_EMAIL.includes("resend.dev")) {
      console.warn(
        "[Resend] Using a resend.dev \"from\" address — set RESEND_FROM_EMAIL to an address on a verified domain so mail reaches the inbox."
      );
    }

    const n = swimmersList.length;

    const durationsSet = new Set<number>();
    let expectedTotalCents = 0;
    let expectedLessonsPerSwimmer = 0;

    for (const s of swimmersList) {
      const tier = effectiveLessonTier(s.swimmerAge, s.lessonTier ?? "auto");
      const base = instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
      durationsSet.add(base.duration);
      let perSwimmerPrice: number;
      if (firstSch.type === "weekly") {
        expectedLessonsPerSwimmer = 5;
        perSwimmerPrice = base.price;
      } else {
        expectedLessonsPerSwimmer = firstSch.secondDay ? 8 : 4;
        perSwimmerPrice = firstSch.secondDay ? base.price * 2 : base.price;
      }
      expectedTotalCents += perSwimmerPrice;
    }

    if (durationsSet.size !== 1) {
      return NextResponse.json(
        {
          error:
            "All swimmers in one booking must use the same lesson length. Book separately for mixed 15- and 30-minute lessons.",
        },
        { status: 400 }
      );
    }

    const unifiedDuration = [...durationsSet][0]!;

    if (unifiedDuration !== priceInfo.duration || expectedLessonsPerSwimmer !== priceInfo.totalLessons) {
      return NextResponse.json(
        { error: "Lesson length or lesson count does not match. Please refresh and try again." },
        { status: 400 }
      );
    }

    if (Math.abs(expectedTotalCents - priceInfo.price) > 1) {
      return NextResponse.json(
        { error: `Price mismatch (expected ${formatPrice(expectedTotalCents)}). Please refresh and try again.` },
        { status: 400 }
      );
    }

    if (firstSch.type === "weekly" && instructor !== "lukaah") {
      return NextResponse.json({ error: "Invalid instructor for weekly booking." }, { status: 400 });
    }
    if (firstSch.type === "monthly" && instructor !== "estee") {
      return NextResponse.json({ error: "Invalid instructor for monthly booking." }, { status: 400 });
    }

    let bookingIds: string[] = [];

    if (canPersist && supabase) {
      let existing: BookingSlotRow[] = [];

      if (firstSch.type === "weekly") {
        const { data, error: exErr } = await supabase
          .from("bookings")
          .select("lesson_time, week_start, lesson_duration")
          .eq("instructor", instructor)
          .eq("week_start", firstSch.weekStart)
          .eq("status", "confirmed");
        if (exErr) {
          console.error("Slot check error:", exErr);
          return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
        }
        existing = (data || []) as BookingSlotRow[];
      } else {
        const { data, error: exErr } = await supabase
          .from("bookings")
          .select("lesson_time, second_day_time, day_of_week, lesson_duration, month")
          .eq("instructor", "estee")
          .eq("month", firstSch.month)
          .eq("status", "confirmed");
        if (exErr) {
          console.error("Slot check error:", exErr);
          return NextResponse.json({ error: "Could not verify availability. Try again." }, { status: 500 });
        }
        existing = (data || []) as BookingSlotRow[];
      }

      const pool: BookingSlotRow[] = [...existing];

      for (let i = 0; i < n; i++) {
        const sch = schedulesList[i]!;
        if (sch.type === "weekly") {
          if (lukaahProposalConflicts(pool, sch.weekStart, sch.time, priceInfo.duration)) {
            return NextResponse.json(
              { error: "That time slot was just booked for this week. Please pick another time." },
              { status: 409 }
            );
          }
          pool.push({
            lesson_time: sch.time,
            week_start: sch.weekStart,
            lesson_duration: priceInfo.duration,
            day_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            second_day_time: null,
          });
        } else {
          if (esteeProposalConflicts(pool, sch, priceInfo.duration)) {
            return NextResponse.json(
              { error: "One of those times is no longer available this month. Please choose different times." },
              { status: 409 }
            );
          }
          pool.push({
            lesson_time: sch.primaryTime,
            second_day_time: sch.secondDay && sch.secondDayTime ? sch.secondDayTime : null,
            day_of_week:
              sch.secondDay && sch.secondDayTime
                ? [sch.primaryDay, sch.primaryDay === "wednesday" ? "thursday" : "wednesday"]
                : [sch.primaryDay],
            month: sch.month,
            lesson_duration: priceInfo.duration,
          });
        }
      }

      for (let i = 0; i < n; i++) {
        const s = swimmersList[i]!;
        const sch = schedulesList[i]!;
        const tier = effectiveLessonTier(s.swimmerAge, s.lessonTier ?? "auto");
        const tierNote =
          s.lessonTier && s.lessonTier !== "auto" ? `Lesson tier: ${tier} (manual: ${s.lessonTier})` : "";
        const notesCombined =
          [
            s.swimmerAge === 0 && typeof s.swimmerMonths === "number"
              ? `Age detail: ${s.swimmerMonths} months`
              : "",
            tierNote,
            s.notes || "",
          ]
            .filter(Boolean)
            .join(" | ") || null;

        const lessonTime = sch.type === "weekly" ? sch.time : sch.primaryTime;
        const secondT = sch.type === "monthly" && sch.secondDay && sch.secondDayTime ? sch.secondDayTime : null;

        const base = instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
        const perSwimmerPrice =
          sch.type === "weekly" ? base.price : sch.secondDay ? base.price * 2 : base.price;

        const { data: booking, error: dbError } = await supabase
          .from("bookings")
          .insert({
            instructor,
            swimmer_name: s.swimmerName,
            swimmer_age: s.swimmerAge,
            lesson_duration: priceInfo.duration,
            parent_name: s.parentName || "Adult Swimmer",
            parent_email: s.parentEmail?.trim() || "",
            parent_phone: s.parentPhone?.trim() || "",
            notes: notesCombined,
            status: "confirmed",
            price: perSwimmerPrice,
            total_lessons: expectedLessonsPerSwimmer,
            month: sch.type === "monthly" ? sch.month : null,
            week_start: sch.type === "weekly" ? sch.weekStart : null,
            day_of_week:
              sch.type === "weekly"
                ? ["monday", "tuesday", "wednesday", "thursday", "friday"]
                : sch.secondDay
                  ? [sch.primaryDay, sch.primaryDay === "wednesday" ? "thursday" : "wednesday"]
                  : [sch.primaryDay],
            lesson_time: lessonTime,
            second_day_time: secondT,
          })
          .select("id")
          .single();

        if (dbError) {
          console.error("Supabase Error:", dbError);
          const code = (dbError as { code?: string }).code;
          const msg = (dbError as { message?: string }).message || "";
          if (
            code === "23505" ||
            msg.includes("duplicate") ||
            msg.includes("just booked") ||
            msg.includes("no longer available")
          ) {
            return NextResponse.json(
              { error: "That time slot was just taken. Please pick another time." },
              { status: 409 }
            );
          }
          return NextResponse.json({ error: "Failed to save booking. Please try again." }, { status: 400 });
        }

        bookingIds.push(booking.id);
      }
    } else {
      console.warn(
        "⚠ Supabase not configured — booking not persisted. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
      );
      bookingIds = swimmersList.map(() => crypto.randomUUID());
    }

    const persisted = canPersist;

    const { instructorName, scheduleText, specificDays, calendarLink } = computeScheduleEmailFields(
      instructor as "lukaah" | "estee",
      firstSch as ScheduleSelection,
      priceInfo
    );
    const priceFormatted = `$${(priceInfo.price / 100).toFixed(2)}`;

    const emailPayload = {
      resend,
      bookingIds,
      swimmers: swimmersList as SwimmerPayload[],
      instructor,
      instructorName,
      scheduleText,
      specificDays,
      calendarLink,
      priceFormatted,
      priceInfo,
      paymentMethod,
      origin,
    };

    const stripeDescription =
      n > 1
        ? `${n} swimmers × ${priceInfo.totalLessons} lessons each`
        : `${priceInfo.totalLessons} lessons`;

    if (paymentMethod === "stripe") {
      const sk = process.env.STRIPE_SECRET_KEY?.trim();
      const hasStripe = Boolean(sk && sk !== "sk_test_placeholder" && sk.length > 20);

      if (!hasStripe) {
        return NextResponse.json({ error: "Card payments not configured. Please use pay later." }, { status: 400 });
      }

      try {
        const stripe = new Stripe(sk!, {
          apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
        });

        const feePercent = 0.035;
        const feeAmountCents = Math.round(priceInfo.price * feePercent);
        const priceWithFeeCents = priceInfo.price + feeAmountCents;

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Swim Lessons with ${instructor === "lukaah" ? "Lukaah" : "Estee"}`,
                  description: `${stripeDescription} (includes $${(feeAmountCents / 100).toFixed(2)} processing fee). Card or Apple Pay in checkout.`,
                },
                unit_amount: priceWithFeeCents,
              },
              quantity: 1,
            },
          ],
          metadata: { bookingId: bookingIds[0]!, bookingIds: bookingIds.join(","), instructor },
          success_url: `${origin}/book?success=true&booking=${bookingIds[0]!}`,
          cancel_url: `${origin}/book?canceled=true`,
        });

        const { customerEmailSent, adminEmailSent } = await sendBookingEmails(emailPayload);

        return NextResponse.json({
          url: session.url,
          id: bookingIds[0]!,
          bookingIds,
          persisted,
          customerEmailSent,
          adminEmailSent,
        });
      } catch (stripeErr: unknown) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
        console.error("Stripe Checkout Error:", errMsg, stripeErr);
        return NextResponse.json({ error: `Card payment failed: ${errMsg}` }, { status: 400 });
      }
    }

    const { customerEmailSent, adminEmailSent } = await sendBookingEmails(emailPayload);

    return NextResponse.json({
      id: bookingIds[0]!,
      bookingIds,
      persisted,
      customerEmailSent,
      adminEmailSent,
    });
  } catch (error) {
    console.error("Booking handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

