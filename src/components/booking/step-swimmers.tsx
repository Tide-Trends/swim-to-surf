"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  swimmerInfoSchema,
  additionalSwimmerSchema,
  mergeSwimmersWithPrimary,
  type AdditionalSwimmer,
  type SwimmerInfo,
} from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAX_SWIMMERS = 5;

/** Form row for additional swimmers — age starts blank until the parent fills it in. */
type ExtraDraft = {
  swimmerName: string;
  swimmerAge: number | "";
  swimmerMonths?: number;
  lessonTier: "auto" | "infant" | "standard";
  notes?: string;
};

function extraDraftFromSaved(s: AdditionalSwimmer): ExtraDraft {
  return {
    swimmerName: s.swimmerName,
    swimmerAge: s.swimmerAge,
    swimmerMonths: s.swimmerMonths,
    lessonTier: s.lessonTier ?? "auto",
    notes: s.notes,
  };
}

interface Props {
  instructor: "lukaah" | "estee";
  defaultPrimary?: SwimmerInfo;
  defaultExtras?: AdditionalSwimmer[];
  onSubmit: (swimmers: SwimmerInfo[]) => void;
  onBack: () => void;
}

function emptyExtra(): ExtraDraft {
  return {
    swimmerName: "",
    swimmerAge: "",
    lessonTier: "auto",
    notes: "",
  };
}

