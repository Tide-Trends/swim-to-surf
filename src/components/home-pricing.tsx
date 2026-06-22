"use client";

import { useState, type ReactNode } from "react";
import { PRICING } from "@/lib/constants";
import { FadeIn } from "@/components/ui/animate";
import { BookLink } from "@/components/booking/book-link";

type Tab = "lukaah" | "estee";

function PriceCard({
  instructor,
  featured,
  fullWidth,
  children,
}: {
  instructor: "lukaah" | "estee";
  featured?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <BookLink
      instructor={instructor}
      className={`group relative block h-full overflow-hidden rounded-2xl border p-7 transition-all duration-300 md:p-8 ${
        fullWidth ? "md:col-span-2" : ""
      } ${
        featured
          ? "border-gold/50 bg-white shadow-lift ring-1 ring-gold/20"
          : "border-white/15 bg-white/95 hover:border-gold/30 hover:bg-white"
      }`}
    >
      {featured && (
        <span className="absolute right-4 top-4 rounded-full bg-gold/25 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-navy">
          Popular · 30 min
        </span>
      )}
      {children}
      <p className="mt-5 text-sm font-medium text-deep opacity-0 transition-opacity group-hover:opacity-100">
        Book this plan →
      </p>
    </BookLink>
  );
}

export function HomePricing() {
  const [tab, setTab] = useState<Tab>("estee");

  return (
    <section className="section-pad border-b border-navy/20 bg-sand">
      <div className="container-site">
        <FadeIn className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <span className="accent-rule mx-auto mb-5" aria-hidden />
          <p className="eyebrow mb-3 !text-deep">Pricing</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.08] tracking-[-0.025em] text-navy">
            Simple, transparent rates.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">
            Tap a plan to start booking — same prices online and at checkout.
          </p>
        </FadeIn>

        <div className="mx-auto mb-10 flex max-w-md rounded-xl border border-navy/10 bg-white p-1 shadow-soft">
          {(
            [
              { id: "estee" as const, label: "Estee", sub: "Monthly · Wed & Thu" },
              { id: "lukaah" as const, label: "Lukaah", sub: "Weekly · Mon–Fri" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-4 py-3 text-center transition-all duration-200 ${
                tab === t.id ? "bg-deep text-white shadow-soft" : "text-body hover:text-navy"
              }`}
            >
              <span className={`block text-sm font-semibold ${tab === t.id ? "text-white" : "text-navy"}`}>
                {t.label}
              </span>
              <span
                className={`mt-0.5 block text-[0.625rem] uppercase tracking-wider ${
                  tab === t.id ? "text-white/80" : "text-subtle"
                }`}
              >
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        {tab === "lukaah" ? (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05} className="md:col-span-2">
              <PriceCard instructor="lukaah" featured fullWidth>
                <p className="eyebrow mb-2 !text-gold">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.standard.label}</p>
                <p className="mt-1 text-sm font-medium text-body">
                  per week · 5 × {PRICING.standard.duration} min lessons
                </p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  Our most popular plan — one private 30-minute session every weekday for a full week.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1} className="flex justify-center md:col-span-2">
              <div className="w-full max-w-md">
              <PriceCard instructor="lukaah">
                <p className="eyebrow mb-2">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.infant.label}</p>
                <p className="mt-1 text-sm text-body">per week · 5 × {PRICING.infant.duration} min</p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  Shorter daily sessions for babies and toddlers.
                </p>
              </PriceCard>
              </div>
            </FadeIn>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05} className="md:col-span-2">
              <PriceCard instructor="estee" featured fullWidth>
                <p className="eyebrow mb-2 !text-gold">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeMonthly.label}</p>
                <p className="mt-1 text-sm font-medium text-body">
                  per month · {PRICING.esteeMonthly.lessons} × {PRICING.esteeMonthly.duration} min lessons
                </p>
                <p className="mt-2 text-xs font-medium text-water">Add a second weekly slot for 8 lessons (2× rate).</p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  Steady monthly progress with 30-minute private sessions.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1} className="flex justify-center md:col-span-2">
              <div className="w-full max-w-md">
              <PriceCard instructor="estee">
                <p className="eyebrow mb-2">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeInfantMonthly.label}</p>
                <p className="mt-1 text-sm text-body">
                  per month · {PRICING.esteeInfantMonthly.lessons} × {PRICING.esteeInfantMonthly.duration} min
                </p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  One weekly Wed or Thu slot for little ones.
                </p>
              </PriceCard>
              </div>
            </FadeIn>
          </div>
        )}

        <FadeIn delay={0.15} className="mt-10 text-center">
          <BookLink
            instructor={tab}
            className="btn-cta-primary inline-flex bg-deep text-white hover:bg-navy"
          >
            Book lessons
          </BookLink>
        </FadeIn>
      </div>
    </section>
  );
}
