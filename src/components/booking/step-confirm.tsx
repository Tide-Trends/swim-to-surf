"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import type { SwimmerInfo, ScheduleSelection } from "@/lib/booking-schema";
import {
  effectiveLessonTier,
  formatPrice,
  getEsteePricingForTier,
  getLukaahPricingForTier,
  INSTRUCTORS,
  PAYMENT_OPTIONS_COPY,
} from "@/lib/constants";
import { formatLessonTimeHm, SITE_TIMEZONE_LABEL } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const WAIVER_TEXT = `Swim to Surf LLC – Assumption of Risk, Waiver of Liability, and Release Form

In consideration of being permitted to participate in swimming lessons, swimming-related activities, and any other events, activities, or programs (the "Activities") provided by Swim to Surf LLC ("the Company"), and to use the pool, facilities, equipment, and residential property (collectively, the "Facility"), I, on behalf of myself, my minor child(ren), any infant participants under my care, my heirs, personal representatives, assigns, and guests, do hereby acknowledge and agree to the following terms and conditions:

1. ASSUMPTION OF RISKS
I understand and acknowledge that the Activities involve inherent risks, dangers, and hazards, which may include, but are not limited to: Slips, trips, or falls on wet, slippery, or uneven surfaces; Near-drowning, drowning, or other water-related emergencies; Animal bites or scratches from household pets or animals present on the property. I willingly and voluntarily assume all such risks.

2. WAIVER AND RELEASE OF LIABILITY
I hereby fully and forever release, waive, discharge, and covenant not to sue Swim To Surf LLC, its owners, operators, instructors, employees, contractors, agents, and the owners of the residential property where the Facility is located (collectively, the "Released Parties"), from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, injury, or death that may be sustained by me, my minor child(ren), or guests while participating in the Activities or while on the premises of the Facility.

3. INDEMNIFICATION
I agree to indemnify, defend, and hold harmless the Released Parties from any and all claims, damages, costs, or liabilities (including attorneys' fees) arising from my actions or omissions, or those of any minor participant or guest under my supervision.

4. PROPERTY DAMAGE RESPONSIBILITY
I acknowledge that I am fully responsible for any damage, accidental or intentional, that I, my minor participant, or guest may cause to the Facility, equipment, or any other property belonging to Swim To Surf LLC.

5. ANIMAL AWARENESS
I acknowledge that the Facility may have dogs or other animals present and understand that interactions with such animals carry inherent risks. I voluntarily assume all risks associated with the presence of animals.

6. MEDICAL TREATMENT CONSENT
I authorize Swim To Surf LLC to obtain emergency medical treatment on my behalf in the event of an injury, accident, or illness, and I agree to be fully responsible for any and all medical expenses incurred.

7. PHOTO AND VIDEO RELEASE
I grant Swim To Surf LLC permission to use photographs or videos taken of me (or my minor child) during participation for promotional or educational purposes, without compensation.

8. CANCELLATION & MISSED LESSON POLICY
Full cancellations require a minimum of 7 days advance notice. If you need to miss an individual lesson, please notify us at least 24 hours in advance and we will see what we can do — however, makeup sessions are not guaranteed. No-shows or late cancellations will not be refunded or rescheduled.

9. DURATION AND EFFECTIVENESS
I acknowledge and agree that this waiver remains in full force and effect indefinitely and applies to any and all visits to the Facility or participation in activities provided by Swim To Surf LLC, now and in the future.

10. GENERAL PROVISIONS
I acknowledge that this waiver is binding upon me, my heirs, legal representatives, and assigns. By signing below, I acknowledge that I have read this document in its entirety, understand its contents, and voluntarily agree with full knowledge of its legal significance.`;

interface Props {
  instructor: "lukaah" | "estee";
  swimmers: SwimmerInfo[];
  schedules: ScheduleSelection[];
  onConfirm: (method: "stripe" | "venmo") => void;
  onBack: () => void;
  loading: boolean;
}

