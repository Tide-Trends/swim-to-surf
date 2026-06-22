"use client";

import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { DEFAULT_PROFILES } from "@/lib/instructor-content";
import { StaggerChildren, StaggerItem, TiltCard } from "@/components/ui/animate";
import { SITE } from "@/lib/constants";

const instructorsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      name: "Swim to Surf Instructors",
      itemListElement: Object.values(DEFAULT_PROFILES).map((profile, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Person",
          name: profile.name,
          description: profile.shortBio,
          worksFor: { "@type": "Organization", name: SITE.name, url: SITE.url },
          url: `${SITE.url}/instructors/${profile.slug}`,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Instructors", item: `${SITE.url}/instructors` },
      ],
    },
  ],
};

export default function InstructorsPage() {
  return (
    <main className="min-h-screen bg-cream pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(instructorsJsonLd) }} />
      <PageHero
        eyebrow="Instructors"
        title="Meet your coaches."
        description="Learn each instructor's style and schedule, then book the best fit for your family."
      />
      <div className="container-site section-pad !pt-10">
        <StaggerChildren className="grid gap-8 md:grid-cols-2">
          {Object.values(DEFAULT_PROFILES).map((profile) => (
            <StaggerItem key={profile.slug}>
              <TiltCard>
                <article className="surface-card overflow-hidden transition-shadow hover:shadow-glow">
                  <div className="relative h-72 overflow-hidden md:h-80">
                    <img
                      src={profile.heroImage}
                      alt={profile.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
                    <h2 className="absolute bottom-5 left-5 font-display text-3xl text-white md:text-4xl">{profile.name}</h2>
                  </div>
                  <div className="p-6 md:p-7">
                    <p className="eyebrow mb-3">{profile.tagline}</p>
                    <p className="mb-6 text-sm leading-relaxed text-muted md:text-base">{profile.shortBio}</p>
                    <Link href={`/instructors/${profile.slug}`} className="btn-outline w-full py-3 text-center">
                      View profile
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
