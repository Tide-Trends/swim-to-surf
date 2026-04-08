"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.06]);
  const imageOpacity = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#b7ecff]"
    >
      {/* Photo with subtle parallax as you scroll */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY, scale: imageScale, opacity: imageOpacity }}
      >
        <Image
          src="/images/confidence-in-the-pool.png"
          alt="A happy swimmer underwater in the pool during a lesson"
          fill
          className="object-cover object-center brightness-110 contrast-95 saturate-110"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-[#0ea5e9]/6" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0b5f82]/18 via-[#0b5f82]/6 via-50% to-transparent"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/6 via-transparent to-transparent" aria-hidden />
      </motion.div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between">
        {/* Top spacer so the image and face are clearly visible with minimal overlap */}
        <div className="h-[18vh] sm:h-[20vh] md:h-[22vh]" />

        {/* Title + CTA band anchored toward bottom, not over the swimmer's face */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 pb-16 sm:px-6 md:px-10 lg:px-16"
        >
          <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/55 bg-white/36 px-5 py-6 shadow-[0_18px_42px_-22px_rgba(0,60,90,0.45)] backdrop-blur-sm sm:rounded-[2rem] sm:px-9 sm:py-7 md:px-10 md:py-8">
            <div className="text-center text-[#07324a]">
              <p className="mb-4 font-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0b5f82]/90 md:mb-5 md:text-[11px]">
                Private lessons · American Fork, Utah
              </p>

              <h1 className="mb-3 font-display text-[clamp(2.4rem,6.5vw,4.25rem)] font-light leading-[0.98] tracking-[-0.03em] text-[#053149] md:mb-4">
                Swim to <span className="hero-surf-word font-normal text-[#0077B6]">Surf.</span>
              </h1>

              <p className="mx-auto mb-7 max-w-xl text-[15px] font-normal leading-relaxed text-[#07324a]/92 md:text-[17px] md:leading-relaxed">
                Calm, one-on-one swim lessons that build real water confidence and joy from day one.
              </p>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Link
                  href="/book"
                  className="btn-cta-primary inline-flex min-h-[3.1rem] items-center justify-center rounded-full px-8 py-3.5 font-ui text-sm font-bold uppercase tracking-[0.16em] shadow-lg md:text-base"
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
            </div>
          </div>

          {/* Explicit scroll affordance */}
          <div className="mt-8 flex flex-col items-center gap-2 text-[#0b5f82]/85">
            <p className="font-ui text-[11px] uppercase tracking-[0.22em]">Scroll to see how it works</p>
            <div className="h-8 w-px bg-[#0b5f82]/35" />
            <div className="animate-bounce-slow">
              <span className="inline-block rounded-full border border-[#0b5f82]/40 px-3 py-1 font-ui text-[11px] uppercase tracking-[0.2em]">
                ↓ Keep scrolling
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