function summarizeSchedule(s: ScheduleSelection): string {
  if (s.type === "weekly") {
    const weekDate = new Date(s.weekStart + "T12:00:00");
    const timeLabel = formatLessonTimeHm(s.time);
    return `Mon – Fri at ${timeLabel} (${SITE_TIMEZONE_LABEL}), week of ${format(weekDate, "MMM d, yyyy")}`;
  }
  const [y, m] = s.month.split("-");
  const monthDate = new Date(Number(y), Number(m) - 1, 1);
  const timeLabel = formatLessonTimeHm(s.primaryTime);
  if (s.secondDay && s.secondDayTime) {
    const otherDay = s.primaryDay === "wednesday" ? "Thursday" : "Wednesday";
    const secondLabel = formatLessonTimeHm(s.secondDayTime);
    return `${s.primaryDay.charAt(0).toUpperCase() + s.primaryDay.slice(1)} at ${timeLabel} + ${otherDay} at ${secondLabel}, ${format(monthDate, "MMMM yyyy")} (${SITE_TIMEZONE_LABEL})`;
  }
  return `Every ${s.primaryDay.charAt(0).toUpperCase() + s.primaryDay.slice(1)} at ${timeLabel}, ${format(monthDate, "MMMM yyyy")} (${SITE_TIMEZONE_LABEL})`;
}

