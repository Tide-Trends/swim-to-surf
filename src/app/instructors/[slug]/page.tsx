"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { DEFAULT_PROFILES, getProfilesFromStorage, type InstructorSlug } from "@/lib/instructor-content";
import { FadeIn } from "@/components/ui/animate";

export default function InstructorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug || "lukaah") as InstructorSlug;

  const profile = useMemo(() => {
    const profiles = getProfilesFromStorage();
    return profiles[slug] || DEFAULT_PROFILES.lukaah;
  }, [slug]);

  return (
    <main className="bg-white min-h-screen">
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-60">
          <img 
            src={profile.heroImage} 
            alt={profile.name} 
            className={`w-full h-full object-cover ${
              slug === 'lukaah' ? 'object-[center_35%]' : 'object-[center_30%]'
            }`} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center pt-24">
          <FadeIn>
            <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-white/70 mb-6">
              Instructor Profile
            </p>
            <h1 className="font-display text-7xl md:text-9xl font-medium tracking-tighter text-white mb-6">
              {profile.name}
            </h1>
            <p className="font-ui text-lg uppercase tracking-[0.2em] text-accent/90">
              {profile.tagline}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-6xl px-6 md:px-8 grid lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-[#1D1D1F] mb-10">Who {profile.name} Is</h2>
              <div className="space-y-8 text-lg font-body font-light text-[#86868B] leading-relaxed">
                <p className="text-[#1D1D1F] text-xl md:text-2xl">{profile.shortBio}</p>
                <p>{profile.longBio}</p>
                {profile.qualifications.length > 0 && (
                  <div className="pt-2">
                    <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-[#1D1D1F] mb-5">
                      Training and experience
                    </h3>
                    <ul className="space-y-3.5 text-[#1D1D1F]/88 text-base md:text-lg leading-relaxed">
                      {profile.qualifications.map((line) => (
                        <li key={line.slice(0, 56)} className="flex gap-3 pl-0">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0077B6]" aria-hidden />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          <aside className="lg:col-span-5">
            <FadeIn delay={0.2} className="sticky top-32">
              <div className="rounded-[2rem] border border-black/5 bg-[#F5F5F7] p-10 shadow-sm space-y-10">
                <div>
                  <p className="font-ui text-[11px] uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Teaching Style</p>
                  <p className="font-body text-[#1D1D1F] leading-relaxed">{profile.teachingStyle}</p>
                </div>
                <div>
                  <p className="font-ui text-[11px] uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Ideal For</p>
                  <p className="font-body text-[#1D1D1F] leading-relaxed">{profile.idealFor}</p>
                </div>
                <div>
                  <p className="font-ui text-[11px] uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Schedule</p>
                  <p className="font-body text-[#1D1D1F] leading-relaxed">{profile.scheduleSummary}</p>
                </div>
                <div className="pt-6 flex flex-col gap-4">
                  <Link
                    href={`/book?instructor=${slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-[#1D1D1F] text-white px-8 py-5 font-ui text-sm uppercase tracking-[0.16em] font-semibold hover:bg-black transition-colors shadow-lg shadow-black/10 hover:-translate-y-0.5 duration-300"
                  >
                    Book with {profile.name}
                  </Link>
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center rounded-full bg-white text-[#1D1D1F] px-8 py-5 font-ui text-xs uppercase tracking-[0.16em] font-semibold hover:bg-black/5 border border-black/5 transition-colors"
                  >
                    Compare Instructors
                  </Link>
                </div>
              </div>
            </FadeIn>
          </aside>
        </div>
      </section>

    </main>
  );
}
