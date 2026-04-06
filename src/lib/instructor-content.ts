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
  /** Training and experience lines (shown on the profile under the bio). */
  qualifications: string[];
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
    qualifications: [
      "Water Safety Instructor (WSI) certified.",
      "CPR, first aid, and medical assisting background. That training shows up as steady, safety-first habits in every lesson.",
      "Eight years of private swim lessons with swimmers of different ages and comfort levels.",
      "Former behavioral technician for children with special needs and a range of sensory profiles.",
      "Professional nanny for infants through school-age kids: patient, warm, and consistent day to day.",
      "Third-grade classroom aide experience, so she’s used to breaking ideas into clear steps and cheering on small wins.",
    ],
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
    qualifications: [
      "CPR and first aid certified through the American Red Cross and American Heart Association.",
      "Water Safety Instructor (WSI) and Red Cross Lifeguard Instructor.",
      "About four and a half years of lifeguarding, and he currently helps run lifeguard operations at American Fork Recreation Center.",
      "Five years of private swim instruction focused on structured progress and lasting confidence in the water.",
      "Medical assistant training, so he’s comfortable with calm, clear communication around health and safety.",
      "PADI Open Water Diver and Molchanovs Wave 1 freediver, with a deep respect for breath, control, and reading the water.",
    ],
  },
};

const STORAGE_KEY = "sts_instructor_profiles_v1";
const AUTH_KEY = "sts_admin_auth_v1";

export function getProfilesFromStorage(): Record<InstructorSlug, InstructorProfile> {
  if (typeof window === "undefined") return DEFAULT_PROFILES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw) as Partial<Record<InstructorSlug, Partial<InstructorProfile>>>;
    return {
      estee: {
        ...DEFAULT_PROFILES.estee,
        ...parsed.estee,
        qualifications:
          Array.isArray(parsed.estee?.qualifications) && parsed.estee!.qualifications!.length > 0
            ? (parsed.estee!.qualifications as string[])
            : DEFAULT_PROFILES.estee.qualifications,
      },
      lukaah: {
        ...DEFAULT_PROFILES.lukaah,
        ...parsed.lukaah,
        qualifications:
          Array.isArray(parsed.lukaah?.qualifications) && parsed.lukaah!.qualifications!.length > 0
            ? (parsed.lukaah!.qualifications as string[])
            : DEFAULT_PROFILES.lukaah.qualifications,
      },
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
