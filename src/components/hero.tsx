"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TRUST = ["Ages 0–99", "Private 1-on-1", "Safety-first", "American Fork, UT"];

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 64]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] w-full overflow-hidden bg-navy">
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <Image
          src="/images/confidence-in-the-pool.png"
          alt="A confident swimmer during a private lesson"
          fill
          className="object-cover object-[center_35%] md:object-center"
          sizes="100vw"
          priority
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-navy/94 via-navy/68 to-navy/30"
          style={{ opacity: overlayOpacity }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-navy/40" aria-hidden />
      </motion.div>

      <div className="relative z-10 flex min-h-[100svh] items-center pt-[5.5rem] pb-12 md:pt-[6rem] md:pb-16">
        <motion.div className="container-site w-full" style={{ y: contentY }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <span className="accent-rule mb-5" aria-hidden />
            <p className="mb-4 font-ui text-xs font-bold uppercase tracking-[0.2em] text-white">
              Private swim lessons
            </p>
            <h1 className="mb-5 text-[clamp(2.75rem,6.5vw,4.75rem)] leading-[1.02] tracking-tight text-white">
              Swim to <span className="hero-surf-word">Surf</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-white md:text-[1.35rem] md:leading-relaxed">
              One-on-one lessons for infants, kids, and adults. Safety-first coaching that builds real confidence from
              the first session.
            </p>

            <ul className="mb-10 flex flex-wrap gap-2">
              {TRUST.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.4 }}
                  className="rounded-full border border-white/25 bg-black/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
                >
                  {item}
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/book" className="btn-cta-primary px-9 py-3.5 text-center">
                Book a lesson
              </Link>
              <Link href="/about" className="btn-secondary px-9 py-3.5 text-center">
                How we teach
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
