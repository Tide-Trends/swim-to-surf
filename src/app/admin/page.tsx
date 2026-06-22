"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Booking, ContactMessage } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { BookingTable } from "@/components/admin/booking-table";
import { ScheduleView } from "@/components/admin/schedule-view";
import { InstructorProfilesEditor } from "@/components/admin/instructor-profiles-editor";
import { ContactMessagesTable } from "@/components/admin/contact-messages-table";
import { AdminRescheduleModal } from "@/components/admin/admin-reschedule-modal";
import { clearAdminSession, getAdminSession, type InstructorSlug } from "@/lib/instructor-content";

type Tab = "schedule" | "bookings" | "messages" | "profiles";

const TAB_LABELS: Record<Tab, string> = {
  schedule: "Schedule",
  bookings: "All bookings",
  messages: "Messages",
  profiles: "Profiles",
};

export default function AdminPage() {
  const router = useRouter();
  const [authedUser, setAuthedUser] = useState<InstructorSlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("schedule");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "lukaah" | "estee">("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);

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
    try {
      setFetchError(null);
      const res = await fetch("/api/admin/bookings", { cache: "no-store" });
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

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const today = format(new Date(), "yyyy-MM-dd");
    const todayCount = confirmed.filter((b) => {
      if (b.week_start?.startsWith(today)) return true;
      return false;
    }).length;
    return {
      active: confirmed.length,
      today: todayCount,
      messages: contactMessages.length,
    };
  }, [bookings, contactMessages.length]);

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

  async function refreshCurrentTab() {
    if (tab === "messages") {
      setMessagesRefreshing(true);
      await fetchContactMessages();
      setMessagesRefreshing(false);
    } else {
      setRefreshing(true);
      await fetchBookings();
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page flex min-h-[80vh] items-center justify-center">
        <p className="font-ui text-body">Loading…</p>
      </div>
    );
  }

  if (!authedUser) return null;

  const filteredBookings =
    filter === "all" ? bookings : bookings.filter((b) => b.instructor === filter);

  return (
    <section className="admin-page pt-28 pb-12">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy">Admin</h1>
            <p className="mt-1 font-ui text-sm text-body">
              Signed in as {authedUser === "lukaah" ? "Lukaah" : "Estee"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={refreshing || messagesRefreshing} onClick={() => void refreshCurrentTab()}>
              {refreshing || messagesRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="admin-stat">
            <p className="text-xs font-bold uppercase tracking-wide text-deep">Active bookings</p>
            <p className="mt-1 font-display text-3xl text-navy">{stats.active}</p>
          </div>
          <div className="admin-stat">
            <p className="text-xs font-bold uppercase tracking-wide text-deep">Messages</p>
            <p className="mt-1 font-display text-3xl text-navy">{stats.messages}</p>
          </div>
          <div className="admin-stat">
            <p className="text-xs font-bold uppercase tracking-wide text-deep">Today</p>
            <p className="mt-1 font-ui text-sm text-body">Open Schedule → Day view for today&apos;s lessons</p>
          </div>
        </div>

        <div className="admin-panel mb-6 flex flex-wrap gap-1 p-1.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`admin-tab cursor-pointer ${tab === t ? "admin-tab-active" : ""}`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "lukaah", "estee"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded-lg border px-4 py-2 font-ui text-sm font-semibold capitalize ${
                  filter === f
                    ? "border-navy bg-navy text-white"
                    : "border-navy/12 bg-white text-body hover:border-navy/25"
                }`}
              >
                {f === "all" ? "All instructors" : f}
              </button>
            ))}
          </div>
        )}

        {fetchError && tab === "bookings" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <strong className="font-semibold">Could not load bookings.</strong> {fetchError}
          </div>
        )}

        {messagesError && tab === "messages" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <strong className="font-semibold">Could not load messages.</strong> {messagesError}
          </div>
        )}

        {tab === "schedule" && <ScheduleView bookings={bookings} onReschedule={setRescheduleTarget} />}
        {tab === "bookings" && (
          <BookingTable bookings={filteredBookings} onCancel={cancelBooking} onReschedule={setRescheduleTarget} />
        )}
        {tab === "messages" && <ContactMessagesTable messages={contactMessages} />}
        {tab === "profiles" && <InstructorProfilesEditor editor={authedUser} />}
      </div>

      {rescheduleTarget && (
        <AdminRescheduleModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => void fetchBookings()}
        />
      )}
    </section>
  );
}
