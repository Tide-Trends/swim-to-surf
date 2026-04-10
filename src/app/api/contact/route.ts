import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Swim to Surf <onboarding@resend.dev>";
/** Inbox for contact form submissions (default: Estee). Override with CONTACT_FORM_TO in Vercel. */
const CONTACT_INBOX = process.env.CONTACT_FORM_TO || "esteemarlowe@gmail.com";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let savedToDb = false;
    if (supabase) {
      const { error: dbError } = await supabase.from("contact_messages").insert({
        name,
        email,
        phone: phone || null,
        message,
      });
      if (dbError) {
        console.error("Contact form DB error:", dbError);
      } else {
        savedToDb = true;
      }
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const hasResend = Boolean(apiKey && apiKey.length > 10 && !apiKey.includes("your-resend"));

    let emailSent = false;
    let resendId: string | undefined;

    if (hasResend) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safePhone = phone ? escapeHtml(phone) : "";
      const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [CONTACT_INBOX],
        replyTo: email,
        subject: `Swim to Surf contact: ${name}`,
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D3557; max-width: 560px;">
          <h2 style="margin: 0 0 16px; font-size: 20px;">New message from swimtosurf.com</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr><td style="padding: 8px 0; color: #6B7B8D; width: 100px; vertical-align: top;"><strong>Name</strong></td><td style="padding: 8px 0;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7B8D; vertical-align: top;"><strong>Email</strong></td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #0077B6;">${safeEmail}</a></td></tr>
            ${safePhone ? `<tr><td style="padding: 8px 0; color: #6B7B8D; vertical-align: top;"><strong>Phone</strong></td><td style="padding: 8px 0;">${safePhone}</td></tr>` : ""}
          </table>
          <p style="margin: 20px 0 8px; font-size: 13px; color: #6B7B8D; text-transform: uppercase; letter-spacing: 0.08em;"><strong>Message</strong></p>
          <div style="padding: 16px; background: #F5F5F7; border-radius: 12px; line-height: 1.6;">${safeMessage}</div>
          <p style="margin-top: 24px; font-size: 13px; color: #86868B;">Reply to this email to respond directly to the sender.</p>
        </div>
      `,
      });

      if (error) {
        console.error("Resend contact form error:", error);
      } else {
        emailSent = true;
        resendId = data?.id;
      }
    }

    if (!savedToDb && !emailSent) {
      if (!supabase && !hasResend) {
        console.error("Contact form: neither Supabase nor RESEND_API_KEY is configured.");
        return NextResponse.json(
          {
            error:
              "We couldn’t save your message right now. Please email us directly or try again later.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Could not send your message. Please try again in a moment or email us directly." },
        { status: 502 }
      );
    }

    if (emailSent) {
      console.log("Contact form email sent to", CONTACT_INBOX, "id:", resendId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
