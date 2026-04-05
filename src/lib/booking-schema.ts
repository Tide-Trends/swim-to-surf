import { z } from "zod";

export const swimmerInfoSchema = z.object({
  swimmerName: z.string().min(1, "Swimmer's name is required"),
  swimmerAge: z.coerce
    .number({ message: "Please enter a valid age" })
    .min(0, "Age must be 0 or above")
    .max(99, "Age must be 99 or below"),
  swimmerMonths: z.coerce.number().min(0).max(11).optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  parentPhone: z.string().min(7, "Please enter a valid phone number").optional().or(z.literal("")),
  notes: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.swimmerAge === 0 && (values.swimmerMonths === undefined || Number.isNaN(values.swimmerMonths))) {
    ctx.addIssue({
      code: "custom",
      path: ["swimmerMonths"],
      message: "Please select age in months for swimmers under 1 year old.",
    });
  }
  
  if (values.swimmerAge < 18) {
    if (!values.parentName || values.parentName.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["parentName"],
        message: "Parent/guardian name is required for minors.",
      });
    }
    if (!values.parentEmail || values.parentEmail.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["parentEmail"],
        message: "Parent/guardian email is required for minors.",
      });
    }
    if (!values.parentPhone || values.parentPhone.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["parentPhone"],
        message: "Parent/guardian phone is required for minors.",
      });
    }
  }

  if (values.swimmerAge >= 18) {
    if (!values.parentEmail?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["parentEmail"],
        message: "Email is required so we can send your booking confirmation.",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.parentEmail.trim())) {
      ctx.addIssue({
        code: "custom",
        path: ["parentEmail"],
        message: "Please enter a valid email.",
      });
    }
  }
});

export type SwimmerInfo = z.infer<typeof swimmerInfoSchema>;

export interface BookingState {
  step: number;
  instructor: "lukaah" | "estee" | null;
  swimmerInfo: SwimmerInfo | null;
  schedule: ScheduleSelection | null;
}

export interface LukaahSchedule {
  type: "weekly";
  weekStart: string; // ISO date string (Monday)
  time: string; // HH:mm
}

export interface EsteeSchedule {
  type: "monthly";
  month: string; // YYYY-MM
  primaryDay: "wednesday" | "thursday";
  primaryTime: string; // HH:mm
  secondDay: boolean;
  secondDayTime: string | null; // HH:mm
}

export type ScheduleSelection = LukaahSchedule | EsteeSchedule;
