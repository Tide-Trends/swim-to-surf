"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { BookingState, ScheduleSelection, SwimmerInfo } from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  lessonDurationMinutesForSwimmer,
  PAYMENT_OPTIONS_COPY,
  unitPriceCentsForSwimmerSchedule,
} from "@/lib/constants";
import { StepInstructor } from "@/components/booking/step-instructor";
import { StepSwimmers } from "@/components/booking/step-swimmers";
import { StepSchedule } from "@/components/booking/step-schedule";
import { StepConfirm } from "@/components/booking/step-confirm";
import { BookingSuccess } from "@/components/booking/booking-success";

const steps = ["Instructor", "Swimmers", "Schedule", "Confirm"];

const quickFaqs = [
  {
    q: "What age groups do you teach?",
    a: "We teach all ages, from newborns to adults (0–99). Ages 0–2 use 15-minute infant lessons; ages 3+ use 30-minute standard lessons (you can override on the swimmer step if needed).",
  },
  {
    q: "How does booking with Lukaah work?",
    a: "Pick one summer week, then each swimmer chooses their own daily start time (same time Mon–Fri for that swimmer). 5 lessons per swimmer for the week.",
  },
  {
    q: "How does booking with Estee work?",
    a: "Pick the month and primary weekday, then each swimmer picks their own start times (and optional second weekday). 4 or 8 lessons per swimmer depending on whether you add the second day.",
  },
  {
    q: "Do you offer group lessons?",
    a: "No. We believe private, 1-on-1 focus is the only way to build real confidence and skill quickly.",
  },
  {
    q: "How do I pay?",
    a: PAYMENT_OPTIONS_COPY.booking,
  },
];

export function BookingWizard() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<BookingState>({
    step: 0,
    instructor: null,
    swimmers: null,
    swimmerSchedules: null,
  });

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<{ customer: boolean; admin: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const inst = searchParams.get("instructor");
    if (inst === "lukaah" || inst === "estee") {
      setState((s) => ({ ...s, instructor: inst, step: 1 }));
    }
  }, [searchParams]);

  function selectInstructor(id: "lukaah" | "estee") {
    setState((s) => ({ ...s, instructor: id, step: 1 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function setSwimmers(swimmers: SwimmerInfo[]) {
    setState((s) => ({ ...s, swimmers, step: 2 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function setSwimmerSchedules(swimmerSchedules: ScheduleSelection[]) {
    setState((s) => ({ ...s, swimmerSchedules, step: 3 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function goBack() {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  async function confirmBooking(paymentMethod: "stripe" | "venmo") {
    if (!state.instructor || !state.swimmers?.length || !state.swimmerSchedules?.length) return;
    setSubmitting(true);

    const swimmers = state.swimmers;
    const schedules = state.swimmerSchedules;
    const firstSch = schedules[0]!;
    const totalLessons =
      firstSch.type === "weekly" ? 5 : firstSch.secondDay && firstSch.secondDayTime ? 8 : 4;

    const price = swimmers.reduce(
      (sum, sw, i) => sum + unitPriceCentsForSwimmerSchedule(state.instructor!, sw, schedules[i]!),
      0
    );

    const body = {
      instructor: state.instructor,
      swimmers,
      schedules,
      priceInfo: {
        price,
        totalLessons,
      },
      paymentMethod,
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `Booking failed (${res.status})`);
      }

      if (data.url && data.url.includes("checkout.stripe.com")) {
        window.location.href = data.url;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setBookingId(data.id || "manual-booking-fallback");
        setEmailDelivery({
          customer: Boolean(data.customerEmailSent),
          admin: Boolean(data.adminEmailSent),
        });
      }
    } catch (err) {
      console.error("Booking failed:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      alert(
        msg.includes("Invalid API Key")
          ? "Card payments are temporarily unavailable. Please use pay later instead."
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingId && state.swimmers?.length && state.swimmerSchedules?.length && state.instructor) {
    const instructor = state.instructor;
    const tier = effectiveLessonTier(state.swimmers[0]!.swimmerAge, state.swimmers[0]!.lessonTier ?? "auto");
    const pricing =
      instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
    const durs = state.swimmers.map((s) => lessonDurationMinutesForSwimmer(instructor, s));
    const mixedLessonLengths = new Set(durs).size > 1;
    return (
      <BookingSuccess
        bookingId={bookingId}
        instructor={instructor}
        swimmers={state.swimmers}
        schedules={state.swimmerSchedules}
        pricing={pricing}
        mixedLessonLengths={mixedLessonLengths}
        emailDelivery={emailDelivery}
      />
    );
  }

  return (
    <div className="bg-[#F5F5F7] min-h-[100dvh] flex flex-col font-body">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5 shrink-0 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-display font-medium tracking-tight">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {state.step === 0 && "Choose an instructor"}
                  {state.step === 1 && "Swimmer details"}
                  {state.step === 2 && "Select a schedule"}
                  {state.step === 3 && "Review and confirm"}
                </motion.div>
              </AnimatePresence>
            </h1>
            <button
              onClick={() => (window.location.href = "/")}
              className="text-sm font-ui uppercase tracking-widest text-black/70 hover:text-black"
            >
              Cancel
            </button>
          </div>

          <div className="flex gap-2">
            {steps.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full transition-all duration-700 ${
                    i <= state.step ? "bg-[#1D1D1F]" : "bg-[#E8E8ED]"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:p-8 pb-32">
        <div className="mx-auto max-w-4xl flex flex-col h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl border border-black/5 p-6 md:p-12 shadow-sm flex-1 flex flex-col mb-12"
            >
              {state.step === 0 && <StepInstructor onSelect={selectInstructor} />}
              {state.step === 1 && (
                <StepSwimmers
                  instructor={state.instructor || "lukaah"}
                  defaultPrimary={state.swimmers?.[0]}
                  defaultExtras={
                    state.swimmers && state.swimmers.length > 1
                      ? state.swimmers.slice(1).map((s) => ({
                          swimmerName: s.swimmerName,
                          swimmerAge: s.swimmerAge,
                          swimmerMonths: s.swimmerMonths,
                          lessonTier: s.lessonTier ?? "auto",
                          notes: s.notes,
                        }))
                      : undefined
                  }
                  onSubmit={setSwimmers}
                  onBack={goBack}
                />
              )}
              {state.step === 2 && state.instructor && state.swimmers?.length && (
                <StepSchedule instructor={state.instructor} swimmers={state.swimmers} onSelect={setSwimmerSchedules} onBack={goBack} />
              )}
              {state.step === 3 && state.instructor && state.swimmers?.length && state.swimmerSchedules && (
                <StepConfirm
                  instructor={state.instructor}
                  swimmers={state.swimmers}
                  schedules={state.swimmerSchedules}
                  onConfirm={(m) => {
                    void confirmBooking(m);
                  }}
                  onBack={goBack}
                  loading={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mx-auto max-w-2xl pb-16 px-2 min-h-[26rem] md:min-h-[28rem]">
            <p className="font-ui text-xs font-semibold uppercase tracking-widest text-[#86868B] mb-4">Quick answers</p>
            <div className="space-y-4 min-h-[22rem] md:min-h-[24rem]">
              {quickFaqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-black/10 bg-white/80 px-4 py-3 open:shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-ui text-sm font-semibold text-[#1D1D1F] marker:hidden [&::-webkit-details-marker]:hidden flex justify-between gap-2">
                    {f.q}
                    <span className="text-[#86868B] text-xs shrink-0 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-sm text-[#86868B] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
