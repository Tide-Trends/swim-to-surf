"use client";

import { format } from "date-fns";
import type { Booking } from "@/lib/database.types";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface Props {
  bookings: Booking[];
  onCancel: (id: string) => void;
}

export function BookingTable({ bookings, onCancel }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-sand p-12 text-center">
        <p className="text-muted font-ui">No bookings found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-sand overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-ui text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold text-dark">Swimmer</th>
              <th className="px-4 py-3 font-semibold text-dark">Instructor</th>
              <th className="px-4 py-3 font-semibold text-dark">Schedule</th>
              <th className="px-4 py-3 font-semibold text-dark">Time</th>
              <th className="px-4 py-3 font-semibold text-dark">Lessons</th>
              <th className="px-4 py-3 font-semibold text-dark">Price</th>
              <th className="px-4 py-3 font-semibold text-dark">Status</th>
              <th className="px-4 py-3 font-semibold text-dark">Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {bookings.map((b) => (
              <tr key={b.id} className={b.status === "cancelled" ? "opacity-50" : ""}>
                <td className="px-4 py-3">
                  <div className="font-medium text-dark">{b.swimmer_name}</div>
                  <div className="text-xs text-muted">Age {b.swimmer_age} &middot; {b.lesson_duration} min</div>
                </td>
                <td className="px-4 py-3 capitalize">{b.instructor}</td>
                <td className="px-4 py-3">
                  {b.week_start ? (
                    <span>Week of {format(new Date(b.week_start + "T12:00:00"), "MMM d")}</span>
                  ) : (
                    <span>{b.month}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.lesson_time.slice(0, 5)}
                  {b.second_day_time && <span className="text-muted"> + {b.second_day_time.slice(0, 5)}</span>}
                </td>
                <td className="px-4 py-3">{b.total_lessons}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(b.price)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      b.status === "confirmed"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs">
                    <div>{b.parent_name}</div>
                    <a href={`mailto:${b.parent_email}`} className="text-primary hover:underline">
                      {b.parent_email}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="ghost" onClick={() => onCancel(b.id)}>
                      Cancel
                    </Button>
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
