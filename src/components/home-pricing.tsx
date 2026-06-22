"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { PRICING } from "@/lib/constants";
import { FadeIn } from "@/components/ui/animate";

type Tab = "lukaah" | "estee";

function PriceCard({ href, children, featured }: { href: string; children: ReactNode; featured?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative block h-full overflow-hidden rounded-2xl border p-7 transition-all duration-300 md:p-8 ${
        featured
          ? "border-gold/40 bg-white shadow-lift"
          : "border-white/15 bg-white/95 hover:border-gold/30 hover:bg-white"
      }`}
    >
      {featured && (
        <span className="absolute right-4 top-4 rounded-full bg-gold/20 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-navy">
          Popular
        </span>
      )}
      {children}
      <p className="mt-5 text-sm font-medium text-deep opacity-0 transition-opacity group-hover:opacity-100">
        Book this plan →
      </p>
    </Link>
  );
}

export function HomePricing() {
  const [tab, setTab] = useState<Tab>("estee");

  return (
    <section className="section-pad border-b border-navy/20 bg-deep">
      <div className="container-site">
        <FadeIn className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <span className="accent-rule mx-auto mb-5" aria-hidden />
          <p className="eyebrow mb-3 !text-gold">Pricing</p>
          <h2 className="section-title text-white">Simple, transparent rates.</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Tap a plan to start booking — same prices online and at checkout.
          </p>
        </FadeIn>

        <div className="mx-auto mb-10 flex max-w-md rounded-xl border border-white/15 bg-navy/50 p-1">
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
                tab === t.id ? "bg-white shadow-soft" : "text-white/75 hover:text-white"
              }`}
            >
              <span className={`block text-sm font-semibold ${tab === t.id ? "text-navy" : ""}`}>{t.label}</span>
              <span
                className={`mt-0.5 block text-[0.625rem] uppercase tracking-wider ${tab === t.id ? "text-body" : "text-white/60"}`}
              >
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        {tab === "lukaah" ? (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <PriceCard href="/book?instructor=lukaah" featured>
                <p className="eyebrow mb-2 !text-gold">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.infant.label}</p>
                <p className="mt-1 text-sm text-body">per week · 5 × {PRICING.infant.duration} min</p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  One intensive week, same time daily.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1}>
              <PriceCard href="/book?instructor=lukaah">
                <p className="eyebrow mb-2">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.standard.label}</p>
                <p className="mt-1 text-sm text-body">per week · 5 × {PRICING.standard.duration} min</p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  Daily private sessions for one week.
                </p>
              </PriceCard>
            </FadeIn>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <PriceCard href="/book?instructor=estee" featured>
                <p className="eyebrow mb-2 !text-gold">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeInfantMonthly.label}</p>
                <p className="mt-1 text-sm text-body">
                  per month · {PRICING.esteeInfantMonthly.lessons} × {PRICING.esteeInfantMonthly.duration} min
                </p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  One weekly Wed or Thu slot.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1}>
              <PriceCard href="/book?instructor=estee">
                <p className="eyebrow mb-2">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeMonthly.label}</p>
                <p className="mt-1 text-sm text-body">
                  per month · {PRICING.esteeMonthly.lessons} × {PRICING.esteeMonthly.duration} min
                </p>
                <p className="mt-2 text-xs font-medium text-water">Add a second weekly slot for 8 lessons (2× rate).</p>
                <p className="mt-5 border-t border-navy/10 pt-4 text-sm leading-relaxed text-body">
                  Steady monthly progress.
                </p>
              </PriceCard>
            </FadeIn>
          </div>
        )}

        <FadeIn delay={0.15} className="mt-10 text-center">
          <Link
            href={tab === "estee" ? "/book?instructor=estee" : "/book?instructor=lukaah"}
            className="btn-cta-primary inline-flex bg-white text-navy hover:bg-cream"
          >
            Book lessons
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
