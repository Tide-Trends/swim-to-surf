import Link from "next/link";
import { DEFAULT_PROFILES } from "@/lib/instructor-content";
import { FadeIn, StaggerChildren, StaggerItem, TiltCard } from "@/components/ui/animate";

export default function InstructorsPage() {
  return (
    <main className="bg-[#F5F5F7] min-h-screen pt-32 pb-32">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <FadeIn className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-black/5 bg-white/50 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-ui uppercase tracking-widest text-[#86868B]">The Team</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-medium text-[#1D1D1F] tracking-tight mb-6">
            Meet your instructors.
          </h1>
          <p className="font-body text-xl text-[#86868B] font-light leading-relaxed">
            Learn each instructor&rsquo;s teaching style and schedule, then choose the best fit for your family.
          </p>
        </FadeIn>
        
        <StaggerChildren className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {Object.values(DEFAULT_PROFILES).map((profile) => (
            <StaggerItem key={profile.slug}>
              <TiltCard>
                <article className="rounded-[2rem] border border-black/5 bg-white overflow-hidden shadow-sm h-full flex flex-col group transition-all duration-500 hover:shadow-2xl hover:border-transparent">
                  <div className="h-80 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={profile.heroImage} 
                      alt={profile.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <h2 className="absolute bottom-6 left-8 font-display text-4xl text-white tracking-tight">{profile.name}</h2>
                  </div>
                  <div className="p-8 md:p-10 flex-1 flex flex-col">
                    <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-6">{profile.tagline}</p>
                    <p className="font-body text-[#1D1D1F] leading-relaxed mb-10 flex-1">{profile.shortBio}</p>
                    <Link
                      href={`/instructors/${profile.slug}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F] px-8 py-4 font-ui text-xs uppercase tracking-[0.16em] font-semibold hover:bg-[#E8E8ED] transition-colors w-full"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </article>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </main>
  );
}
