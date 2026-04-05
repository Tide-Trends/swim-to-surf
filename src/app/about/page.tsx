"use client";

import { FadeIn, StaggerChildren, StaggerItem, TextReveal } from "@/components/ui/animate";
import { getProfilesFromStorage } from "@/lib/instructor-content";
import { useMemo } from "react";
import Link from "next/link";

const values = [
  {
    title: "Safety Is Non-Negotiable",
    body: "With drowning being a leading cause of death among children, water safety isn't optional — it's our starting point. Every swimmer learns survival skills before anything else.",
  },
  {
    title: "Every Lesson Is Private",
    body: "We've seen firsthand that group lessons rarely deliver results. One-on-one instruction means your swimmer gets full attention, moves at their own pace, and makes real progress every session.",
  },
  {
    title: "No Levels, No Boxes",
    body: "Rigid level systems limit what we can teach and what swimmers can learn. Instead, we meet each swimmer where they are, build on what they already know, and practice every skill until it's truly mastered.",
  },
  {
    title: "Confidence Over Checklists",
    body: "Our goal isn't to rush through skills. It's to develop swimmers who feel genuinely comfortable and capable in the water — whether that's a backyard pool, a lake, or the open ocean.",
  },
];

export default function AboutPage() {
  const profiles = useMemo(() => getProfilesFromStorage(), []);

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-warm-white pt-20">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute -top-24 left-1/2 h-[420px] w-[92vw] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(255,237,188,0.85)_0%,rgba(255,255,255,0)_70%)]" />
          <div className="absolute -left-10 top-24 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(144,224,239,0.4)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
          <div className="absolute -right-12 bottom-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,209,102,0.5)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#0b5c79]/10 bg-white px-6 py-3 shadow-[0_10px_32px_rgba(11,92,121,0.08)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0ba7d6]" />
              <span className="text-[11px] font-ui font-bold uppercase tracking-[0.24em] text-[#0b5c79]">Our Story</span>
            </div>
            <h1 className="mb-8 text-6xl font-display font-light leading-[0.9] tracking-tighter text-dark md:text-8xl lg:text-9xl">
              Safe, confident, <br/>
              <span className="hero-surf-word">and enjoyable.</span>
            </h1>
            <div className="mx-auto max-w-3xl text-lg font-body font-light text-dark/70 md:text-2xl">
              <TextReveal text="We teach swimmers of all ages to conquer the water with absolute confidence." delay={0.2} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Story */}
      <section className="bg-warm-white py-32 md:py-48">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5">
              <FadeIn className="sticky top-32">
                <h2 className="text-4xl md:text-6xl font-display font-medium text-dark tracking-tight leading-[1.05]">
                  The reason we <br/>
                  <span className="text-ocean-mid">dive in.</span>
                </h2>
              </FadeIn>
            </div>
            <div className="lg:col-span-7">
              <FadeIn delay={0.2}>
                <div className="space-y-10 text-[#86868B] text-xl md:text-2xl font-body font-light leading-relaxed">
                  <p className="text-[#1D1D1F] font-normal">
                    Swim to Surf started with a simple conviction: everyone deserves to feel safe and confident in the water. 
                  </p>
                  <p>
                    The name comes from our love of the ocean and surfing — and the belief that mastering water skills opens the door to a lifetime of enjoyment.
                  </p>
                  <p>
                    Whether you live near the coast or not, chances are you&rsquo;ll eventually find yourself at a beach, a lake, or a pool. Our mission is to make sure that when that moment comes, you&rsquo;re ready — not just to survive, but to thrive.
                  </p>
                  <p>
                    We work with swimmers from newborns to 99+ years. No matter your age, background, or starting point, we&rsquo;ll meet you where you are and help you discover what you&rsquo;re capable of in the water.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy - Minimalist Grid */}
      <section className="py-32 md:py-48 bg-sand">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn className="mb-24 text-center max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#1D1D1F] mb-6">
              What makes us <span className="text-ocean-mid">different.</span>
            </h2>
          </FadeIn>
          
          <StaggerChildren className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-[2rem] border border-[#0b5c79]/10 bg-white p-10 shadow-[0_14px_34px_rgba(11,92,121,0.08)] transition-transform duration-500 hover:-translate-y-2 md:p-14">
                  <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-ocean-surf text-[#1D1D1F] font-display text-xl">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-4">{v.title}</h3>
                  <p className="text-[#86868B] font-light leading-relaxed font-body text-lg">
                    {v.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Instructors */}
      <section className="bg-warm-white py-32 md:py-48">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#1D1D1F]">
              Meet your <span className="text-ocean-mid">instructors.</span>
            </h2>
          </FadeIn>
          
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 max-w-5xl mx-auto">
            {[profiles.estee, profiles.lukaah].map((inst, i) => (
              <FadeIn key={inst.slug} delay={i * 0.15}>
                <div className="flex flex-col group items-center text-center">
                  <div className="relative aspect-square rounded-full overflow-hidden mb-10 w-64 h-64 border-[8px] border-[#F5F5F7] shadow-xl group-hover:scale-105 transition-transform duration-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={inst.heroImage} 
                      alt={inst.name} 
                      className="w-full h-full object-cover object-[50%_30%]"
                    />
                  </div>
                  <div>
                    <h3 className="text-4xl font-display font-medium tracking-tight text-[#1D1D1F] mb-3">{inst.name}</h3>
                    <p className="font-ui text-xs text-[#86868B] uppercase tracking-[0.2em] font-semibold mb-6">{inst.tagline}</p>
                    <p className="text-[#1D1D1F] leading-relaxed font-body text-lg mb-8 max-w-md mx-auto">
                      {inst.shortBio}
                    </p>
                    <Link
                      href={`/instructors/${inst.slug}`}
                      className="inline-flex items-center justify-center font-ui text-xs uppercase tracking-[0.16em] font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] px-8 py-4 rounded-full transition-colors text-center"
                    >
                      Meet {inst.name}
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
