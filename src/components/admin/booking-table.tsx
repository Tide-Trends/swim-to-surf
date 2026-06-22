"use client";

import { format } from "date-fns";
import type { Booking } from "@/lib/database.types";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ContactInfoToggle } from "@/components/admin/contact-info-toggle";

interface Props {
  bookings: Booking[];
  onCancel: (id: string) => void;
  onReschedule?: (booking: Booking) => void;
}

export function BookingTable({ bookings, onCancel, onReschedule }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="admin-panel p-12 text-center">
        <p className="font-ui text-body">No bookings found.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left font-ui">
          <thead className="border-b border-navy/10 bg-navy text-white">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Swimmer</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">When</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Instructor</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Price</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr
                key={b.id}
                className={`border-b border-navy/8 ${b.status === "cancelled" ? "opacity-50" : ""} ${
                  i % 2 === 0 ? "bg-white" : "bg-[#f8fafb]"
                }`}
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-navy">{b.swimmer_name}</div>
                  <div className="mt-0.5 text-sm text-body">
                    Age {b.swimmer_age} · {b.lesson_duration} min · {b.total_lessons} lessons
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-body">
                  {b.week_start ? (
                    <span>Week of {format(new Date(b.week_start + "T12:00:00"), "MMM d, yyyy")}</span>
                  ) : (
                    <span>{b.month}</span>
                  )}
                  <div className="mt-1 font-medium text-navy">
                    {b.lesson_time.slice(0, 5)}
                    {b.second_day_time && <span className="text-body"> + {b.second_day_time.slice(0, 5)}</span>}
                  </div>
                </td>
                <td className="px-5 py-4 capitalize text-sm font-medium text-navy">{b.instructor}</td>
                <td className="px-5 py-4 font-semibold text-navy">{formatPrice(b.price)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                      b.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <ContactInfoToggle booking={b} />
                  {b.status === "confirmed" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {onReschedule && (
                        <Button size="sm" variant="outline" onClick={() => onReschedule(b)}>
                          Reschedule
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-error hover:bg-red-50" onClick={() => onCancel(b.id)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
