import Link from "next/link";
import { Hero } from "@/components/hero";
import { HomeHighlights } from "@/components/home-highlights";
import { HomePricing } from "@/components/home-pricing";
import { Testimonials } from "@/components/testimonials";
import { InstructorShowcase } from "@/components/instructor-showcase";
import { FadeIn } from "@/components/ui/animate";

const PILLARS = [
  {
    title: "Safety first",
    body: "We teach critical water-safety survival skills before anything else — because confidence starts with knowing how to stay safe.",
  },
  {
    title: "One-on-one only",
    body: "Every session is private. Your swimmer gets full attention, moves at their own pace, and makes progress every time.",
  },
  {
    title: "Built to last",
    body: "We meet swimmers where they are and practice until skills stick — not until a level chart says to move on.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="section-pad border-b border-navy/12 bg-white">
        <div className="container-site">
          <FadeIn className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
            <span className="accent-rule mx-auto mb-5" aria-hidden />
            <p className="eyebrow mb-3">Philosophy</p>
            <h2 className="section-title">Confidence starts in the water.</h2>
            <p className="section-lead mt-4">
              We build courageous swimmers — the kind who can play fearlessly in any pool, lake, or ocean.
            </p>
          </FadeIn>

          <HomeHighlights />

          <div className="mt-14 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-10">
            {PILLARS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <article className="pillar-item h-full py-1">
                  <p className="eyebrow mb-2 text-water">0{i + 1}</p>
                  <h3 className="mb-3 text-xl text-navy md:text-[1.35rem]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-body md:text-base">{item.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <HomePricing />
      <Testimonials />

      <section className="section-pad border-b border-navy/12 bg-cream">
        <div className="container-site">
          <div className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
            <FadeIn className="max-w-xl">
              <span className="accent-rule mb-5" aria-hidden />
              <p className="eyebrow mb-3">Instructors</p>
              <h2 className="section-title">Meet your coaches.</h2>
              <p className="section-lead mt-4">
                Patient, experienced, and genuinely invested in every swimmer.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Link href="/instructors" className="btn-outline link-arrow">
                View profiles
              </Link>
            </FadeIn>
          </div>
          <InstructorShowcase />
        </div>
      </section>

      <section className="border-t-4 border-gold bg-sand py-20 md:py-24">
        <FadeIn className="container-site">
          <div className="mx-auto max-w-2xl rounded-2xl border border-navy/10 bg-white px-8 py-12 text-center shadow-lift md:px-12 md:py-14">
            <p className="eyebrow mb-3">Get started</p>
            <h2 className="section-title text-navy">Book a private lesson.</h2>
            <p className="section-lead mx-auto mt-4 max-w-md">
              Choose your instructor, pick a week or month, and confirm online in a few minutes.
            </p>
            <Link href="/book" className="btn-cta-primary mt-8 inline-flex px-10">
              Book a lesson
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
