import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/animate";
import { PAYMENT_OPTIONS_COPY } from "@/lib/constants";
import { FaqAccordion } from "./faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Swim to Surf private swimming lessons — scheduling, ages, locations, payment, and more.",
};

const faqs = [
  {
    question: "How many sessions should I sign up for?",
    answer:
      "Every swimmer learns at their own pace. After even one session, many families notice a real shift in confidence and comfort in the water — and instructors look for visible skill gains every time you show up. For the strongest, lasting progress, we recommend a minimum of about three sessions (how many individual lessons that is depends on whether you book a week with Lukaah or a month with Estee). Depending on your child, your instructor can advise whether stacking sessions back-to-back or spacing them out will work best.",
  },
  {
    question: "Do you offer group lessons?",
    answer: "We do not offer group lessons for beginner or intermediate swimmers. Years of experience have shown us that one-on-one instruction is far more effective for building real skills and confidence. We do offer swim-team preparation classes for proficient swimmers looking to refine technique and endurance — those are capped at 4 swimmers per session.",
  },
  {
    question: "Do you work with children who have special needs?",
    answer: "Absolutely. We've worked with many children with sensory disorders, autism, and other needs. If this applies to your swimmer, please reach out before booking so we can learn more and tailor our approach to best support them.",
  },
  {
    question: "Where are lessons taught?",
    answer: "Lessons are currently held in American Fork, Utah — you'll receive the exact address once you book. We currently do not offer lessons in Hawaii.",
  },
  {
    question: "What ages do you teach?",
    answer: "We start with newborns and have no upper age limit. Whether you're booking for an infant, a teenager, or yourself as an adult, we welcome you.",
  },
  {
    question: "How do I pay?",
    answer: `${PAYMENT_OPTIONS_COPY.short} Payment is due on the first day of your session unless you prepaid online with Stripe. A $15 late fee applies for each day that payment is overdue.`,
  },
  {
    question: "What is your cancellation and missed lesson policy?",
    answer: "Full cancellations require a minimum of 7 days advance notice for a refund. If you need to miss an individual lesson, please give us at least 24 hours notice and we'll do our best to work something out — however, makeup sessions are not guaranteed. No-shows or late cancellations will not be refunded or rescheduled.",
  },
  {
    question: "How does booking with Lukaah work?",
    answer: "Lukaah teaches Monday through Friday, 8:00 AM – 11:30 AM. You'll choose a week and a single time slot — that same time repeats every day for the entire five-day week. Infants (0-2) have 15-minute lessons; everyone else has 30-minute lessons.",
  },
  {
    question: "How does booking with Estee work?",
    answer: "Estee teaches Wednesdays (8:00 AM – 11:30 AM) and Thursdays (12:30 PM – 4:00 PM). You'll pick a day, choose a time slot, and that lesson repeats every week for the month — four lessons total. You can also add a second day each week for double the sessions.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-32 pt-24 font-body">
      <section className="bg-white text-[#1D1D1F] pt-24 pb-24 border-b border-black/5">
        <div className="mx-auto max-w-4xl px-6 md:px-8 text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em]">
                FAQ
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight mb-6">
              Questions? We&rsquo;ve got answers.
            </h1>
            <p className="text-xl text-[#86868B] font-light max-w-2xl mx-auto">
              Everything you need to know about scheduling, lessons, and policies.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pt-16 md:pt-24">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <FadeIn delay={0.1}>
            <div className="bg-white p-6 md:p-12 rounded-[2rem] border border-black/5 shadow-sm">
              <FaqAccordion faqs={faqs} />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
