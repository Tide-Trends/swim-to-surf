import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollToTop } from "@/components/scroll-to-top";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
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
    "Private one-on-one swimming lessons for all ages in American Fork, Utah. Safety-first instruction from infant swim survival to adult technique. Book your lessons today.",
  keywords: [
    "swimming lessons American Fork",
    "private swim lessons Utah",
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
  metadataBase: new URL("https://swimtosurf.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Swim to Surf | Private Swimming Lessons in American Fork, Utah",
    description: "Private one-on-one swimming lessons for all ages. Safety-first instruction from infants to adults. Book today!",
    url: "https://swimtosurf.com",
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

// JSON-LD structured data for local business SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Swim to Surf",
  description: "Private one-on-one swimming lessons for all ages in American Fork, Utah.",
  url: "https://swimtosurf.com",
  telephone: "385-499-8036",
  email: "swimtosurfemail@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "American Fork",
    addressRegion: "UT",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 40.3769,
    longitude: -111.7957,
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col bg-warm-white selection:bg-accent selection:text-white">
        <SmoothScroll>
          <ScrollToTop />
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
