"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Booking, ContactMessage } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { BookingTable } from "@/components/admin/booking-table";
import { ScheduleView } from "@/components/admin/schedule-view";
import { InstructorProfilesEditor } from "@/components/admin/instructor-profiles-editor";
import { ContactMessagesTable } from "@/components/admin/contact-messages-table";
import { clearAdminSession, getAdminSession, type InstructorSlug } from "@/lib/instructor-content";

type Tab = "bookings" | "schedule" | "instructors" | "messages";

export default function AdminPage() {
  const router = useRouter();
  const [authedUser, setAuthedUser] = useState<InstructorSlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "lukaah" | "estee">("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);

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
    const url = "/api/admin/bookings";

    try {
      setFetchError(null);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof (errBody as { error?: string }).error === "string"
            ? (errBody as { error: string }).error
            : `Could not load bookings (${res.status}).`;
        throw new Error(msg);
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? (data as Booking[]) : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to load bookings.");
    }
  }, []);

  const fetchContactMessages = useCallback(async () => {
    try {
      setMessagesError(null);
      const res = await fetch("/api/admin/contact-messages", { cache: "no-store" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof (errBody as { error?: string }).error === "string"
            ? (errBody as { error: string }).error
            : `Could not load messages (${res.status}).`;
        throw new Error(msg);
      }
      const data = await res.json();
      setContactMessages(Array.isArray(data) ? (data as ContactMessage[]) : []);
    } catch (err) {
      console.error("Contact messages fetch error:", err);
      setMessagesError(err instanceof Error ? err.message : "Failed to load contact messages.");
    }
  }, []);

  useEffect(() => {
    if (authedUser) void fetchBookings();
  }, [authedUser, fetchBookings]);

  useEffect(() => {
    if (authedUser && tab === "messages") void fetchContactMessages();
  }, [authedUser, tab, fetchContactMessages]);

  useEffect(() => {
    if (!authedUser || tab !== "bookings") return;
    const t = window.setInterval(() => {
      void fetchBookings();
    }, 25000);
    return () => window.clearInterval(t);
  }, [authedUser, tab, fetchBookings]);

  useEffect(() => {
    if (!authedUser || tab !== "messages") return;
    const t = window.setInterval(() => {
      void fetchContactMessages();
    }, 25000);
    return () => window.clearInterval(t);
  }, [authedUser, tab, fetchContactMessages]);

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

  return (
    <section className="bg-warm-white min-h-[80vh] pt-28 pb-12">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#1D1D1F]">Dashboard</h1>
            <p className="text-[#86868B] font-ui text-sm mt-1">
              Signed in as {authedUser === "lukaah" ? "Lukaah" : "Estee"} ·{" "}
              {bookings.filter((b) => b.status === "confirmed").length} active bookings
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-8 w-fit flex-wrap">
          {(["bookings", "schedule", "instructors", "messages"] as Tab[]).map((t) => (
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
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "lukaah", "estee"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 font-ui text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? "border-primary bg-primary text-white"
                      : "border-black/10 bg-white text-dark hover:border-black/25 hover:bg-[#f8fafc]"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-2 border-[#1D1D1F] font-semibold"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                await fetchBookings();
                setRefreshing(false);
              }}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        )}

        {fetchError && tab === "bookings" && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <strong className="font-semibold">Could not sync bookings.</strong> {fetchError} Confirm{" "}
            <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on Vercel match your project.
          </div>
        )}

        {tab === "bookings" && (
          <BookingTable
            bookings={
              filter === "all" ? bookings : bookings.filter((b) => b.instructor === filter)
            }
            onCancel={cancelBooking}
          />
        )}
        {tab === "schedule" && <ScheduleView bookings={bookings} />}
        {tab === "instructors" && <InstructorProfilesEditor editor={authedUser} />}

        {tab === "messages" && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <p className="font-ui text-sm text-muted">
              {contactMessages.length} message{contactMessages.length === 1 ? "" : "s"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-2 border-[#1D1D1F] font-semibold"
              disabled={messagesRefreshing}
              onClick={async () => {
                setMessagesRefreshing(true);
                await fetchContactMessages();
                setMessagesRefreshing(false);
              }}
            >
              {messagesRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        )}

        {messagesError && tab === "messages" && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <strong className="font-semibold">Could not load messages.</strong> {messagesError} If you just added
            the table, run <code className="rounded bg-red-100 px-1">005_contact_messages.sql</code> in the Supabase
            SQL editor.
          </div>
        )}

        {tab === "messages" && <ContactMessagesTable messages={contactMessages} />}
      </div>
    </section>
  );
}
