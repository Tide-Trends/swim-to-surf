"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TextReveal } from "./ui/animate";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [softScroll, setSoftScroll] = useState(true);

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqNarrow = window.matchMedia("(max-width: 768px)");
    const sync = () => setSoftScroll(!mqReduce.matches && !mqNarrow.matches);
    sync();
    mqReduce.addEventListener("change", sync);
    mqNarrow.addEventListener("change", sync);
    return () => {
      mqReduce.removeEventListener("change", sync);
      mqNarrow.removeEventListener("change", sync);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end 0.45"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], softScroll ? [1, 0.12] : [1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], softScroll ? ["0%", "18%"] : ["0%", "0%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[800px] w-full flex-col items-center overflow-x-hidden bg-[#fdfbf6] pt-24 pb-20 md:min-h-0 md:pt-28 md:pb-24"
      style={{ minHeight: "min(100dvh, 920px)" }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-28 left-1/2 h-[420px] w-[92vw] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(255,237,188,0.8)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute -left-12 top-32 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(144,224,239,0.45)_0%,rgba(255,255,255,0)_70%)] blur-2xl" />
        <div className="absolute -right-6 bottom-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,209,102,0.5)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-8 text-center md:pt-16"
      >
        <div className="flex w-full flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#0b5c79]/10 bg-white px-6 py-3 shadow-[0_10px_32px_rgba(11,92,121,0.08)] md:mb-10"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#0ba7d6]" aria-hidden />
            <span className="text-[10px] font-ui font-bold uppercase tracking-[0.26em] text-[#0b5c79] md:text-[11px]">
              Private only · American Fork, Utah
            </span>
          </motion.div>

          <h1 className="mb-6 max-w-[14ch] font-display text-[clamp(3rem,10vw,6.2rem)] font-light leading-[0.9] tracking-[-0.045em] text-dark md:mb-8">
            Swim to <span className="hero-surf-word font-normal">Surf.</span>
          </h1>

          <div className="mb-10 max-w-2xl text-base font-normal leading-relaxed text-dark/75 md:mb-12 md:text-xl md:leading-relaxed">
            <TextReveal
              delay={0.26}
              text="Calm, one-on-one swim lessons for all ages. We coach with patience, build real water confidence, and create momentum that feels joyful from day one."
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex w-full max-w-xl flex-col items-stretch gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
          >
            <Link
              href="/book"
              className="btn-cta-primary inline-flex min-h-[3.4rem] w-full items-center justify-center rounded-full px-8 py-4 font-ui text-sm font-bold uppercase tracking-[0.2em] sm:w-auto sm:min-w-[280px] md:text-base"
            >
              Book swim lessons
            </Link>
            <Link
              href="/about"
              className="border-b border-dark/20 pb-1 text-center font-ui text-[11px] font-bold uppercase tracking-[0.24em] text-dark/70 transition-all duration-300 hover:border-dark hover:text-dark sm:text-left"
            >
              Our philosophy
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Static stats — stay fully readable while scrolling (not tied to parallax fade) */}
      <div className="relative z-20 mx-auto mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 px-6 sm:mt-10 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
          <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Private lessons</p>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">One coach, one swimmer</p>
        </div>
        <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
          <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Ages</p>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">Infants to adults</p>
        </div>
        <div className="rounded-2xl border border-[#0b5c79]/20 bg-white px-4 py-4 text-left shadow-sm sm:py-3.5">
          <p className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-dark/55">Location</p>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-dark">American Fork, UT</p>
        </div>
      </div>

      <motion.div
        style={{ opacity }}
        className="relative z-30 mt-10 flex flex-col items-center gap-3 pb-6 md:absolute md:bottom-8 md:left-1/2 md:mt-0 md:-translate-x-1/2 md:pb-0"
      >
        <span className="text-[10px] font-ui font-semibold uppercase tracking-[0.28em] text-dark/35">Scroll</span>
        <motion.div
          animate={{ height: ["0px", "36px", "0px"], opacity: [0, 1, 0], y: [0, 16, 32] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-px rounded-full bg-gradient-to-b from-[#0ba7d6]/80 via-[#0ba7d6]/35 to-transparent"
        />
      </motion.div>
    </section>
  );
}
