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
          className="absolute text-ocean-light/25"
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
