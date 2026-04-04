"use client";

import { useMemo } from "react";
import { getProfilesFromStorage } from "@/lib/instructor-content";

interface Props {
  onSelect: (id: "lukaah" | "estee") => void;
}

export function StepInstructor({ onSelect }: Props) {
  const profiles = useMemo(() => getProfilesFromStorage(), []);
  const instructors = [profiles.estee, profiles.lukaah];

  return (
    <div className="space-y-10">
      <div className="rounded-[1.5rem] border border-black/5 bg-[#F5F5F7] p-8 md:p-10">
        <h3 className="font-display text-2xl font-medium tracking-tight mb-6">How booking works</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base">
          <button 
            type="button"
            onClick={() => onSelect("lukaah")}
            className="text-left rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:border-black/20 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Lukaah</p>
            <p className="font-body text-[#1D1D1F] leading-relaxed">
              Choose one time slot that repeats Monday-Friday for one single week (5 lessons total).
            </p>
          </button>
          <button 
            type="button"
            onClick={() => onSelect("estee")}
            className="text-left rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:border-black/20 hover:shadow-md transition-all cursor-pointer"
          >
            <p className="font-ui text-xs uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Estee</p>
            <p className="font-body text-[#1D1D1F] leading-relaxed">
              Choose one weekly slot for the month (4 lessons), with an option to add a second weekly slot (8 lessons).
            </p>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {instructors.map((inst) => (
          <button
            key={inst.slug}
            onClick={() => onSelect(inst.slug as "lukaah" | "estee")}
            className="group flex flex-col text-left rounded-[2rem] overflow-hidden border border-black/5 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
          >
            <div className="relative h-72 w-full overflow-hidden">
              <img
                src={inst.heroImage}
                alt={inst.name}
                className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125 ${
                  inst.slug === 'lukaah' 
                    ? 'object-[50%_20%] scale-[1.4]' 
                    : 'object-[50%_25%] scale-[1.15]'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span 
                className="absolute bottom-6 left-8 text-4xl font-display text-white tracking-tight group-hover:underline text-left pointer-events-none"
              >
                {inst.name}
              </span>
            </div>

            <div className="p-8 flex flex-col flex-1">
              <p className="text-[#86868B] font-ui text-xs uppercase tracking-[0.2em] font-semibold mb-3">{inst.tagline}</p>
              <p className="text-[#1D1D1F] text-sm leading-relaxed mb-6 flex-1">{inst.shortBio}</p>

              <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-5 mb-8">
                <p className="font-ui text-[10px] uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-3">Schedule Structure</p>
                <p className="text-sm font-ui text-[#1D1D1F] font-medium">{inst.scheduleSummary}</p>
              </div>

              <div className="flex items-center justify-between w-full font-ui text-sm font-semibold text-[#1D1D1F]">
                <span>Select {inst.name}</span>
                <span className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center transition-transform duration-300 group-hover:bg-[#1D1D1F] group-hover:text-white">
                  &rarr;
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
