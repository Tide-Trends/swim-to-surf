"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { TextReveal } from "./ui/animate";

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#062a36]">
      {/* Image fills the viewport — main focus */}
      <div className="absolute inset-0">
        <Image
          src="/images/confidence-in-the-pool.png"
          alt="A happy swimmer underwater in the pool during a lesson"
          fill
          className="object-cover object-[center_35%]"
          sizes="100vw"
          priority
        />
        {/* Readability: darken slightly + strong bottom gradient for type */}
        <div className="absolute inset-0 bg-[#062a36]/25" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#062a36] via-[#062a36]/75 via-35% to-transparent to-65%"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col pt-20 md:pt-24">
        <div className="flex flex-1 flex-col justify-end px-5 pb-10 pt-6 sm:px-8 md:px-10 md:pb-14">
          <div className="mx-auto w-full max-w-4xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 backdrop-blur-md md:mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#7dd3fc]" aria-hidden />
              <span className="text-[10px] font-ui font-bold uppercase tracking-[0.26em] text-white/95 md:text-[11px]">
                Private only · American Fork, Utah
              </span>
            </motion.div>

            <h1 className="mb-4 font-display text-[clamp(2.75rem,9vw,5.5rem)] font-light leading-[0.92] tracking-[-0.04em] text-white drop-shadow-sm md:mb-5">
              Swim to <span className="hero-surf-word font-normal text-[#b9f0ff]">Surf.</span>
            </h1>

            <div className="mx-auto mb-8 max-w-xl text-base font-normal leading-relaxed text-white/88 md:mb-10 md:text-lg md:leading-relaxed">
              <TextReveal
                delay={0.1}
                text="Calm, one-on-one swim lessons for all ages. We coach with patience, build real water confidence, and create momentum that feels joyful from day one."
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-5"
            >
              <Link
                href="/book"
                className="btn-cta-primary inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-8 py-3.5 font-ui text-sm font-bold uppercase tracking-[0.18em] shadow-lg shadow-black/25 md:text-base"
              >
                Book swim lessons
              </Link>
              <Link
                href="/about"
                className="border-b border-white/35 pb-1 text-center font-ui text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white hover:text-white sm:text-left"
              >
                Our philosophy
              </Link>
            </motion.div>

            <p className="mt-8 font-ui text-[10px] uppercase tracking-[0.2em] text-white/50 md:mt-10">
              Real families · Real pool · American Fork
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
