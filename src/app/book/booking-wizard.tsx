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
import { StepSwimmers, MAX_SWIMMERS_PER_BOOKING } from "@/components/booking/step-swimmers";
import { StepSchedule } from "@/components/booking/step-schedule";
import { Button } from "@/components/ui/button";
import { StepConfirm } from "@/components/booking/step-confirm";
import { BookingSuccess } from "@/components/booking/booking-success";

const steps = ["Instructor", "Swimmers", "Schedule", "Confirm"];

type VerifySessionResponse = {
  ok?: boolean;
  error?: string;
  bookingIds?: string[];
  instructor?: "lukaah" | "estee";
  swimmers?: SwimmerInfo[];
  schedules?: ScheduleSelection[];
  customerEmailSent?: boolean;
  adminEmailSent?: boolean;
};

const quickFaqs = [
  {
    q: "What age groups do you teach?",
    a: "We teach all ages, from newborns to adults (0–99). Ages 0–2 use 15-minute infant lessons; ages 3+ use 30-minute standard lessons (you can override on the swimmer step if needed).",
  },
  {
    q: "How does booking with Lukaah work?",
    a: "You add one swimmer at a time. Each swimmer gets their own summer week and daily start time (Mon–Fri). Different swimmers can pick different weeks on the same booking.",
  },
  {
    q: "How does booking with Estee work?",
    a: "You add one swimmer at a time. Each swimmer picks their own month, weekday pattern, times, and optional second day. 4 or 8 lessons that month depending on the second day. Patterns can differ between swimmers.",
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

function totalLessonsInBooking(schedules: ScheduleSelection[]): number {
  return schedules.reduce((sum, sch) => {
    if (sch.type === "weekly") return sum + 5;
    return sum + (sch.secondDay && sch.secondDayTime ? 8 : 4);
  }, 0);
}

export function BookingWizard() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<BookingState>({
    step: 0,
    instructor: null,
    swimmers: null,
    swimmerSchedules: null,
  });

  /** Sequential booking: one swimmer → schedule → optional repeat */
  const [seqSwimmers, setSeqSwimmers] = useState<SwimmerInfo[]>([]);
  const [seqSchedules, setSeqSchedules] = useState<ScheduleSelection[]>([]);
  const [postSchedulePrompt, setPostSchedulePrompt] = useState(false);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<{ customer: boolean; admin: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "success" && sessionId) {
      let cancelled = false;
      setSubmitting(true);
      void (async () => {
        const maxAttempts = 8;
        const delaysMs = [0, 400, 800, 1200, 2000, 3000, 4000, 5000];

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        try {
          let lastData: VerifySessionResponse | null = null;

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (cancelled) return;
            await sleep(delaysMs[attempt] ?? 1500);
            if (cancelled) return;

            const res = await fetch(
              `/api/book/verify-session?session_id=${encodeURIComponent(sessionId)}`
            );
            const data = (await res.json()) as VerifySessionResponse;
            lastData = data;

            if (res.ok && data.ok && data.bookingIds?.length) {
              setState({
                step: 3,
                instructor: data.instructor ?? null,
                swimmers: data.swimmers ?? null,
                swimmerSchedules: data.schedules ?? null,
              });
              setBookingId(data.bookingIds[0]!);
              setEmailDelivery({
                customer: Boolean(data.customerEmailSent),
                admin: Boolean(data.adminEmailSent),
              });
              window.history.replaceState({}, "", "/book");
              return;
            }

            // Stripe sometimes lags a moment after redirect before payment_status is "paid"
            if (res.status === 402 && attempt < maxAttempts - 1) continue;
            break;
          }

          if (cancelled) return;
          alert(
            typeof lastData?.error === "string"
              ? lastData.error
              : "We couldn’t confirm your payment yet. If checkout finished, you should get an email once it processes (often the same day), or contact us with your Stripe receipt."
          );
          window.history.replaceState({}, "", "/book");
        } catch {
          if (!cancelled) {
            alert(
              "Could not confirm your booking. If you were charged, save your Stripe receipt and contact us."
            );
            window.history.replaceState({}, "", "/book");
          }
        } finally {
          if (!cancelled) setSubmitting(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const inst = searchParams.get("instructor");
    if (inst === "lukaah" || inst === "estee") {
      setSeqSwimmers([]);
      setSeqSchedules([]);
      setPostSchedulePrompt(false);
      setState((s) => ({ ...s, instructor: inst, step: 1, swimmers: null, swimmerSchedules: null }));
    }
  }, [searchParams]);

  function selectInstructor(id: "lukaah" | "estee") {
    setSeqSwimmers([]);
    setSeqSchedules([]);
    setPostSchedulePrompt(false);
    setState({ step: 1, instructor: id, swimmers: null, swimmerSchedules: null });
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function appendSwimmerForSchedule(swimmers: SwimmerInfo[]) {
    const next = swimmers[0]!;
    setSeqSwimmers((prev) => [...prev, next]);
    setPostSchedulePrompt(false);
    setState((s) => ({ ...s, step: 2 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function onScheduleStepComplete(newSchedules: ScheduleSelection[]) {
    setSeqSchedules((prev) => [...prev, ...newSchedules]);
    setPostSchedulePrompt(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function scheduleStepBack() {
    setSeqSwimmers((prev) => prev.slice(0, -1));
    setPostSchedulePrompt(false);
    setState((s) => ({ ...s, step: 1 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function swimmerStepBack() {
    if (seqSwimmers.length === 0) {
      setState((s) => ({ ...s, step: 0, instructor: null }));
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
      return;
    }
    setPostSchedulePrompt(true);
    setState((s) => ({ ...s, step: 2 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function postScheduleStepBack() {
    setSeqSchedules((prev) => prev.slice(0, -1));
    setPostSchedulePrompt(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function addAnotherSwimmerFromPrompt() {
    setPostSchedulePrompt(false);
    setState((s) => ({ ...s, step: 1 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function continueToReview() {
    setPostSchedulePrompt(false);
    setState((s) => ({
      ...s,
      step: 3,
      swimmers: seqSwimmers,
      swimmerSchedules: seqSchedules,
    }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function confirmStepBack() {
    setPostSchedulePrompt(true);
    setState((s) => ({ ...s, step: 2 }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  async function confirmBooking(paymentMethod: "stripe" | "venmo") {
    if (!state.instructor || !state.swimmers?.length || !state.swimmerSchedules?.length) return;
    setSubmitting(true);

    const swimmers = state.swimmers;
    const schedules = state.swimmerSchedules;
    const totalLessons = totalLessonsInBooking(schedules);

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
                  key={`${state.step}-${postSchedulePrompt}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {state.step === 0 && "Choose an instructor"}
                  {state.step === 1 && (seqSwimmers.length === 0 ? "First swimmer" : "Next swimmer")}
                  {state.step === 2 && postSchedulePrompt && "Anyone else?"}
                  {state.step === 2 && !postSchedulePrompt && "Select a schedule"}
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
                    i <=
                    (state.step === 3 ? 3 : state.step === 2 && postSchedulePrompt ? 2 : state.step)
                      ? "bg-[#1D1D1F]"
                      : "bg-[#E8E8ED]"
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
              key={`${state.step}-${postSchedulePrompt}`}
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
                  sequential
                  sequentialRole={seqSwimmers.length === 0 ? "first" : "additional"}
                  primaryContact={seqSwimmers[0]}
                  onSubmit={appendSwimmerForSchedule}
                  onBack={swimmerStepBack}
                />
              )}
              {state.step === 2 &&
                !postSchedulePrompt &&
                state.instructor &&
                seqSwimmers.length > 0 && (
                  <StepSchedule
                    instructor={state.instructor}
                    swimmers={[seqSwimmers[seqSwimmers.length - 1]!]}
                    committedSwimmers={seqSwimmers.slice(0, -1)}
                    committedSchedules={seqSchedules}
                    onSelect={onScheduleStepComplete}
                    onBack={scheduleStepBack}
                  />
                )}
              {state.step === 2 && postSchedulePrompt && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-3">
                      Add another swimmer?
                    </h3>
                    <p className="text-[#86868B] font-body text-sm leading-relaxed max-w-xl">
                      Same booking and contact info. You’ll enter their details, then choose their week or month and
                      times.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full py-6 order-3 sm:order-1"
                      onClick={postScheduleStepBack}
                    >
                      Edit last schedule
                    </Button>
                    {seqSwimmers.length < MAX_SWIMMERS_PER_BOOKING && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full py-6 order-2 sm:order-2 flex-1"
                        onClick={addAnotherSwimmerFromPrompt}
                      >
                        Add another swimmer
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="rounded-full py-6 bg-[#1D1D1F] text-white hover:bg-black order-1 sm:order-3 flex-1"
                      onClick={continueToReview}
                    >
                      Continue to review
                    </Button>
                  </div>
                </div>
              )}
              {state.step === 3 && state.instructor && state.swimmers?.length && state.swimmerSchedules && (
                <StepConfirm
                  instructor={state.instructor}
                  swimmers={state.swimmers}
                  schedules={state.swimmerSchedules}
                  onConfirm={(m) => {
                    void confirmBooking(m);
                  }}
                  onBack={confirmStepBack}
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
