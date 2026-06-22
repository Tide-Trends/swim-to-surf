import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, DM_Sans } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollToTop } from "@/components/scroll-to-top";
import { BookingModalProvider } from "@/components/booking/booking-modal-provider";
import { SITE } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Swim to Surf | Private Swimming Lessons in American Fork, Utah",
    template: "%s | Swim to Surf",
  },
  description:
    "Private one-on-one swimming lessons for all ages in American Fork, Utah County, and nearby cities. Safety-first instruction from infant swim survival to adult technique.",
  keywords: [
    "swimming lessons American Fork",
    "swim lessons American Fork",
    "swim lessons Utah County",
    "private swim lessons Utah",
    "swim lessons Lehi",
    "swim lessons Pleasant Grove",
    "swim lessons Lindon",
    "swim lessons Highland Utah",
    "swim lessons Alpine Utah",
    "swim lessons Orem",
    "swim lessons Provo",
    "swim lessons Saratoga Springs Utah",
    "kids swim lessons American Fork",
    "infant swim lessons Utah",
    "baby swim lessons",
    "adult swim lessons American Fork",
    "water safety classes",
    "learn to swim Utah",
    "swimming instructor American Fork",
    "private swimming teacher",
    "swim lessons near me",
    "toddler swim lessons",
    "swim to surf",
  ],
  metadataBase: new URL(SITE.url),
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Swim to Surf | Private Swimming Lessons in American Fork, Utah",
    description: "Private one-on-one swimming lessons for all ages. Safety-first instruction from infants to adults. Book today!",
    url: SITE.url,
    siteName: "Swim to Surf",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swim to Surf | Private Swimming Lessons",
    description: "Private one-on-one swimming lessons in American Fork, Utah. All ages welcome.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  other: {
    "geo.region": "US-UT",
    "geo.placename": "American Fork",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      email: SITE.email,
      telephone: SITE.phone,
      logo: `${SITE.url}/icon.png`,
      sameAs: ["https://venmo.com/u/swimtosurf"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: {
        "@id": `${SITE.url}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/faq?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE.url}/#localbusiness`,
      name: SITE.name,
      description: "Private one-on-one swimming lessons for all ages in American Fork, Utah.",
      url: SITE.url,
      telephone: SITE.phone,
      email: SITE.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: "American Fork",
        addressRegion: "UT",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "AdministrativeArea", name: "Utah County" },
        { "@type": "City", name: "American Fork" },
        { "@type": "City", name: "Lehi" },
        { "@type": "City", name: "Pleasant Grove" },
        { "@type": "City", name: "Lindon" },
        { "@type": "City", name: "Highland" },
        { "@type": "City", name: "Alpine" },
        { "@type": "City", name: "Cedar Hills" },
        { "@type": "City", name: "Saratoga Springs" },
        { "@type": "City", name: "Orem" },
        { "@type": "City", name: "Provo" },
      ],
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.3769,
        longitude: -111.7957,
      },
      parentOrganization: {
        "@id": `${SITE.url}/#organization`,
      },
      priceRange: "$60-$150",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: "6",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Swimming Lessons",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Weekly Intensive (5 lessons, Mon-Fri)" },
            price: "150.00",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Monthly Subscription (4 lessons/month)" },
            price: "120.00",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Infant Lessons (15 min)" },
            price: "60.00",
            priceCurrency: "USD",
          },
        ],
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col bg-cream text-navy antialiased">
        <SmoothScroll>
          <ScrollToTop />
          <Suspense fallback={null}>
            <BookingModalProvider>
              <Nav />
              <main className="flex-1">{children}</main>
              <Footer />
            </BookingModalProvider>
          </Suspense>
        </SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
