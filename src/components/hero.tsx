"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { TextReveal } from "./ui/animate";
import { OceanWave, WaterLineArt } from "./ui/animated-backgrounds";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <section ref={ref} className="relative h-screen min-h-[800px] w-full overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00B4D8 0%, #0077B6 40%, #0096C7 100%)" }}>
      {/* Background with Gradient, SVGs, and Bubbles */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <WaterLineArt />
      </motion.div>

      {/* SVG Wave at the bottom bridging to the next section */}
      <div className="absolute bottom-0 left-0 w-full h-[150px] z-20">
        <OceanWave fill="var(--color-warm-white)" opacity={0.15} speed={20} direction="right" className="bottom-0 h-full" />
        <OceanWave fill="var(--color-warm-white)" opacity={0.25} speed={15} direction="left" className="bottom-0 h-[80%]" />
        <OceanWave fill="var(--color-warm-white)" opacity={1} speed={25} direction="right" className="-bottom-2 h-[60%]" />
      </div>

      {/* Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-30 container mx-auto px-6 max-w-7xl flex flex-col items-center text-center -mt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sunshine animate-pulse shadow-[0_0_10px_var(--color-sunshine)]" />
          <span className="text-xs font-ui uppercase tracking-[0.2em] text-white">Private Lessons in American Fork</span>
        </motion.div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display text-white tracking-tighter mb-6 leading-[0.9] max-w-5xl font-light">
          Swim to <span className="text-gradient relative z-10 text-sunshine">Surf.</span>
        </h1>
        
        <div className="text-lg md:text-2xl text-white max-w-2xl font-light mb-12 leading-relaxed">
          <TextReveal delay={0.3} text="From first splashes to confident strokes. Private, one-on-one swim lessons designed for absolute focus and rapid progress." />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <Link
            href="/book"
            className="group relative inline-flex items-center justify-center px-12 py-5 font-ui text-lg font-bold uppercase tracking-widest text-white bg-coral rounded-full shadow-[0_0_40px_rgba(239,71,111,0.6)] overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-[#ff3366] hover:shadow-[0_0_60px_rgba(239,71,111,0.8)]"
          >
            <span className="relative z-10">Book Swim Lessons</span>
          </Link>
          <Link
            href="/about"
            className="px-10 py-4 font-ui text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:text-sunshine opacity-80 hover:opacity-100"
          >
            Our Philosophy
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] font-ui uppercase tracking-[0.2em] text-white/60">Scroll</span>
        <motion.div 
          animate={{ height: ["0px", "40px", "0px"], opacity: [0, 1, 0], y: [0, 20, 40] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-[1px] bg-sunshine" 
        />
      </motion.div>
    </section>
  );
}
