"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { swimmerInfoSchema, type SwimmerInfo } from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  instructor: "lukaah" | "estee";
  defaultValues?: SwimmerInfo;
  onSubmit: (data: SwimmerInfo) => void;
  onBack: () => void;
}

export function StepSwimmerInfo({ instructor, defaultValues, onSubmit, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SwimmerInfo>({
    resolver: zodResolver(swimmerInfoSchema) as never,
    defaultValues: {
      swimmerName: defaultValues?.swimmerName ?? "",
      swimmerAge: (defaultValues?.swimmerAge ?? undefined) as unknown as number,
      swimmerMonths: defaultValues?.swimmerMonths,
      lessonTier: defaultValues?.lessonTier ?? "auto",
      parentName: defaultValues?.parentName ?? "",
      parentEmail: defaultValues?.parentEmail ?? "",
      parentPhone: defaultValues?.parentPhone ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const age = watch("swimmerAge");
  const months = watch("swimmerMonths");
  const lessonTier = watch("lessonTier");
  const isValidAge = typeof age === "number" && age >= 0 && age <= 99;
  const tier = isValidAge ? effectiveLessonTier(age, lessonTier ?? "auto") : null;
  const pricing =
    isValidAge && tier
      ? instructor === "estee"
        ? getEsteePricingForTier(tier)
        : getLukaahPricingForTier(tier)
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">About the Swimmer</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            placeholder="e.g. Emma"
            error={errors.swimmerName?.message}
            {...register("swimmerName")}
          />
          <Input
            label="Age"
            type="number"
            placeholder="e.g. 4"
            min={0}
            max={99}
            error={errors.swimmerAge?.message}
            {...register("swimmerAge", { valueAsNumber: true })}
          />
        </div>
      {age === 0 && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Input
            label="Age in Months (required under 1 year old)"
            type="number"
            placeholder="0-11"
            min={0}
            max={11}
            error={errors.swimmerMonths?.message}
            {...register("swimmerMonths")}
          />
        </div>
      )}

        <details className="group mt-6 rounded-xl border border-black/10 bg-[#fafafa] open:bg-white open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-ui text-sm font-semibold text-[#1D1D1F] marker:hidden [&::-webkit-details-marker]:hidden">
            <span>Lesson length override</span>
            <span className="text-xs font-medium text-[#86868B] transition-transform group-open:-rotate-180">▼</span>
          </summary>
          <div className="space-y-3 border-t border-black/5 px-4 pb-4 pt-3">
            <p className="font-ui text-xs leading-relaxed text-[#86868B]">
              Default: <strong className="text-[#1D1D1F]">0–2</strong> → 15 min infant ·{" "}
              <strong className="text-[#1D1D1F]">3+</strong> → 30 min standard. Expand only if you need the other length.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { v: "auto" as const, label: "Auto" },
                  { v: "infant" as const, label: "15 min" },
                  { v: "standard" as const, label: "30 min" },
                ]
              ).map((opt) => (
                <label
                  key={opt.v}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 font-ui text-xs font-semibold transition-colors ${
                    (lessonTier ?? "auto") === opt.v
                      ? "border-ocean-deep bg-ocean-surf/60 text-ocean-deep"
                      : "border-black/12 bg-white text-[#1D1D1F] hover:border-black/25"
                  }`}
                >
                  <input type="radio" value={opt.v} className="sr-only" {...register("lessonTier")} />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.lessonTier && (
              <p className="text-sm text-error">{String(errors.lessonTier.message)}</p>
            )}
          </div>
        </details>

        {pricing && (
          <div className="mt-8 rounded-2xl px-6 py-5 bg-[#F5F5F7] border border-black/5 text-sm font-ui flex items-center gap-4 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1D1D1F]" />
            <p className="text-[#86868B]">
              <span className="font-semibold text-[#1D1D1F]">
                {pricing.duration === 15 ? "Infant lessons" : "Standard lessons"}
              </span>{" "}
              &middot; {pricing.duration}-minute private lessons with {instructor === "lukaah" ? "Lukaah" : "Estee"} &middot; {pricing.label}{instructor === "lukaah" ? "/week (5 lessons)" : "/month (4 lessons)"}
              {age === 0 && typeof months === "number" && ` (${months} months old)`}
            </p>
          </div>
        )}
      </div>

      {(!isValidAge || age < 18) && (
        <div className="border-t border-black/5 pt-10">
          <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">Parent / Guardian</h3>
          <div className="space-y-6">
            <Input
              label="Full Name"
              placeholder="e.g. John Smith"
              error={errors.parentName?.message}
              {...register("parentName")}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                error={errors.parentEmail?.message}
                {...register("parentEmail")}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="(385) 000-0000"
                error={errors.parentPhone?.message}
                {...register("parentPhone")}
              />
            </div>
          </div>
        </div>
      )}

      {isValidAge && age >= 18 && (
        <div className="border-t border-black/5 pt-10">
          <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">Contact Info</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.parentEmail?.message}
              {...register("parentEmail")}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="(385) 000-0000"
              error={errors.parentPhone?.message}
              {...register("parentPhone")}
            />
          </div>
        </div>
      )}

      <div className="border-t border-black/5 pt-10">
        <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">Additional Details</h3>
        <Textarea
          label="Special Needs or Notes (optional)"
          placeholder="Anything we should know? Sensory needs, fears, medical conditions, etc."
          {...register("notes")}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-8">
        <Button type="button" variant="outline" onClick={onBack} className="order-2 sm:order-1 rounded-full py-6">
          Back
        </Button>
        <Button type="submit" className="flex-1 order-1 sm:order-2 rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black">
          Continue to Schedule
        </Button>
      </div>
    </form>
  );
}
