"use client";

import { useState } from "react";
import Link from "next/link";
import { PRICING } from "@/lib/constants";
import { FadeIn } from "@/components/ui/animate";

type InstructorTab = "lukaah" | "estee";

export function HomePricing() {
  const [tab, setTab] = useState<InstructorTab>("lukaah");

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{ background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 50%, #0096C7 100%)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-warm-white via-warm-white/75 to-transparent" />

      <div className="container relative z-20 mx-auto max-w-7xl px-6">
        <FadeIn className="mb-10 text-center md:mb-14">
          <h2 className="mb-4 font-display text-4xl tracking-tight text-white md:text-6xl md:leading-tight">
            Transparent <span className="text-sunshine opacity-95">pricing</span>
          </h2>
          <p className="mx-auto max-w-xl text-base text-white/85 md:text-lg">
            Same rates on the site as at checkout. Pick an instructor to see their lesson format.
          </p>
        </FadeIn>

        <div className="mx-auto mb-10 flex max-w-md justify-center rounded-full bg-black/15 p-1.5 backdrop-blur-sm">
          {(
            [
              { id: "lukaah" as const, label: "Lukaah", sub: "Mon–Fri week" },
              { id: "estee" as const, label: "Estee", sub: "Wed & Thu monthly" },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-4 py-3 text-center transition-all md:px-6 ${
                tab === t.id
                  ? "bg-white font-semibold text-[#0a4a5c] shadow-md"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <span className="block font-ui text-sm font-bold tracking-wide">{t.label}</span>
              <span className="mt-0.5 block font-ui text-[10px] uppercase tracking-[0.14em] opacity-80">{t.sub}</span>
            </button>
          ))}
        </div>

        {tab === "lukaah" ? (
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border-2 border-sunshine/50 bg-[#005a8c]/40 p-8 backdrop-blur-sm md:p-9">
                <div>
                  <span className="mb-3 inline-block rounded-full border border-sunshine/60 bg-sunshine/20 px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-sunshine">
                    Infant · 0–2
                  </span>
                  <p className="font-display text-4xl font-light tracking-tighter text-sunshine md:text-5xl">{PRICING.infant.label}</p>
                  <p className="mt-1 text-sm text-white/80">per week · 5 × {PRICING.infant.duration} min (Mon–Fri)</p>
                </div>
                <p className="mt-6 border-t border-white/20 pt-4 text-sm leading-relaxed text-white/90">
                  One intensive week, same time daily. Great for building a fast foundation.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/25 bg-white/10 p-8 backdrop-blur-sm md:p-9">
                <div>
                  <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    Standard · 3+
                  </span>
                  <p className="font-display text-4xl font-light tracking-tighter text-white md:text-5xl">{PRICING.standard.label}</p>
                  <p className="mt-1 text-sm text-white/80">per week · 5 × {PRICING.standard.duration} min (Mon–Fri)</p>
                </div>
                <p className="mt-6 border-t border-white/20 pt-4 text-sm leading-relaxed text-white/90">
                  Daily private sessions for one week — ideal for school-age swimmers and adults.
                </p>
              </div>
            </FadeIn>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border-2 border-sunshine/45 bg-[#005a8c]/35 p-8 backdrop-blur-sm md:p-9">
                <div>
                  <span className="mb-3 inline-block rounded-full border border-sunshine/55 bg-sunshine/15 px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-sunshine">
                    Infant · 0–2
                  </span>
                  <p className="font-display text-4xl font-light tracking-tighter text-sunshine md:text-5xl">
                    {PRICING.esteeInfantMonthly.label}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    per month · {PRICING.esteeInfantMonthly.lessons} × {PRICING.esteeInfantMonthly.duration} min
                  </p>
                </div>
                <p className="mt-6 border-t border-white/20 pt-4 text-sm leading-relaxed text-white/90">
                  One weekly slot on Wednesday or Thursday (your choice when booking).
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border border-sunshine/35 bg-white/10 p-8 backdrop-blur-sm md:p-9">
                <div>
                  <span className="mb-3 inline-block rounded-full bg-sunshine/20 px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-sunshine">
                    Standard · 3+
                  </span>
                  <p className="font-display text-4xl font-light tracking-tighter text-white md:text-5xl">{PRICING.esteeMonthly.label}</p>
                  <p className="mt-1 text-sm text-white/80">
                    per month · {PRICING.esteeMonthly.lessons} × {PRICING.esteeMonthly.duration} min
                  </p>
                  <p className="mt-2 text-xs text-sunshine/90">Optional second weekly slot → 8 lessons (2× monthly rate).</p>
                </div>
                <p className="mt-6 border-t border-white/20 pt-4 text-sm leading-relaxed text-white/90">
                  Steady progress across the month with Estee on Wed/Thu.
                </p>
              </div>
            </FadeIn>
          </div>
        )}

        <FadeIn delay={0.15} className="mt-10 text-center">
          <Link
            href="/book"
            className="btn-cta-primary inline-flex min-h-[3rem] items-center justify-center rounded-full px-10 py-3 font-ui text-xs font-bold uppercase tracking-[0.2em] md:text-sm"
          >
            Book lessons
          </Link>
        </FadeIn>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-warm-white via-warm-white/75 to-transparent" />
    </section>
  );
}
