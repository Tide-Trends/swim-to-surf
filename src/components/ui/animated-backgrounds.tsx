"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function OceanWave({
  className = "",
  fill = "currentColor",
  opacity = 1,
  direction = "left",
  speed = 15,
}: {
  className?: string;
  fill?: string;
  opacity?: number;
  direction?: "left" | "right";
  speed?: number;
}) {
  return (
    <div className={`pointer-events-none absolute w-full overflow-hidden leading-[0] ${className}`}>
      <motion.svg
        initial={{ x: direction === "left" ? "0%" : "-50%" }}
        animate={{ x: direction === "left" ? "-50%" : "0%" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
        className="relative block w-[200%] h-full min-w-[1000px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          fill={fill}
          style={{ opacity }}
        />
        <path
          d="M1200,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C1638.64,32.43,1712.34,53.67,1783,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C2189.49,25,2313-14.29,2400,52.47V0Z"
          fill={fill}
          style={{ opacity }}
          transform="translate(1200, 0)"
        />
      </motion.svg>
    </div>
  );
}

/** Soft light blooms + caustic shimmer for hero sections over ocean gradients */
export function HeroAmbientLayers() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute -top-[20%] left-1/2 h-[85%] w-[140%] -translate-x-1/2 rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 42%, transparent 70%)",
        }}
      />
      <div
        className="absolute -right-[10%] top-[15%] h-[55vmin] w-[55vmin] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,209,102,0.35) 0%, transparent 68%)" }}
      />
      <div
        className="absolute -left-[15%] bottom-[5%] h-[45vmin] w-[45vmin] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(72,202,228,0.5) 0%, transparent 65%)" }}
      />
      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "240px 240px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="heroCaustic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <motion.path
          fill="none"
          stroke="url(#heroCaustic)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          d="M0,220 Q280,160 560,210 T1120,180 T1400,240"
        />
        <motion.g
          animate={{ x: [0, -90, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <path
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            d="M-80,280 Q200,240 520,290 T1080,250 T1600,300"
          />
        </motion.g>
      </svg>
    </div>
  );
}

export function WaterLineArt() {
  const [items, setItems] = useState<any[]>([]);

  const icons = [
    // Goggles
    <path d="M4 10C4 7 7 7 10 7C13 7 16 7 16 10M4 10C4 13 7 13 10 13C13 13 16 13 16 10M10 10V11M6 10C6 8.5 8 8.5 8 10C8 11.5 6 11.5 6 10M12 10C12 8.5 14 8.5 14 10C14 11.5 12 11.5 12 10" />,
    // Fish
    <path d="M2.5 10C2.5 7 7 5 11 5C15 5 17.5 8 17.5 10C17.5 12 15 15 11 15C7 15 2.5 13 2.5 10ZM17.5 10L21.5 7V13L17.5 10Z" />,
    // Turtle
    <path d="M10 5C7 5 5 7 5 10C5 13 7 15 10 15C13 15 15 13 15 10C15 7 13 5 10 5ZM15 8.5C17 8 18.5 9.5 18 11C18.5 12.5 17 14 15 13.5M5 8.5C3 8 1.5 9.5 2 11C1.5 12.5 3 14 5 13.5M10 5C10 3 12 3 12 5M10 15C10 17 12 17 12 15" />,
    // Floatie (Donut)
    <path d="M10 2.5C5.8 2.5 2.5 5.8 2.5 10C2.5 14.2 5.8 17.5 10 17.5C14.2 17.5 17.5 14.2 17.5 10C17.5 5.8 14.2 2.5 10 2.5ZM10 7.5C8.6 7.5 7.5 8.6 7.5 10C7.5 11.4 8.6 12.5 10 12.5C11.4 12.5 12.5 11.4 12.5 10C12.5 8.6 11.4 7.5 10 7.5Z" />,
    // Starfish
    <path d="M10 2L12 7H17L13 10L14.5 15L10 12L5.5 15L7 10L3 7H8L10 2Z" />
  ];

  useEffect(() => {
    setItems(
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        iconIdx: i % icons.length,
        size: Math.random() * 40 + 40,
        left: `${Math.random() * 100}%`,
        xOffset: Math.random() * 100 - 50,
        duration: Math.random() * 20 + 20,
        delay: Math.random() * 10,
        rotate: Math.random() * 360,
      }))
    );
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="absolute text-white/35"
          style={{
            width: item.size,
            height: item.size,
            left: item.left,
            bottom: "-15%",
          }}
          animate={{
            y: ["0vh", "-130vh"],
            x: [0, item.xOffset, 0],
            rotate: [item.rotate, item.rotate + 360],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "linear",
            delay: item.delay,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-full h-full"
          >
            {icons[item.iconIdx]}
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
