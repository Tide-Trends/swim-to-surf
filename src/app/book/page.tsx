import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "./booking-wizard";

export const metadata: Metadata = {
  title: "Book Lessons",
  description: "Book your private swimming lessons with Swim to Surf. Choose your instructor, pick a time, and you're set.",
};

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="font-ui text-muted">Loading...</p>
        </div>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}
