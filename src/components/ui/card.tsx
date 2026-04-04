import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-6",
  md: "p-8 md:p-10",
  lg: "p-10 md:p-14",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md rounded-2xl border border-sand/50 shadow-sm ${paddings[padding]} ${
        hover ? "transition-all duration-500 hover:shadow-xl hover:border-sand hover:-translate-y-2" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
