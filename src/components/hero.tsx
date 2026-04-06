"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#062a36]">
      {/* Image: focal point lower in frame so the subject sits “down” in the photo; text sits higher in the layout */}
      <div className="absolute inset-0">
        <Image
          src="/images/confidence-in-the-pool.png"
          alt="A happy swimmer underwater in the pool during a lesson"
          fill
          className="object-cover object-[56%_62%] scale-[1.06] sm:object-[54%_52%] md:object-[52%_48%]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-[#062a36]/28" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#062a36]/50 via-transparent via-45% to-[#062a36]/90 to-100%"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#062a36] from-0% via-[#062a36]/55 via-35% to-transparent to-65%"
          aria-hidden
        />
      </div>

      {/* Text block sits higher (centered in viewport) instead of pinned to the bottom */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col justify-center px-5 pb-16 pt-28 sm:px-8 md:px-10 md:pb-14 md:pt-32">
          <div className="mx-auto w-full max-w-2xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5 rounded-full border border-white/15 bg-black/20 px-5 py-2 backdrop-blur-sm md:mb-6"
            >
              <span className="text-[10px] font-ui font-semibold uppercase tracking-[0.22em] text-white/90 md:text-[11px]">
                Private lessons · American Fork, Utah
              </span>
            </motion.div>

            <h1 className="mb-4 font-display text-[clamp(2.75rem,9vw,5.5rem)] font-light leading-[0.92] tracking-[-0.04em] text-white md:mb-5 md:drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
              Swim to <span className="hero-surf-word font-normal text-[#b9f0ff]">Surf.</span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mb-8 max-w-lg text-base font-normal leading-relaxed text-white/90 md:mb-10 md:text-lg md:leading-relaxed"
            >
              Calm, one-on-one swim lessons for all ages. We coach with patience, build real water confidence, and create
              momentum that feels joyful from day one.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-5"
            >
              <Link
                href="/book"
                className="btn-cta-primary inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-8 py-3.5 font-ui text-sm font-bold uppercase tracking-[0.18em] shadow-lg shadow-black/20 md:text-base"
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

            <p className="mt-8 font-ui text-[10px] uppercase tracking-[0.2em] text-white/45 md:mt-10">
              Real families · Real results · American Fork
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
