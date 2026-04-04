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
    default: "Swim to Surf | Private Swimming Lessons in American Fork",
    template: "%s | Swim to Surf",
  },
  description:
    "Private one-on-one swimming lessons for all ages. Safety-first instruction from newborns to adults. Book your lessons in American Fork, Utah.",
  keywords: [
    "swimming lessons",
    "private swim lessons",
    "American Fork Utah",
    "kids swim lessons",
    "infant swim lessons",
    "adult swim lessons",
    "water safety",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
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
