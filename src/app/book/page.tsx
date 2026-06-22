import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Lessons",
  description: "Book your private swimming lessons with Swim to Surf. Choose your instructor, pick a time, and you're set.",
};

/** Route kept for SEO, Stripe returns, and direct links — UI opens in the site overlay via BookingModalProvider. */
export default function BookPage() {
  return null;
}
