import Link from "next/link";
import { Hero } from "@/components/hero";
import { HomeHighlights } from "@/components/home-highlights";
import { HomePricing } from "@/components/home-pricing";
import { Testimonials } from "@/components/testimonials";
import { InstructorShowcase } from "@/components/instructor-showcase";
import { FadeIn } from "@/components/ui/animate";
import { WaterLineArt } from "@/components/ui/animated-backgrounds";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Philosophy Section */}
      <section className="bg-warm-white pt-14 pb-20 md:pt-16 md:pb-28 overflow-hidden relative">
        <WaterLineArt />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          
          <FadeIn className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 mb-6 justify-center">
              <span className="w-1 h-1 rounded-full bg-sunshine" />
              <span className="text-xs font-ui uppercase tracking-[0.2em] text-muted">Philosophy</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display tracking-tight mb-6 md:mb-8 leading-[1.05] text-dark">
              Confidence <br />
              <span className="text-ocean-mid">starts here.</span>
            </h2>
            <p className="text-xl md:text-2xl text-dark/70 font-light leading-relaxed">
              We exist to build courageous swimmers—the kind who can one day grab a board and surf, or play fearlessly in any water.
            </p>
          </FadeIn>

          <HomeHighlights />

          <div className="mt-20 grid gap-8 md:grid-cols-3 md:mt-24">
            <div>
              <div className="glass rounded-[2rem] p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 relative overflow-hidden group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-light/30 blur-3xl group-hover:bg-sunshine/30 transition-colors" />
                <div className="w-10 h-10 bg-ocean-mid text-white rounded-full flex items-center justify-center font-display text-lg mb-8 shadow-sm">
                  1
                </div>
                <h3 className="text-2xl font-display mb-4 text-dark">Safety First</h3>
                <p className="text-base text-muted leading-relaxed font-light">
                  Drowning is a leading cause of death. We teach critical water-safety survival skills before anything else.
                </p>
              </div>
            </div>

            <div>
              <div className="glass rounded-[2rem] p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 relative overflow-hidden group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-light/30 blur-3xl group-hover:bg-sunshine/30 transition-colors" />
                <div className="w-10 h-10 bg-ocean-mid text-white rounded-full flex items-center justify-center font-display text-lg mb-8 shadow-sm">
                  2
                </div>
                <h3 className="text-2xl font-display mb-4 text-dark">One-on-One</h3>
                <p className="text-base text-muted leading-relaxed font-light">
                  Group lessons rarely work. Every session is private, ensuring your swimmer gets undivided attention.
                </p>
              </div>
            </div>

            <div>
              <div className="glass rounded-[2rem] p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 relative overflow-hidden group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-light/30 blur-3xl group-hover:bg-sunshine/30 transition-colors" />
                <div className="w-10 h-10 bg-ocean-mid text-white rounded-full flex items-center justify-center font-display text-lg mb-8 shadow-sm">
                  3
                </div>
                <h3 className="text-2xl font-display mb-4 text-dark">Mastery</h3>
                <p className="text-base text-muted leading-relaxed font-light">
                  We meet you where you are, building on existing skills until every technique is mastered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomePricing />

      {/* Testimonials */}
      <section className="bg-warm-white pt-12 pb-16 md:pt-14 md:pb-20 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0077B6]/[0.06] to-transparent" />
        <Testimonials />
      </section>

      {/* Meet Your Instructors */}
      <section className="py-32 md:py-48 bg-sand">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
            <FadeIn className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-display tracking-tight mb-8 text-dark">
                In great <span className="text-ocean-mid">hands.</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted font-light leading-relaxed">
                Patience, expertise, and a genuine love for the water.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
               <Link href="/instructors" className="text-sm font-ui uppercase tracking-[0.2em] font-semibold border-b border-ocean-mid/40 pb-2 hover:text-ocean-mid hover:border-ocean-mid transition-colors duration-500">
                 Meet the team
               </Link>
            </FadeIn>
          </div>
          
          <InstructorShowcase />
        </div>
      </section>

      {/* Cinematic CTA */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-40" style={{ background: "linear-gradient(135deg, #0096C7 0%, #0077B6 50%, #00B4D8 100%)" }}>
        <div className="absolute inset-0 z-0">
          <WaterLineArt />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-sand via-sand/80 to-transparent" />
        
        <div className="relative z-30 text-center px-6 max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-7xl md:text-9xl font-display text-white tracking-tighter mb-12 font-light">
              Dive <span className="text-sunshine">in.</span>
            </h2>
            <Link
              href="/book"
              className="btn-cta-primary inline-flex min-h-[3.75rem] min-w-[min(100%,280px)] items-center justify-center rounded-full px-12 py-5 font-ui text-base font-bold uppercase tracking-[0.18em] md:tracking-[0.2em]"
            >
              Book swim lessons
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
