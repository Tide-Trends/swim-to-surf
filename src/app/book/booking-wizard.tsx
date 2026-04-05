"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { BookingState, ScheduleSelection, SwimmerInfo } from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  getEsteePricingForTier,
  getLukaahPricingForTier,
} from "@/lib/constants";
import { StepInstructor } from "@/components/booking/step-instructor";
import { StepSwimmerInfo } from "@/components/booking/step-swimmer-info";
import { StepSchedule } from "@/components/booking/step-schedule";
import { StepConfirm } from "@/components/booking/step-confirm";
import { BookingSuccess } from "@/components/booking/booking-success";

const steps = ["Instructor", "Swimmer", "Schedule", "Confirm"];

const quickFaqs = [
  { q: "What age groups do you teach?", a: "We teach all ages, from newborns to adults (0–99). Ages 0–2 use 15-minute infant lessons; ages 3+ use 30-minute standard lessons (you can override on the swimmer step if needed)." },
  { q: "How does booking with Lukaah work?", a: "Choose one time and it repeats Monday-Friday for one week only (5 total lessons)." },
  { q: "How does booking with Estee work?", a: "Choose one weekly slot (Wednesday or Thursday) for the month (4 lessons), with optional second weekly slot (8 lessons)." },
  { q: "Do you offer group lessons?", a: "No. We believe private, 1-on-1 focus is the only way to build real confidence and skill quickly." },
  { q: "How do I pay?", a: "Payment is due on the first day of your session. We accept Venmo (@swimtosurf), cash, or check." }
];

export function BookingWizard() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<BookingState>({
    step: 0,
    instructor: null,
    swimmerInfo: null,
    schedule: null,
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

  function setSwimmerInfo(info: SwimmerInfo) {
    setState((s) => ({ ...s, swimmerInfo: info, step: 2 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function setSchedule(schedule: ScheduleSelection) {
    setState((s) => ({ ...s, schedule, step: 3 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function goBack() {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  async function confirmBooking(paymentMethod: "stripe" | "venmo") {
    if (!state.instructor || !state.swimmerInfo || !state.schedule) return;
    setSubmitting(true);

    const isEstee = state.instructor === "estee";
    const tier = effectiveLessonTier(state.swimmerInfo.swimmerAge, state.swimmerInfo.lessonTier ?? "auto");
    const pricing = isEstee ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
    let totalLessons: number;
    let price: number;

    if (state.schedule.type === "weekly") {
      totalLessons = 5;
      price = pricing.price;
    } else {
      totalLessons = state.schedule.secondDay ? 8 : 4;
      price = state.schedule.secondDay ? pricing.price * 2 : pricing.price;
    }

    const body = {
      instructor: state.instructor,
      swimmerInfo: state.swimmerInfo,
      schedule: state.schedule,
      priceInfo: {
        duration: pricing.duration,
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
          ? "Card payments are temporarily unavailable. Please use Venmo or Cash instead."
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingId && state.swimmerInfo && state.schedule && state.instructor) {
    const tier = effectiveLessonTier(state.swimmerInfo.swimmerAge, state.swimmerInfo.lessonTier ?? "auto");
    const pricing =
      state.instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);
    return (
      <BookingSuccess
        bookingId={bookingId}
        instructor={state.instructor}
        swimmerInfo={state.swimmerInfo}
        schedule={state.schedule}
        pricing={pricing}
        emailDelivery={emailDelivery}
      />
    );
  }

  return (
    <div className="bg-[#F5F5F7] min-h-[100dvh] flex flex-col font-body">
      {/* Compact Header */}
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
            <button onClick={() => window.location.href = '/'} className="text-sm font-ui uppercase tracking-widest text-black/70 hover:text-black">
              Cancel
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {steps.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded-full transition-all duration-700 ${
                  i <= state.step ? "bg-[#1D1D1F]" : "bg-[#E8E8ED]"
                }`} />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
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
                <StepSwimmerInfo
                  instructor={state.instructor || "lukaah"}
                  defaultValues={state.swimmerInfo || undefined}
                  onSubmit={setSwimmerInfo}
                  onBack={goBack}
                />
              )}
              {state.step === 2 && state.instructor && state.swimmerInfo && (
                <StepSchedule
                  instructor={state.instructor}
                  swimmerAge={state.swimmerInfo.swimmerAge}
                  lessonTier={state.swimmerInfo.lessonTier ?? "auto"}
                  onSelect={setSchedule}
                  onBack={goBack}
                />
              )}
              {state.step === 3 && state.instructor && state.swimmerInfo && state.schedule && (
                <StepConfirm
                  instructor={state.instructor}
                  swimmerInfo={state.swimmerInfo}
                  schedule={state.schedule}
                  onConfirm={(m) => { void confirmBooking(m); }}
                  onBack={goBack}
                  loading={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
