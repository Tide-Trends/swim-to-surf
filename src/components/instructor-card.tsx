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
      <div className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-black/5 shadow-lg shadow-black/5 hover:shadow-2xl transition-all duration-500">
        <div className="relative h-[400px] overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${
              slug === 'lukaah' ? 'object-[center_20%] scale-[1.35]' : 'object-[center_15%] scale-[1.1]'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8">
            <h3 className="text-5xl font-display font-medium text-white mb-3 tracking-tight">{name}</h3>
            <p className="text-white/80 font-ui text-xs uppercase tracking-[0.2em] font-semibold">{tagline}</p>
          </div>
        </div>

        <div className="p-8 lg:p-10 flex flex-col flex-1 bg-white">
          <p className="text-[#86868B] font-light leading-relaxed mb-8 flex-1 text-lg">
            {bio}
          </p>

          <div className="flex items-center gap-3 text-sm text-[#1D1D1F] font-ui font-medium border-t border-black/5 pt-8 mb-8">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {scheduleLabel}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/book?instructor=${name.toLowerCase()}`}
              className="inline-flex items-center justify-center font-ui text-sm uppercase tracking-widest font-bold bg-[#1D1D1F] text-white px-8 py-5 rounded-full hover:bg-black transition-colors text-center w-full"
            >
              Book with {name}
            </Link>
            {slug && (
              <Link
                href={`/instructors/${slug}`}
                className="inline-flex items-center justify-center font-ui text-xs uppercase tracking-[0.16em] font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] px-8 py-4 rounded-full transition-colors text-center w-full"
              >
                Meet {name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
