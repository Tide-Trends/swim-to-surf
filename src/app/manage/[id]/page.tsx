import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <p className="text-red-500 font-ui">Server misconfigured: Missing database keys.</p>
        </div>
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    const { data: booking, error } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      console.error("Manage page db error:", error);
      notFound();
    }

    return (
      <div className="min-h-screen bg-warm-white pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <ManageBookingClient booking={booking} />
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