export function StepConfirm({ instructor, swimmers, schedules, onConfirm, onBack, loading }: Props) {
  const swimmerInfo = swimmers[0]!;
  const firstSch = schedules[0]!;
  const [agreed, setAgreed] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [signature, setSignature] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inst = INSTRUCTORS[instructor];
  const tier = effectiveLessonTier(swimmerInfo.swimmerAge, swimmerInfo.lessonTier ?? "auto");
  const pricing =
    instructor === "estee" ? getEsteePricingForTier(tier) : getLukaahPricingForTier(tier);

  let totalLessons: number;
  let unitPrice: number;

  if (firstSch.type === "weekly") {
    totalLessons = 5;
    unitPrice = pricing.price;
  } else {
    const monthlyPrice = pricing.price;
    if (firstSch.secondDay && firstSch.secondDayTime) {
      totalLessons = 8;
      unitPrice = monthlyPrice * 2;
    } else {
      totalLessons = 4;
      unitPrice = monthlyPrice;
    }
  }

  const scheduleSummaryText =
    swimmers.length > 1
      ? swimmers.map((sw, i) => `${sw.swimmerName}: ${summarizeSchedule(schedules[i]!)}`).join("\n\n")
      : summarizeSchedule(firstSch);

  const price = unitPrice * swimmers.length;
  const multi = swimmers.length > 1;

  const signerName = swimmerInfo.parentName || swimmerInfo.swimmerName;
  const signatureValid = signature.trim().length >= 2;
  const canSign = hasScrolledToBottom && signatureValid;

  function handleScroll() {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setHasScrolledToBottom(true);
  }

  return (
    <div className="space-y-12">
      <div>
        <h3 className="font-display text-3xl font-medium tracking-tight text-[#1D1D1F] mb-8">Review details</h3>
        
        <div className="bg-[#F5F5F7] rounded-[2rem] border border-black/5 overflow-hidden">
          {/* Summary rows */}
          <div className="divide-y divide-black/5 p-8 space-y-4">
            <Row label="Instructor" value={inst.name} />
            {swimmers.map((s, i) => (
              <Row
                key={i}
                label={multi ? `Swimmer ${i + 1}` : "Swimmer"}
                value={`${s.swimmerName}, age ${s.swimmerAge}${
                  s.swimmerAge === 0 && typeof s.swimmerMonths === "number" ? ` (${s.swimmerMonths} months)` : ""
                }${s.notes ? ` — ${s.notes}` : ""}`}
              />
            ))}
            <Row label="Duration" value={`${pricing.duration} minutes (same for everyone on this booking)`} />
            <Row label={swimmers.length > 1 ? "Schedules" : "Schedule"} value={scheduleSummaryText} />
            <Row
              label="Lessons"
              value={
                multi
                  ? `${swimmers.length} × ${totalLessons} lessons each (${pricing.duration} min)`
                  : String(totalLessons)
              }
            />
            <Row label="Guardian" value={swimmerInfo.parentName || ""} />
            <Row label="Contact" value={`${swimmerInfo.parentEmail || ""} \n ${swimmerInfo.parentPhone || ""}`} />
          </div>

          {/* Price */}
          <div className="bg-[#1D1D1F] px-8 py-8 flex items-end justify-between">
            <span className="font-ui text-xs font-semibold uppercase tracking-widest text-white/70">Total Due</span>
            <span className="font-display text-5xl font-medium tracking-tighter text-white">{formatPrice(price)}</span>
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className={`rounded-2xl p-6 border transition-all ${policyAgreed ? 'bg-green-50/50 border-green-200' : 'bg-[#1D1D1F]/5 border-black/5'}`}>
        <h4 className="font-display text-lg tracking-tight text-[#1D1D1F] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1D1D1F]"></span> Important Policies
        </h4>
        <ul className="list-disc list-inside text-sm text-[#1D1D1F]/80 space-y-2 font-body marker:text-black/30 mb-6">
          <li><strong>Cancellations:</strong> Full cancellations require a minimum of 7 days advance notice for a refund.</li>
          <li><strong>Missed Lessons:</strong> Notify us at least 24 hours in advance if you need to miss a lesson. We'll see what we can do, but makeup sessions are not guaranteed.</li>
          <li><strong>No-shows:</strong> No refunds or makeups for no-shows or late cancellations.</li>
          <li><strong>Parking:</strong> You must park on the south side of 1300 N. Do not block neighbors.</li>
          <li><strong>Stripe:</strong> Online checkout accepts cards and Apple Pay; a small processing fee (~3.5%) is included at checkout. In person you can also use Apple Pay or a card with us.</li>
        </ul>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={policyAgreed}
            onChange={(e) => setPolicyAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-2 border-black/20 accent-[#1D1D1F] cursor-pointer"
          />
          <span className={`text-sm font-ui leading-relaxed ${policyAgreed ? 'text-green-800 font-medium' : 'text-[#1D1D1F]'}`}>
            I have read and agree to the cancellation and missed lesson policies listed above.
          </span>
        </label>
      </div>

      {/* Waiver */}
      <div className="space-y-4 pt-4 border-t border-black/5">
        <h4 className="font-display text-xl tracking-tight text-[#1D1D1F]">Legal Waiver & Release of Liability</h4>
        <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${agreed ? "bg-green-50/50 border-green-200" : "bg-[#F5F5F7] border-black/5"}`}>
          <p className={`text-sm mb-5 leading-relaxed ${agreed ? "text-green-800" : "text-[#86868B]"}`}>
            {agreed ? `Waiver signed by "${signature}" on ${format(new Date(), "MMMM d, yyyy")}.` : "You must read, sign, and agree to our liability waiver before completing your booking."}
          </p>
          <Button 
            variant={agreed ? "outline" : undefined} 
            onClick={() => setShowWaiver(true)}
            className={`rounded-full px-8 ${!agreed ? "bg-[#1D1D1F] hover:bg-black text-white" : "border-green-300 text-green-700 hover:bg-green-50"}`}
          >
            {agreed ? "Review Waiver" : "Read & Sign Waiver"}
          </Button>
          {agreed && (
            <div className="flex items-center gap-2 mt-4 text-green-600 font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Waiver Signed & Agreed</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment info */}
      <div className="px-2 pt-6">
        <h4 className="font-display text-xl tracking-tight text-[#1D1D1F] mb-3">Complete booking</h4>
        <p className="text-[#86868B] font-light leading-relaxed text-sm mb-4">{PAYMENT_OPTIONS_COPY.booking}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/5 pt-8">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="order-2 sm:order-1 rounded-full py-6 px-8">
          Back
        </Button>
        <div className="flex-1 order-1 sm:order-2 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onConfirm("venmo")}
            disabled={loading || !agreed || !policyAgreed}
            className="flex-1 rounded-full border-2 border-[#062f3d] bg-[#0a4a5c] py-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0c5a70] disabled:opacity-45"
            size="lg"
          >
            Pay later (Venmo / cash)
          </Button>
          <Button
            onClick={() => onConfirm("stripe")}
            disabled={loading || !agreed || !policyAgreed}
            loading={loading}
            className="flex-1 rounded-full border-2 border-[#4f46e5] bg-[#635BFF] py-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#5646e0] disabled:opacity-45"
            size="lg"
          >
            Pay with Stripe (card / Apple Pay)
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showWaiver && (
          <motion.div 
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowWaiver(false); }}
          >
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl flex flex-col shadow-2xl"
              style={{ maxHeight: '85vh', height: '85vh' }}
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-black/5 flex items-center justify-between bg-[#F5F5F7] shrink-0 rounded-t-[2rem]">
                <h3 className="font-display text-2xl font-bold text-[#1D1D1F]">Liability Waiver</h3>
                <button onClick={() => setShowWaiver(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-[#1D1D1F] transition-colors">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              
              {/* Scrollable waiver body - FIXED: explicit height forces overflow */}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 overflow-y-scroll bg-white px-6 sm:px-8 py-6"
              >
                <div className="text-[#1D1D1F]/80 leading-relaxed font-body text-sm whitespace-pre-wrap select-text">
                  {WAIVER_TEXT}
                </div>

                {!hasScrolledToBottom && (
                  <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-8 pb-2 text-center">
                    <p className="text-xs text-[#86868B] font-ui animate-bounce">↓ Scroll down to read the full waiver ↓</p>
                  </div>
                )}
              </div>

              {/* Signature + Agree section */}
              <div className="p-6 sm:p-8 border-t border-black/5 bg-[#F5F5F7] shrink-0 rounded-b-[2rem] space-y-5">
                {/* Signature input */}
                <div>
                  <label className="block font-ui text-xs uppercase tracking-[0.2em] font-semibold text-[#86868B] mb-2">
                    Type your full name to sign
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={signerName}
                    className="w-full px-5 py-4 rounded-xl border border-black/10 bg-white text-[#1D1D1F] font-body text-lg focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/30 focus:border-[#1D1D1F] italic placeholder:text-[#86868B]/40 placeholder:not-italic"
                  />
                  {signature && (
                    <p className="mt-2 text-xs text-[#86868B] font-ui">
                      Signing as: <span className="italic font-medium text-[#1D1D1F]">&ldquo;{signature}&rdquo;</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setShowWaiver(false)}
                    className="flex-1 rounded-full py-5 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setAgreed(true);
                      setShowWaiver(false);
                    }}
                    disabled={!canSign}
                    className={`flex-1 rounded-full border-2 py-5 text-base font-semibold shadow-sm transition-all ${
                      canSign
                        ? "border-[#062f3d] bg-[#0a4a5c] text-white hover:bg-[#0c5a70]"
                        : "cursor-not-allowed border-[#cbd5e1] bg-[#e2e8f0] text-[#64748b]"
                    }`}
                  >
                    {!hasScrolledToBottom 
                      ? "Read full waiver first" 
                      : !signatureValid 
                        ? "Enter your name to sign" 
                        : "I Agree & Sign"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 pt-4 first:pt-0">
      <span className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B] w-40 flex-shrink-0 pt-1">{label}</span>
      <span className="font-ui text-[#1D1D1F] whitespace-pre-line leading-relaxed">{value}</span>
    </div>
  );
}

