import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { canSelfServeManageBooking } from "@/lib/booking-first-lesson";
import { ManageBookingClient } from "./client";

export const metadata: Metadata = {
  title: "Manage Booking | Swim to Surf",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ManageBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length !== 36) {
    notFound();
  }

  try {
    const adminSupabase = getSupabaseServerClient();

    if (!adminSupabase) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 px-4 text-center">
          <p className="text-red-500 font-ui max-w-md">
            Server misconfigured: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
            so this page can load your booking.
          </p>
        </div>
      );
    }

    const { data: booking, error } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      console.error("Manage page db error:", error);
      notFound();
    }

    const canSelfServe = canSelfServeManageBooking(booking);

    return (
      <div className="min-h-screen bg-warm-white pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <ManageBookingClient booking={booking} canSelfServe={canSelfServe} />
        </div>
      </div>
    );
  } catch (err) {
    console.error("Manage page unexpected error:", err);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-warm-white">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5 text-center">
          <h1 className="text-xl font-display font-medium mb-2">Something went wrong</h1>
          <p className="text-[#86868B] font-ui text-sm mb-4">We encountered an error loading your booking.</p>
          <p className="text-[#EF476F] font-ui text-xs">{String(err)}</p>
        </div>
      </div>
    );
  }
}

