import { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase";
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

  const supabase = createServerSupabase(); // This falls back to anon key for server, wait!
  // We need to use service role key here to bypass RLS, because otherwise the user isn't logged in.
  
  // Create a direct client with service_role to bypass RLS since the UUID is the secure token
  const { createClient } = await import("@supabase/supabase-js");
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: booking, error } = await adminSupabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-warm-white pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <ManageBookingClient booking={booking} />
      </div>
    </div>
  );
}
