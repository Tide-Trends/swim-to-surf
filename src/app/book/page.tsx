import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE } from "@/lib/constants";
import { PageHero } from "@/components/page-hero";
import { BookingWizard } from "./booking-wizard";

export const metadata: Metadata = {
  title: "Book Lessons",
  description: "Book your private swimming lessons with Swim to Surf. Choose your instructor, pick a time, and you're set.",
};

const bookJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
    { "@type": "ListItem", position: 2, name: "Book Lessons", item: `${SITE.url}/book` },
  ],
};

export default function BookPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <PageHero
        eyebrow="Book"
        title="Book private swim lessons."
        description="Choose your instructor, pick a schedule, and confirm in minutes. Every booking is one-on-one."
      />
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <p className="font-ui text-muted">Loading...</p>
          </div>
        }
      >
        <BookingWizard />
      </Suspense>
    </>
  );
}
