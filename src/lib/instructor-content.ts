export type InstructorSlug = "lukaah" | "estee";

export interface InstructorProfile {
  slug: InstructorSlug;
  name: string;
  tagline: string;
  shortBio: string;
  longBio: string;
  teachingStyle: string;
  idealFor: string;
  scheduleSummary: string;
  heroImage: string;
}

export const DEFAULT_PROFILES: Record<InstructorSlug, InstructorProfile> = {
  estee: {
    slug: "estee",
    name: "Estee",
    tagline: "Where safety meets joy in the water",
    shortBio:
      "Estee is known for her warmth, expertise, and ability to connect with swimmers of every age and skill level.",
    longBio:
      "Estee creates a calm and encouraging environment where swimmers feel supported from day one. Her monthly format is perfect for families who want consistency and flexibility, with the option to scale up to two weekly sessions.",
    teachingStyle:
      "Warm, patient, and highly adaptive. Estee tunes each lesson to the swimmer's comfort level and growth pace.",
    idealFor:
      "Families who want weekly rhythm through the month with optional twice-weekly acceleration.",
    scheduleSummary: "Wednesday & Thursday, 8:00 AM–11:30 AM & 12:30 PM–4:00 PM",
    heroImage: "/instructors/estee.jpeg",
  },
  lukaah: {
    slug: "lukaah",
    name: "Lukaah",
    tagline: "Building confidence one stroke at a time",
    shortBio:
      "Lukaah brings patience, energy, and years of hands-on teaching to every lesson.",
    longBio:
      "Lukaah specializes in intensive weekly progress. Families who want a strong routine and visible growth love this format. Every lesson is structured, focused, and designed to build water confidence quickly while keeping safety as the first priority.",
    teachingStyle:
      "Direct, calm, and confidence-driven. Lukaah breaks skills into simple steps and repeats them until they feel natural.",
    idealFor:
      "Families who want a Monday-Friday routine, fast momentum, and strong technique-building.",
    scheduleSummary: "Monday-Friday, 8:00 AM-11:30 AM",
    heroImage: "/instructors/lukaah.png",
  },
};

const STORAGE_KEY = "sts_instructor_profiles_v1";
const AUTH_KEY = "sts_admin_auth_v1";

export function getProfilesFromStorage(): Record<InstructorSlug, InstructorProfile> {
  if (typeof window === "undefined") return DEFAULT_PROFILES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw) as Record<InstructorSlug, InstructorProfile>;
    return {
      estee: { ...DEFAULT_PROFILES.estee, ...parsed.estee },
      lukaah: { ...DEFAULT_PROFILES.lukaah, ...parsed.lukaah },
    };
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveProfilesToStorage(profiles: Record<InstructorSlug, InstructorProfile>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function setAdminSession(username: InstructorSlug) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, username);
}

export function getAdminSession(): InstructorSlug | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(AUTH_KEY);
  return value === "lukaah" || value === "estee" ? value : null;
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
}
