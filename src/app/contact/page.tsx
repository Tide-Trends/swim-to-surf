import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/animate";
import { SITE } from "@/lib/constants";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Swim to Surf. Questions about lessons, scheduling, or anything else — we'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-32 pt-24 font-body">
      <section className="bg-[#1D1D1F] text-white pt-24 pb-32 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-ui text-xs font-semibold text-white/60 uppercase tracking-[0.2em]">
                Contact
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tighter max-w-3xl leading-[1.05]">
              We&rsquo;d love to <br/>
              <span className="text-white/60">hear from you.</span>
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="pt-16 md:pt-24">
        <div className="grid md:grid-cols-12 gap-12 lg:gap-16 max-w-6xl mx-auto px-6 md:px-8">
          
          <div className="md:col-span-5 lg:col-span-4">
            <FadeIn delay={0.1}>
              <div className="space-y-12 sticky top-32">
                <div>
                  <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-3 block">Location</span>
                  <p className="text-xl font-light text-[#1D1D1F]">{SITE.location}</p>
                </div>
                <div>
                  <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-3 block">Email</span>
                  <a href={`mailto:${SITE.email}`} className="text-xl font-light text-[#1D1D1F] hover:text-accent transition-colors block">
                    {SITE.email}
                  </a>
                </div>
                <div>
                  <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-3 block">Phone</span>
                  <a href={`tel:${SITE.phone.replace(/-/g, "")}`} className="text-xl font-light text-[#1D1D1F] hover:text-accent transition-colors block">
                    {SITE.phone}
                  </a>
                </div>
                <div>
                  <span className="font-ui text-xs font-semibold text-[#86868B] uppercase tracking-[0.2em] mb-3 block">Payment</span>
                  <p className="text-lg font-light text-[#1D1D1F] leading-relaxed">
                    We accept Venmo{" "}
                    <a
                      href="https://venmo.com/u/swimtosurf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-accent transition-colors underline"
                    >
                      (@swimtosurf)
                    </a>
                    , cash, or check.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
          
          <div className="md:col-span-7 lg:col-span-8">
            <FadeIn delay={0.2}>
              <div className="bg-white p-10 md:p-14 rounded-[2rem] border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-3xl font-display font-medium text-[#1D1D1F] tracking-tight mb-4">Send us a message</h2>
                <p className="text-[#86868B] font-light mb-10 text-lg">
                  Have a question about lessons, scheduling, or anything else? Fill out the form and we&rsquo;ll get back to you as soon as we can.
                </p>
                <ContactForm />
              </div>
            </FadeIn>
          </div>

        </div>
      </section>
    </div>
  );
}
