export const SITE = {
  name: "Swim to Surf",
  tagline: "Private Swimming Lessons in American Fork, Utah",
  email: "swimtosurfemail@gmail.com",
  phone: "385-499-8036",
  location: "American Fork, Utah",
  venmo: "@swimtosurf",
} as const;

export const INSTRUCTORS = {
  lukaah: {
    id: "lukaah" as const,
    name: "Lukaah",
    tagline: "Building confidence one stroke at a time",
    bio: "Lukaah brings patience, energy, and years of hands-on teaching to every lesson. Specializing in week-long intensive sessions, Lukaah helps swimmers of all ages build real confidence in the water through focused, daily practice.",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as const,
    startHour: 8,
    startMinute: 0,
    endHour: 11,
    endMinute: 30,
    scheduleLabel: "Monday – Friday, 8:00 AM – 11:30 AM",
    bookingType: "weekly" as const,
  },
  estee: {
    id: "estee" as const,
    name: "Estee",
    tagline: "Where safety meets joy in the water",
    bio: "Estee is known for her warmth, expertise, and ability to connect with swimmers of every age and skill level. She creates a safe, encouraging environment where children and adults alike discover what they're truly capable of in the water.",
    days: ["wednesday", "thursday"] as const,
    schedule: {
      wednesday: {
        am: { startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 },
        pm: { startHour: 12, startMinute: 30, endHour: 16, endMinute: 0 },
      },
      thursday: {
        am: { startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 },
        pm: { startHour: 12, startMinute: 30, endHour: 16, endMinute: 0 },
      },
    },
    scheduleLabel: "Wed & Thu, 8:00 AM – 11:30 AM & 12:30 PM – 4:00 PM",
    bookingType: "monthly" as const,
  },
} as const;

export const PRICING = {
  // Lukaah: per-week pricing (Mon-Fri, 5 lessons)
  infant: { age: "0–3", duration: 15, price: 7500, label: "$75", lessons: 5 },
  standard: { age: "4+", duration: 30, price: 15000, label: "$150", lessons: 5 },
  // Estee: per-month pricing (1 day/week = 4 lessons)
  esteeMonthly: { price: 12000, label: "$120", lessons: 4, duration: 30 },
  esteeInfantMonthly: { price: 6000, label: "$60", lessons: 4, duration: 15 },
} as const;

// Specific dates for each month - Estee's W/Th schedule
// July: exclude last week (July 30-31)
export function getEsteeDatesForMonth(monthValue: string): { wednesdays: string[]; thursdays: string[] } {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1; // 0-indexed

  const wednesdays: string[] = [];
  const thursdays: string[] = [];

  // Find all Wednesdays and Thursdays in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 3) wednesdays.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    if (dow === 4) thursdays.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  // For July, exclude the last week (last Wednesday and Thursday)
  if (month === 6) { // July is month index 6
    if (wednesdays.length > 4) wednesdays.pop();
    if (thursdays.length > 4) thursdays.pop();
  }

  return { wednesdays, thursdays };
}

export function getPricingForAge(age: number) {
  return age <= 3 ? PRICING.infant : PRICING.standard;
}

/** Get Estee's flat monthly price based on swimmer age */
export function getEsteePricingForAge(age: number) {
  return age <= 3 ? PRICING.esteeInfantMonthly : PRICING.esteeMonthly;
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export const FEATURES = {
  stripeEnabled: true,
} as const;
