"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { SwimmerInfo, ScheduleSelection } from "@/lib/booking-schema";
import { PAYMENT_OPTIONS_COPY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CalendarDownload } from "@/components/booking/calendar-download";

interface Props {
  bookingId: string;
  instructor: "lukaah" | "estee";
  swimmers: SwimmerInfo[];
  /** Calendar file uses the first swimmer’s schedule; others are in your confirmation email. */
  schedules: ScheduleSelection[];
  pricing: { duration: number; price: number; label: string };
  /** True when swimmers use different lesson lengths — calendar duration matches the first swimmer only. */
  mixedLessonLengths?: boolean;
  emailDelivery?: { customer: boolean; admin: boolean } | null;
}

export function BookingSuccess({
  bookingId,
  instructor,
  swimmers,
  schedules,
  pricing,
  mixedLessonLengths,
  emailDelivery,
}: Props) {
  const primary = swimmers[0]!;
  const calendarSchedule = schedules[0]!;
  const calendarName = swimmers.map((s) => s.swimmerName).join(" & ");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-32">
      <section className="bg-black text-white pt-40 pb-32 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-10 shadow-[0_0_40px_rgba(0,113,227,0.4)]"
          >
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-display font-medium text-white mb-6 tracking-tighter"
          >
            You&rsquo;re booked.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-lg font-light tracking-wide text-white/80 md:text-xl font-body"
          >
            Confirmation #{bookingId.slice(0, 8).toUpperCase()}
            {swimmers.length > 1 && (
              <span className="block mt-2 text-base text-white/70">
                {swimmers.length} swimmers on this booking — check your email for all confirmation codes.
              </span>
            )}
            {emailDelivery?.customer
              ? ` · Confirmation sent to ${primary.parentEmail}`
              : emailDelivery && !emailDelivery.customer
                ? " · Email could not be delivered — see note below"
                : primary.parentEmail
                  ? ` · We will email ${primary.parentEmail}`
                  : ""}
          </motion.p>
        </div>
      </section>

      <section className="pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl space-y-12 px-6">
          {emailDelivery && !emailDelivery.customer && (
            <div
              role="status"
              className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-left text-sm leading-relaxed text-amber-950 shadow-sm"
            >
              <p className="font-ui font-semibold text-amber-950">Confirmation email not sent</p>
              <p className="mt-2 text-amber-900/90">
                Your booking is saved. If you don’t see an email within a few minutes, check spam, then text or email us at{" "}
                <a href="mailto:swimtosurfemail@gmail.com" className="font-semibold underline underline-offset-2">
                  swimtosurfemail@gmail.com
                </a>{" "}
                with confirmation <strong>#{bookingId.slice(0, 8).toUpperCase()}</strong>.
              </p>
              {!emailDelivery.admin && (
                <p className="mt-2 text-amber-900/85">
                  Our team notification also failed — please contact us so we can confirm your spot.
                </p>
              )}
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <CalendarDownload
              instructor={instructor}
              swimmerName={calendarName}
              schedule={calendarSchedule}
              duration={pricing.duration}
            />
            {mixedLessonLengths && (
              <p className="text-center text-sm text-[#86868B] font-ui leading-relaxed max-w-lg mx-auto">
                Lesson lengths differ by swimmer on this booking. The calendar file uses{" "}
                <span className="font-semibold text-[#1D1D1F]">{swimmers[0]!.swimmerName}</span>&rsquo;s slot length;
                your email lists the exact duration for each swimmer.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[2rem] border border-black/5 p-10 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <h3 className="font-display text-3xl tracking-tight mb-10 text-[#1D1D1F]">What&rsquo;s next?</h3>
            <ul className="space-y-8 text-[#1D1D1F] font-body text-lg leading-relaxed">
              <li className="flex gap-6">
                <span className="font-display text-accent text-2xl font-semibold w-8 flex-shrink-0">1</span>
                <span>Add your lessons to your calendar using the button above.</span>
              </li>
              <li className="flex gap-6">
                <span className="font-display text-accent text-2xl font-semibold w-8 flex-shrink-0">2</span>
                <span>
                  {PAYMENT_OPTIONS_COPY.short} If you chose pay later, bring payment on your first lesson day.
                </span>
              </li>
              <li className="flex gap-6">
                <span className="font-display text-accent text-2xl font-semibold w-8 flex-shrink-0">3</span>
                <span>You&rsquo;ll receive the lesson address via email before your first session.</span>
              </li>
              <li className="flex gap-6">
                <span className="font-display text-accent text-2xl font-semibold w-8 flex-shrink-0">4</span>
                <span>Show up and let&rsquo;s get swimming!</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 pt-6"
          >
            <Button
              variant="outline"
              className="w-full rounded-full py-6 text-lg flex-1"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </Button>
            <Button
              className="w-full rounded-full py-6 text-lg bg-[#1D1D1F] text-white hover:bg-black flex-1"
              onClick={() => (window.location.href = "/book")}
            >
              Book Another
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
