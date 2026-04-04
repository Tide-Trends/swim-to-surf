"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Booking } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { BookingTable } from "@/components/admin/booking-table";
import { ScheduleView } from "@/components/admin/schedule-view";
import { InstructorProfilesEditor } from "@/components/admin/instructor-profiles-editor";
import { clearAdminSession, getAdminSession, type InstructorSlug } from "@/lib/instructor-content";

type Tab = "bookings" | "schedule" | "instructors";

export default function AdminPage() {
  const router = useRouter();
  const [authedUser, setAuthedUser] = useState<InstructorSlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "lukaah" | "estee">("all");

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setAuthedUser(session);
    setLoading(false);
  }, [router]);

  const fetchBookings = useCallback(async () => {
    let url = "/api/admin/bookings";
    if (filter !== "all") {
      url += `?instructor=${filter}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBookings((data as Booking[]) || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [filter]);

  useEffect(() => {
    if (authedUser) fetchBookings();
  }, [authedUser, fetchBookings]);

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking? The parent will be notified.")) return;
    
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) throw new Error("Failed to cancel");
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel booking.");
    }
  }

  async function handleLogout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="font-ui text-muted">Loading...</p>
      </div>
    );
  }

  if (!authedUser) return null;

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    if (b.week_start) {
      const ws = new Date(b.week_start);
      const we = new Date(ws);
      we.setDate(we.getDate() + 4);
      const t = new Date(today);
      return t >= ws && t <= we;
    }
    return true;
  });

  return (
    <section className="bg-warm-white min-h-[80vh] pt-28 pb-12">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#1D1D1F]">Dashboard</h1>
            <p className="text-[#86868B] font-ui text-sm mt-1">
              Signed in as {authedUser === "lukaah" ? "Lukaah" : "Estee"} · {bookings.filter((b) => b.status === "confirmed").length} active bookings
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-8 w-fit">
          {(["bookings", "schedule", "instructors"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md font-ui text-sm font-medium transition-colors capitalize cursor-pointer ${
                tab === t ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filter */}
        {tab === "bookings" && (
          <div className="flex gap-2 mb-6">
            {(["all", "lukaah", "estee"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full font-ui text-sm transition-colors capitalize cursor-pointer ${
                  filter === f ? "bg-primary text-white" : "bg-secondary text-muted hover:text-dark"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        )}

        {tab === "bookings" && <BookingTable bookings={bookings} onCancel={cancelBooking} />}
        {tab === "schedule" && <ScheduleView bookings={todayBookings} />}
        {tab === "instructors" && <InstructorProfilesEditor editor={authedUser} />}
      </div>
    </section>
  );
}
