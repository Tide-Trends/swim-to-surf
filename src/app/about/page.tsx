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
    <div className="bg-[#F5F5F7] min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/image4.jpg" 
            alt="Ocean waves" 
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center pt-24">
          <FadeIn>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-ui uppercase tracking-widest text-white">Our Story</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-medium text-white leading-[0.9] tracking-tighter mb-8">
              Safe, confident, <br/>
              <span className="text-white/60">and enjoyable.</span>
            </h1>
            <div className="max-w-2xl mx-auto text-xl text-white/70 font-light font-body">
              <TextReveal text="We teach swimmers of all ages to conquer the water with absolute confidence." delay={0.2} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Story */}
      <section className="py-32 md:py-48 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5">
              <FadeIn className="sticky top-32">
                <h2 className="text-4xl md:text-6xl font-display font-medium text-[#1D1D1F] tracking-tight leading-[1.05]">
                  The reason we <br/>
                  <span className="text-[#86868B]">dive in.</span>
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
      <section className="py-32 md:py-48 bg-[#F5F5F7]">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn className="mb-24 text-center max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#1D1D1F] mb-6">
              What makes us <span className="text-[#86868B]">different.</span>
            </h2>
          </FadeIn>
          
          <StaggerChildren className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <StaggerItem key={v.title}>
                <div className="bg-white p-10 md:p-14 rounded-[2rem] h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 hover:-translate-y-2 transition-transform duration-500">
                  <span className="w-12 h-12 rounded-full bg-[#F5F5F7] text-[#1D1D1F] font-display text-xl flex items-center justify-center mb-8">
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
      <section className="py-32 md:py-48 bg-white border-t border-black/5">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#1D1D1F]">
              Meet your <span className="text-[#86868B]">instructors.</span>
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
