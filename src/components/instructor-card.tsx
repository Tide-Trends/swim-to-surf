"use client";

import Link from "next/link";
import { TiltCard } from "./ui/animate";

interface InstructorCardProps {
  name: string;
  tagline: string;
  bio: string;
  scheduleLabel: string;
  image: string;
  slug?: "lukaah" | "estee";
}

export function InstructorCard({
  name,
  tagline,
  bio,
  scheduleLabel,
  image,
  slug,
}: InstructorCardProps) {
  return (
    <TiltCard>
      <article className="surface-card-interactive group flex h-full flex-col overflow-hidden">
        <div className="relative h-[22rem] overflow-hidden md:h-[24rem]">
          <img
            src={image}
            alt={name}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
              slug === "lukaah" ? "object-[center_20%] scale-[1.35]" : "object-[center_15%] scale-[1.1]"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
            <h3 className="font-display text-3xl text-white md:text-4xl">{name}</h3>
            <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.14em] text-white/70">{tagline}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-7">
          <p className="mb-6 flex-1 text-sm leading-relaxed text-body md:text-base">{bio}</p>
          <p className="mb-6 flex items-center gap-2.5 border-t border-navy/8 pt-5 text-sm text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-water">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            {scheduleLabel}
          </p>
          <div className="flex flex-col gap-2.5">
            <Link href={`/book?instructor=${name.toLowerCase()}`} className="btn-cta-primary w-full py-3 text-center">
              Book with {name}
            </Link>
            {slug && (
              <Link href={`/instructors/${slug}`} className="btn-outline w-full py-3 text-center">
                View profile
              </Link>
            )}
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
