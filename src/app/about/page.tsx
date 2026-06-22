"use client";

import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/animate";
import { PageHero } from "@/components/page-hero";
import { getProfilesFromStorage } from "@/lib/instructor-content";
import { SITE } from "@/lib/constants";
import { useMemo } from "react";
import Link from "next/link";

const values = [
  {
    title: "Safety is non-negotiable",
    body: "Water safety is our starting point. Every swimmer learns survival skills before anything else.",
  },
  {
    title: "Every lesson is private",
    body: "One-on-one instruction means full attention, your own pace, and real progress every session.",
  },
  {
    title: "No levels, no boxes",
    body: "We meet each swimmer where they are and practice every skill until it's truly mastered.",
  },
  {
    title: "Confidence over checklists",
    body: "Our goal is swimmers who feel genuinely capable — in a pool, lake, or the open ocean.",
  },
];

export default function AboutPage() {
  const profiles = useMemo(() => getProfilesFromStorage(), []);

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        eyebrow="Our Story"
        title="Safe, confident, and at home in the water."
        description="We teach swimmers of all ages to build real confidence — one private lesson at a time."
      />

      <section className="section-pad border-b border-navy/8 bg-cream">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <FadeIn className="lg:col-span-5">
            <h2 className="sticky top-28 section-title lg:max-w-xs">
              The reason we dive in.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="space-y-6 text-base leading-relaxed text-body md:text-lg lg:col-span-7">
            <p className="text-navy">
              Swim to Surf started with a simple conviction: everyone deserves to feel safe and confident in the water.
            </p>
            <p>
              The name comes from our love of the ocean and surfing — and the belief that mastering water skills opens
              the door to a lifetime of enjoyment.
            </p>
            <p>
              Whether you live near the coast or not, you&rsquo;ll eventually find yourself at a beach, lake, or pool. Our
              mission is to make sure that when that moment comes, you&rsquo;re ready.
            </p>
            <p>We work with swimmers from newborns to 99+. We&rsquo;ll meet you where you are.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad border-b border-navy/8 bg-sand/50">
        <div className="container-site">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <span className="accent-rule mx-auto mb-5" aria-hidden />
            <p className="eyebrow mb-3">Values</p>
            <h2 className="section-title">What makes us different.</h2>
          </FadeIn>
          <StaggerChildren className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
            {values.map((v, i) => (
              <StaggerItem key={v.title}>
                <article className="pillar-item h-full py-1">
                  <p className="eyebrow mb-2 text-water">0{i + 1}</p>
                  <h3 className="mb-3 text-xl text-navy">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-body md:text-base">{v.body}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="container-site">
          <FadeIn className="mb-14 text-center">
            <span className="accent-rule mx-auto mb-5" aria-hidden />
            <p className="eyebrow mb-3">Coaches</p>
            <h2 className="section-title">Meet your instructors.</h2>
          </FadeIn>
          <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
            {[profiles.estee, profiles.lukaah].map((inst, i) => (
              <FadeIn key={inst.slug} delay={i * 0.1} className="text-center">
                <div className="mx-auto mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-white shadow-lift">
                  <img src={inst.heroImage} alt={inst.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="font-display text-2xl text-navy">{inst.name}</h3>
                <p className="eyebrow mt-2">{inst.tagline}</p>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-body">{inst.shortBio}</p>
                <Link href={`/instructors/${inst.slug}`} className="btn-outline mt-6 inline-flex">
                  Meet {inst.name}
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
