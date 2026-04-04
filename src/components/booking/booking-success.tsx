"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import type { SwimmerInfo, ScheduleSelection } from "@/lib/booking-schema";
import { INSTRUCTORS, formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CalendarDownload } from "@/components/booking/calendar-download";

interface Props {
  bookingId: string;
  instructor: "lukaah" | "estee";
  swimmerInfo: SwimmerInfo;
  schedule: ScheduleSelection;
  pricing: { duration: number; price: number; label: string };
}

export function BookingSuccess({ bookingId, instructor, swimmerInfo, schedule, pricing }: Props) {
  const inst = INSTRUCTORS[instructor];

  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-32">
      <section className="bg-black text-white pt-40 pb-32 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Subtle background glow */}
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
            className="text-white/60 text-lg md:text-xl font-light font-body max-w-2xl mx-auto tracking-wide"
          >
            Order #{bookingId.slice(0, 8).toUpperCase()} &middot; Receipt sent to {swimmerInfo.parentEmail}
          </motion.p>
        </div>
      </section>

      <section className="pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl px-6 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CalendarDownload
              instructor={instructor}
              swimmerName={swimmerInfo.swimmerName}
              schedule={schedule}
              duration={pricing.duration}
            />
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
                <span>Bring payment (Venmo, cash, or check) on your first lesson day.</span>
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
            <Button variant="outline" className="w-full rounded-full py-6 text-lg flex-1" onClick={() => window.location.href = "/"}>
              Back to Home
            </Button>
            <Button className="w-full rounded-full py-6 text-lg bg-[#1D1D1F] text-white hover:bg-black flex-1" onClick={() => window.location.href = "/book"}>
              Book Another
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
