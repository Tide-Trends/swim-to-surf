import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/animate";
import { SITE, PAYMENT_OPTIONS_COPY } from "@/lib/constants";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Swim to Surf. Questions about lessons, scheduling, or anything else — we'd love to hear from you.",
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE.url}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you."
        description="Questions about lessons, scheduling, or special needs — reach out anytime."
      />

      <section className="section-pad !pt-10">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <FadeIn className="lg:col-span-4">
            <div className="sticky top-28 space-y-6 rounded-2xl border border-navy/8 bg-white p-6 shadow-soft md:p-7">
              {[
                { label: "Location", value: SITE.location },
                { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
                { label: "Phone", value: SITE.phone, href: `tel:${SITE.phone.replace(/-/g, "")}` },
              ].map((item) => (
                <div key={item.label} className="border-b border-navy/6 pb-5 last:border-0 last:pb-0">
                  <p className="eyebrow mb-2">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-lg font-medium text-navy transition-colors hover:text-water">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-lg font-medium text-navy">{item.value}</p>
                  )}
                </div>
              ))}
              <div>
                <p className="eyebrow mb-2">Payment</p>
                <p className="text-sm leading-relaxed text-muted">
                  {PAYMENT_OPTIONS_COPY.short}{" "}
                  <a
                    href="https://venmo.com/u/swimtosurf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-water underline"
                  >
                    Venmo
                  </a>
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:col-span-8">
            <div className="surface-card p-7 md:p-10">
              <h2 className="mb-2 text-2xl text-navy">Send a message</h2>
              <p className="mb-8 text-sm text-muted md:text-base">
                We usually reply within one business day.
              </p>
              <ContactForm />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
