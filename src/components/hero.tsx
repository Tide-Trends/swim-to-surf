"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#b7ecff]">
      {/* Brighter image treatment so the swimmer's face stays visible. */}
      <div className="absolute inset-0">
        <Image
          src="/images/confidence-in-the-pool.png"
          alt="A happy swimmer underwater in the pool during a lesson"
          fill
          className="object-cover object-[58%_42%] scale-[1.03] brightness-110 contrast-95 saturate-110 sm:object-[56%_38%] md:object-[54%_34%]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-[#0ea5e9]/6" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0b5f82]/20 via-[#0b5f82]/6 via-50% to-transparent"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/6 via-transparent to-transparent" aria-hidden />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col justify-center px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-16 md:pt-32">
          {/* Readable block: all hero copy sits on one calm surface */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-xl rounded-[1.75rem] border border-white/70 bg-white/75 px-6 py-8 shadow-[0_20px_50px_-18px_rgba(0,60,90,0.45)] backdrop-blur-md sm:max-w-2xl sm:rounded-[2rem] sm:px-10 sm:py-10 md:px-12 md:py-11"
          >
            <div className="text-center text-[#07324a]">
              <p className="mb-5 font-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0b5f82]/90 md:mb-6 md:text-[11px]">
                Private lessons · American Fork, Utah
              </p>

              <h1 className="mb-4 font-display text-[clamp(2.5rem,8vw,4.75rem)] font-light leading-[0.95] tracking-[-0.03em] text-[#053149] md:mb-5">
                Swim to <span className="hero-surf-word font-normal text-[#0077B6]">Surf.</span>
              </h1>

              <p className="mx-auto mb-8 max-w-md text-[15px] font-normal leading-relaxed text-[#07324a]/90 sm:max-w-lg md:mb-9 md:text-lg md:leading-relaxed">
                Calm, one-on-one swim lessons for all ages. We coach with patience, build real water confidence, and create
                momentum that feels joyful from day one.
              </p>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Link
                  href="/book"
                  className="btn-cta-primary inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-8 py-3.5 font-ui text-sm font-bold uppercase tracking-[0.16em] shadow-lg md:text-base"
                >
                  Book swim lessons
                </Link>
                <Link
                  href="/about"
                  className="border-b border-[#0077B6]/40 pb-1 text-center font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#0b5f82] transition-colors hover:border-[#0077B6] hover:text-[#0077B6] sm:text-left"
                >
                  Our philosophy
                </Link>
              </div>

              <p className="mt-8 font-ui text-[10px] uppercase tracking-[0.18em] text-[#0b5f82]/70 md:mt-9">
                Real families · Real results · American Fork
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