export function StepSwimmers({ instructor, defaultPrimary, defaultExtras, onSubmit, onBack }: Props) {
  const [extras, setExtras] = useState<ExtraDraft[]>(() => defaultExtras?.map(extraDraftFromSaved) ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SwimmerInfo>({
    resolver: zodResolver(swimmerInfoSchema) as never,
    defaultValues: {
      swimmerName: defaultPrimary?.swimmerName ?? "",
      swimmerAge: (defaultPrimary?.swimmerAge ?? undefined) as unknown as number,
      swimmerMonths: defaultPrimary?.swimmerMonths,
      lessonTier: defaultPrimary?.lessonTier ?? "auto",
      parentName: defaultPrimary?.parentName ?? "",
      parentEmail: defaultPrimary?.parentEmail ?? "",
      parentPhone: defaultPrimary?.parentPhone ?? "",
      notes: defaultPrimary?.notes ?? "",
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

  function updateExtra(index: number, patch: Partial<ExtraDraft>) {
    setExtras((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeExtra(index: number) {
    setExtras((prev) => prev.filter((_, i) => i !== index));
  }

  function submitAll(primary: SwimmerInfo) {
    setFormError(null);
    const validatedExtras: AdditionalSwimmer[] = [];
    for (let i = 0; i < extras.length; i++) {
      const row = extras[i]!;
      if (row.swimmerAge === "") {
        setFormError(`Please enter swimmer ${i + 2}'s age.`);
        return;
      }
      const candidate: AdditionalSwimmer = {
        swimmerName: row.swimmerName,
        swimmerAge: row.swimmerAge,
        swimmerMonths: row.swimmerMonths,
        lessonTier: row.lessonTier ?? "auto",
        notes: row.notes,
      };
      const r = additionalSwimmerSchema.safeParse(candidate);
      if (!r.success) {
        const msg = r.error.flatten().fieldErrors;
        const first = Object.values(msg).flat()[0];
        setFormError(first || `Please check swimmer ${i + 2}'s details.`);
        return;
      }
      validatedExtras.push(r.data);
    }
    onSubmit(mergeSwimmersWithPrimary(primary, validatedExtras));
  }

  return (
    <form onSubmit={handleSubmit(submitAll)} className="space-y-10">
      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-2">Swimmers</h3>
        <p className="font-ui text-sm text-[#86868B] mb-8 max-w-xl leading-relaxed">
          Add every child (or adult) on this booking. You’ll share the same week (Lukaah) or month and day pattern (Estee); each swimmer picks their own start times. Lesson length follows each swimmer’s age (15 min for 0–2, 30 min for 3+) unless you override it — mixed lengths on one booking are fine.
        </p>

        <div className="rounded-2xl border border-ocean-deep/20 bg-ocean-surf/20 px-4 py-3 mb-8">
          <p className="font-ui text-xs font-semibold text-ocean-deep">First swimmer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="First name"
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
              <strong className="text-[#1D1D1F]">3+</strong> → 30 min standard. Override per swimmer if needed (e.g. a 3-year-old who fits better in 15 minutes).
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
              &middot; {pricing.duration}-minute private lessons with {instructor === "lukaah" ? "Lukaah" : "Estee"} &middot;{" "}
              {pricing.label}
              {instructor === "lukaah" ? "/week (5 lessons)" : "/month (4 lessons)"}
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
        <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">Notes (first swimmer)</h3>
        <Textarea
          label="Special needs or notes (optional)"
          placeholder="Anything we should know? Sensory needs, fears, medical conditions, etc."
          {...register("notes")}
        />
      </div>

      {extras.length > 0 && (
        <div className="border-t border-black/5 pt-10 space-y-8">
          <h3 className="font-display text-2xl font-medium tracking-tight text-[#1D1D1F]">Additional swimmers</h3>
          {extras.map((row, index) => (
            <div
              key={index}
              className="rounded-2xl border border-black/10 bg-[#fafafa] p-6 space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => removeExtra(index)}
                className="absolute top-4 right-4 text-xs font-ui font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                Remove
              </button>
              <p className="font-ui text-xs font-semibold uppercase tracking-widest text-[#86868B]">Swimmer {index + 2}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={row.swimmerName}
                  onChange={(e) => updateExtra(index, { swimmerName: e.target.value })}
                />
                <Input
                  label="Age"
                  type="number"
                  min={0}
                  max={99}
                  placeholder="e.g. 4"
                  value={row.swimmerAge === "" ? "" : row.swimmerAge}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateExtra(index, { swimmerAge: v === "" ? "" : Number(v) });
                  }}
                />
              </div>
              {row.swimmerAge !== "" && row.swimmerAge === 0 && (
                <Input
                  label="Months (0–11)"
                  type="number"
                  min={0}
                  max={11}
                  value={row.swimmerMonths ?? ""}
                  onChange={(e) =>
                    updateExtra(index, { swimmerMonths: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              )}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { v: "auto" as const, label: "Auto" },
                    { v: "infant" as const, label: "15 min" },
                    { v: "standard" as const, label: "30 min" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => updateExtra(index, { lessonTier: opt.v })}
                    className={`rounded-full border px-3 py-2 font-ui text-xs font-semibold ${
                      (row.lessonTier ?? "auto") === opt.v
                        ? "border-ocean-deep bg-ocean-surf/60 text-ocean-deep"
                        : "border-black/12 bg-white text-[#1D1D1F]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {(() => {
                const ageNum = row.swimmerAge;
                const validAge =
                  ageNum !== "" && typeof ageNum === "number" && ageNum >= 0 && ageNum <= 99;
                const exTier = validAge ? effectiveLessonTier(ageNum, row.lessonTier ?? "auto") : null;
                const exPricing =
                  validAge && exTier
                    ? instructor === "estee"
                      ? getEsteePricingForTier(exTier)
                      : getLukaahPricingForTier(exTier)
                    : null;
                if (!exPricing) return null;
                const autoNote =
                  (row.lessonTier ?? "auto") === "auto" && ageNum === 0 && typeof row.swimmerMonths === "number"
                    ? ` (${row.swimmerMonths} mo)`
                    : "";
                return (
                  <div className="rounded-2xl px-4 py-3 bg-[#F5F5F7] border border-black/5 text-sm font-ui flex items-start gap-3 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#1D1D1F] mt-1.5 shrink-0" />
                    <p className="text-[#86868B] leading-relaxed">
                      <span className="font-semibold text-[#1D1D1F]">
                        {exPricing.duration === 15 ? "Infant lessons" : "Standard lessons"}
                      </span>
                      {" · "}
                      {exPricing.duration}-minute private lessons with {instructor === "lukaah" ? "Lukaah" : "Estee"} ·{" "}
                      {exPricing.label}
                      {instructor === "lukaah" ? "/week (5 lessons)" : "/month (4 lessons)"}
                      {autoNote}
                    </p>
                  </div>
                );
              })()}
              <Textarea
                label="Notes (optional)"
                value={row.notes ?? ""}
                onChange={(e) => updateExtra(index, { notes: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {extras.length < MAX_SWIMMERS - 1 && (
        <Button
          type="button"
          variant="outline"
          className="rounded-full w-full sm:w-auto"
          onClick={() => setExtras((p) => [...p, emptyExtra()])}
        >
          + Add another swimmer
        </Button>
      )}

      {formError && (
        <p className="text-sm text-red-600 font-ui" role="alert">
          {formError}
        </p>
      )}

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
