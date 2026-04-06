"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { TextReveal } from "./ui/animate";

export function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center overflow-x-hidden bg-[#fdfbf6] pt-20 pb-16 md:min-h-0 md:pt-24 md:pb-20">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-28 left-1/2 h-[420px] w-[92vw] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(255,237,188,0.8)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute -left-12 top-32 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(144,224,239,0.45)_0%,rgba(255,255,255,0)_70%)] blur-2xl" />
        <div className="absolute -right-6 bottom-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,209,102,0.5)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-6 md:pt-10">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-14">
          {/* Photo first on small screens — feels personal and welcoming */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 mx-auto w-full max-w-md md:order-2 md:mx-0 md:max-w-none"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-[#0b5c79]/10 bg-white shadow-[0_24px_64px_rgba(11,92,121,0.12)] ring-1 ring-black/[0.04]">
              <Image
                src="/images/confidence-in-the-pool.png"
                alt="A happy swimmer in the pool during a lesson — real lessons, real kids, real progress"
                width={960}
                height={640}
                className="h-auto w-full object-cover object-[center_40%]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <p className="mt-3 text-center font-ui text-[10px] uppercase tracking-[0.2em] text-dark/45 md:text-left">
              Real families · Real pool · American Fork
            </p>
          </motion.div>

          <div className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#0b5c79]/10 bg-white px-6 py-3 shadow-[0_10px_32px_rgba(11,92,121,0.08)] md:mb-8"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0ba7d6]" aria-hidden />
              <span className="text-[10px] font-ui font-bold uppercase tracking-[0.26em] text-[#0b5c79] md:text-[11px]">
                Private only · American Fork, Utah
              </span>
            </motion.div>

            <h1 className="mb-5 max-w-[14ch] font-display text-[clamp(3rem,10vw,6.2rem)] font-light leading-[0.9] tracking-[-0.045em] text-dark md:mb-7 md:max-w-[12ch]">
              Swim to <span className="hero-surf-word font-normal">Surf.</span>
            </h1>

            <div className="mb-8 max-w-xl text-base font-normal leading-relaxed text-dark/75 md:mb-10 md:text-xl md:leading-relaxed">
              <TextReveal
                delay={0.15}
                text="Calm, one-on-one swim lessons for all ages. We coach with patience, build real water confidence, and create momentum that feels joyful from day one."
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-full max-w-xl flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center md:justify-start sm:gap-6"
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
        </div>
      </div>
    </section>
  );
}
