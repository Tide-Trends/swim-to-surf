import Link from "next/link";
import { Hero } from "@/components/hero";
import { Testimonials } from "@/components/testimonials";
import { InstructorShowcase } from "@/components/instructor-showcase";
import { FadeIn, Parallax } from "@/components/ui/animate";
import { PRICING } from "@/lib/constants";
import { OceanWave, WaterLineArt } from "@/components/ui/animated-backgrounds";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Philosophy Section */}
      <section className="bg-warm-white py-32 overflow-hidden relative">
        <WaterLineArt />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          
          <FadeIn className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 mb-8 justify-center">
              <span className="w-1 h-1 rounded-full bg-sunshine" />
              <span className="text-xs font-ui uppercase tracking-[0.2em] text-muted">Philosophy</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display tracking-tight mb-8 leading-[1.05] text-dark">
              Confidence <br />
              <span className="text-ocean-mid">starts here.</span>
            </h2>
            <p className="text-xl md:text-2xl text-dark/70 font-light leading-relaxed">
              We exist to build courageous swimmers—the kind who can one day grab a board and surf, or play fearlessly in any water.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            <Parallax offset={10}>
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
            </Parallax>

            <Parallax offset={20}>
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
            </Parallax>

            <Parallax offset={30}>
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
            </Parallax>
          </div>
        </div>
      </section>

      {/* Pricing - Bright Ocean */}
      <section className="text-white py-40 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 50%, #0096C7 100%)" }}>
        <div className="absolute top-0 left-0 w-full h-[150px] z-10 rotate-180">
          <OceanWave fill="var(--color-warm-white)" opacity={1} speed={22} direction="left" className="top-0 h-[60%]" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl relative z-20 mt-12">
          <FadeIn className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-display tracking-tight text-white mb-6">
              Transparent <span className="text-sunshine opacity-90">Pricing.</span>
            </h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <FadeIn delay={0.1}>
              <div className="glass-dark rounded-[3rem] p-10 md:p-12 h-full flex flex-col justify-between group hover:border-sunshine/30 transition-colors">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-ui uppercase tracking-[0.2em] mb-8">Infants · with Lukaah</span>
                  <h3 className="text-5xl md:text-6xl font-display font-light tracking-tighter mb-3 text-white group-hover:text-sunshine transition-colors">{PRICING.infant.label}</h3>
                  <p className="text-lg text-ocean-light/70 font-light">/ week</p>
                </div>
                <div className="mt-12 pt-6 border-t border-white/10">
                  <p className="text-base text-white/80 font-light">5 × {PRICING.infant.duration}-minute lessons (Mon–Fri)</p>
                  <p className="text-ocean-light/50 text-sm mt-2">Ages {PRICING.infant.age}</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="glass-ocean rounded-[3rem] p-10 md:p-12 h-full flex flex-col justify-between group hover:shadow-[0_0_80px_rgba(255,209,102,0.2)] transition-all">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-ui uppercase tracking-[0.2em] mb-8">Standard · with Lukaah</span>
                  <h3 className="text-5xl md:text-6xl font-display font-light tracking-tighter mb-3 text-white group-hover:scale-105 origin-left transition-transform duration-500">{PRICING.standard.label}</h3>
                  <p className="text-lg text-ocean-surf/80 font-light">/ week</p>
                </div>
                <div className="mt-12 pt-6 border-t border-white/15">
                  <p className="text-base text-white font-light">5 × {PRICING.standard.duration}-minute lessons (Mon–Fri)</p>
                  <p className="text-ocean-surf/60 text-sm mt-2">Ages {PRICING.standard.age}</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="glass-dark rounded-[3rem] p-10 md:p-12 h-full flex flex-col justify-between group hover:border-coral/30 transition-colors">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-coral/20 text-coral text-xs font-ui uppercase tracking-[0.2em] mb-8 font-semibold">Infants · with Estee</span>
                  <h3 className="text-5xl md:text-6xl font-display font-light tracking-tighter mb-3 text-white group-hover:text-coral transition-colors">{PRICING.esteeInfantMonthly.label}</h3>
                  <p className="text-lg text-white/70 font-light">/ month</p>
                </div>
                <div className="mt-12 pt-6 border-t border-white/15">
                  <p className="text-base text-white/80 font-light">4 × 15-minute lessons per month</p>
                  <p className="text-white/50 text-sm mt-2">Ages 0–3 · Wed &amp; Thu available</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="rounded-[3rem] p-10 md:p-12 h-full flex flex-col justify-between group transition-all border-2 border-sunshine/40 hover:border-sunshine" style={{ background: "linear-gradient(135deg, rgba(255,209,102,0.15), rgba(255,107,107,0.08))" }}>
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-sunshine/20 text-sunshine text-xs font-ui uppercase tracking-[0.2em] mb-8 font-semibold">Standard · with Estee</span>
                  <h3 className="text-5xl md:text-6xl font-display font-light tracking-tighter mb-3 text-white group-hover:text-sunshine transition-colors">{PRICING.esteeMonthly.label}</h3>
                  <p className="text-lg text-white/70 font-light">/ month</p>
                </div>
                <div className="mt-12 pt-6 border-t border-white/15">
                  <p className="text-base text-white/90 font-light">{PRICING.esteeMonthly.lessons} × 30-minute lessons per month</p>
                  <p className="text-white/50 text-sm mt-2">Ages 4+ · Wed &amp; Thu available</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[150px] z-10 transition-transform">
          <OceanWave fill="var(--color-warm-white)" opacity={1} speed={18} direction="right" className="bottom-0 h-[70%]" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-warm-white py-32 overflow-hidden relative">
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
        
        <div className="absolute top-0 left-0 w-full h-[150px] z-20 rotate-180">
          <OceanWave fill="var(--color-sand)" opacity={1} speed={25} direction="left" className="top-0 h-full" />
        </div>
        
        <div className="relative z-30 text-center px-6 max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-7xl md:text-9xl font-display text-white tracking-tighter mb-12 font-light">
              Dive <span className="text-sunshine">in.</span>
            </h2>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-12 py-6 font-ui text-sm font-bold uppercase tracking-[0.2em] text-ocean-deep bg-white rounded-full hover:scale-105 hover:bg-sunshine hover:shadow-[0_0_80px_rgba(255,209,102,0.4)] transition-all duration-700"
            >
              Book a Lesson
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
