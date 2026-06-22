"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PROFILES,
  getProfilesFromStorage,
  saveProfilesToStorage,
  type InstructorProfile,
  type InstructorSlug,
} from "@/lib/instructor-content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ProfilesMap = Record<InstructorSlug, InstructorProfile>;

export function InstructorProfilesEditor({ editor }: { editor: InstructorSlug }) {
  const [profiles, setProfiles] = useState<ProfilesMap>(DEFAULT_PROFILES);
  const [active, setActive] = useState<InstructorSlug>(editor);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfiles(getProfilesFromStorage());
  }, []);

  function patchField<K extends keyof InstructorProfile>(field: K, value: InstructorProfile[K]) {
    setSaved(false);
    setProfiles((prev) => ({
      ...prev,
      [active]: { ...prev[active], [field]: value },
    }));
  }

  function patchQualifications(text: string) {
    const lines = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    patchField("qualifications", lines);
  }

  function save() {
    saveProfilesToStorage(profiles);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const profile = profiles[active];

  return (
    <div className="admin-panel p-6 md:p-8">
      <div className="mb-7">
        <h2 className="mb-2 font-display text-2xl text-navy">Instructor profiles</h2>
        <p className="font-ui text-sm text-body">
          Edit public instructor pages and homepage snippets. Saves to this browser only.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {(["lukaah", "estee"] as const).map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setActive(slug)}
            className={`rounded-lg px-4 py-2 font-ui text-sm font-semibold capitalize ${
              active === slug ? "bg-navy text-white" : "border border-navy/12 bg-white text-body"
            }`}
          >
            {slug}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <Input label="Display Name" value={profile.name} onChange={(e) => patchField("name", e.target.value)} />
        <Input label="Tagline" value={profile.tagline} onChange={(e) => patchField("tagline", e.target.value)} />
        <Input
          label="Short Bio (homepage)"
          value={profile.shortBio}
          onChange={(e) => patchField("shortBio", e.target.value)}
        />
        <Textarea
          label="Long Bio (profile page)"
          value={profile.longBio}
          onChange={(e) => patchField("longBio", e.target.value)}
        />
        <Textarea
          label="Teaching Style"
          value={profile.teachingStyle}
          onChange={(e) => patchField("teachingStyle", e.target.value)}
        />
        <Textarea
          label="Ideal For"
          value={profile.idealFor}
          onChange={(e) => patchField("idealFor", e.target.value)}
        />
        <Input
          label="Schedule Summary"
          value={profile.scheduleSummary}
          onChange={(e) => patchField("scheduleSummary", e.target.value)}
        />
        <Input
          label="Hero Image Path"
          value={profile.heroImage}
          onChange={(e) => patchField("heroImage", e.target.value)}
        />
        <Textarea
          label="Training and experience (one short paragraph or sentence per line)"
          value={profile.qualifications.join("\n")}
          onChange={(e) => patchQualifications(e.target.value)}
          className="min-h-[180px]"
        />
      </div>

      <div className="mt-7 flex items-center gap-3">
        <Button onClick={save}>Save Profile Content</Button>
        {saved && <span className="text-sm text-success font-ui">Saved</span>}
      </div>
    </div>
  );
}
