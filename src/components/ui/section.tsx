import { type ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  bg?: "white" | "sand" | "primary" | "warm";
}

const backgrounds = {
  white: "bg-white",
  sand: "bg-secondary",
  primary: "bg-primary text-white",
  warm: "bg-warm-white",
};

export function Section({ children, className = "", id, bg = "warm" }: SectionProps) {
  return (
    <section id={id} className={`py-20 md:py-28 ${backgrounds[bg]} ${className}`}>
      <div className="mx-auto max-w-7xl px-6 md:px-8">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-3xl mb-14 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="text-accent font-ui font-semibold text-sm uppercase tracking-widest mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl font-display font-bold">{title}</h2>
      {subtitle && <p className="mt-5 text-lg text-muted leading-relaxed">{subtitle}</p>}
    </div>
  );
}
