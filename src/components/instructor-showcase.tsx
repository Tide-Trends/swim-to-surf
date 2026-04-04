"use client";

import { useMemo } from "react";
import { InstructorCard } from "@/components/instructor-card";
import { getProfilesFromStorage } from "@/lib/instructor-content";
import { INSTRUCTORS } from "@/lib/constants";

export function InstructorShowcase() {
  const profiles = useMemo(() => getProfilesFromStorage(), []);

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      <InstructorCard
        name={profiles.estee.name}
        tagline={profiles.estee.tagline}
        bio={profiles.estee.shortBio}
        scheduleLabel={INSTRUCTORS.estee.scheduleLabel}
        image={profiles.estee.heroImage}
        slug="estee"
      />
      <InstructorCard
        name={profiles.lukaah.name}
        tagline={profiles.lukaah.tagline}
        bio={profiles.lukaah.shortBio}
        scheduleLabel={INSTRUCTORS.lukaah.scheduleLabel}
        image={profiles.lukaah.heroImage}
        slug="lukaah"
      />
    </div>
  );
}
