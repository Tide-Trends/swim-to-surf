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
          ? "border-water/25 bg-white shadow-glow"
          : "border-navy/8 bg-white/90 hover:border-navy/14 hover:shadow-soft"
      }`}
    >
      {featured && (
        <span className="absolute right-4 top-4 rounded-full bg-gold/15 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-navy">
          Popular
        </span>
      )}
      {children}
      <p className="mt-5 text-sm font-medium text-water opacity-0 transition-opacity group-hover:opacity-100">
        Book this plan →
      </p>
    </Link>
  );
}

export function HomePricing() {
  const [tab, setTab] = useState<Tab>("estee");

  return (
    <section className="section-pad border-b border-navy/8 bg-white">
      <div className="container-site">
        <FadeIn className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <span className="accent-rule mx-auto mb-5" aria-hidden />
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="section-title">Simple, transparent rates.</h2>
          <p className="section-lead mt-4">Tap a plan to start booking — same prices online and at checkout.</p>
        </FadeIn>

        <div className="mx-auto mb-10 flex max-w-md rounded-xl border border-navy/10 bg-sand/60 p-1">
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
                tab === t.id ? "bg-white shadow-soft" : "text-muted hover:text-navy"
              }`}
            >
              <span className="block text-sm font-semibold text-navy">{t.label}</span>
              <span className="mt-0.5 block text-[0.625rem] uppercase tracking-wider text-muted">{t.sub}</span>
            </button>
          ))}
        </div>

        {tab === "lukaah" ? (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <PriceCard href="/book?instructor=lukaah" featured>
                <p className="eyebrow mb-2 text-gold">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.infant.label}</p>
                <p className="mt-1 text-sm text-muted">per week · 5 × {PRICING.infant.duration} min</p>
                <p className="mt-5 border-t border-navy/8 pt-4 text-sm leading-relaxed text-muted">
                  One intensive week, same time daily.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1}>
              <PriceCard href="/book?instructor=lukaah">
                <p className="eyebrow mb-2">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.standard.label}</p>
                <p className="mt-1 text-sm text-muted">per week · 5 × {PRICING.standard.duration} min</p>
                <p className="mt-5 border-t border-navy/8 pt-4 text-sm leading-relaxed text-muted">
                  Daily private sessions for one week.
                </p>
              </PriceCard>
            </FadeIn>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <PriceCard href="/book?instructor=estee" featured>
                <p className="eyebrow mb-2 text-gold">Infant · 0–2</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeInfantMonthly.label}</p>
                <p className="mt-1 text-sm text-muted">
                  per month · {PRICING.esteeInfantMonthly.lessons} × {PRICING.esteeInfantMonthly.duration} min
                </p>
                <p className="mt-5 border-t border-navy/8 pt-4 text-sm leading-relaxed text-muted">
                  One weekly Wed or Thu slot.
                </p>
              </PriceCard>
            </FadeIn>
            <FadeIn delay={0.1}>
              <PriceCard href="/book?instructor=estee">
                <p className="eyebrow mb-2">Standard · 3+</p>
                <p className="font-display text-4xl text-navy md:text-5xl">{PRICING.esteeMonthly.label}</p>
                <p className="mt-1 text-sm text-muted">
                  per month · {PRICING.esteeMonthly.lessons} × {PRICING.esteeMonthly.duration} min
                </p>
                <p className="mt-2 text-xs text-water">Add a second weekly slot for 8 lessons (2× rate).</p>
                <p className="mt-5 border-t border-navy/8 pt-4 text-sm leading-relaxed text-muted">
                  Steady monthly progress.
                </p>
              </PriceCard>
            </FadeIn>
          </div>
        )}

        <FadeIn delay={0.15} className="mt-10 text-center">
          <Link href={tab === "estee" ? "/book?instructor=estee" : "/book?instructor=lukaah"} className="btn-cta-primary">
            Book lessons
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
