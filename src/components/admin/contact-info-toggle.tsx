"use client";

import { useState } from "react";
import type { Booking } from "@/lib/database.types";
import { formatPhoneDisplay } from "@/lib/admin-schedule-expand";

export function ContactInfoToggle({
  booking,
  compact = false,
}: {
  booking: Booking;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const phone = formatPhoneDisplay(booking.parent_phone);
  const tel = booking.parent_phone.replace(/[^\d+]/g, "");

  return (
    <div className={compact ? "mt-2" : "mt-2"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer rounded-md border border-navy/15 bg-sand/50 px-2.5 py-1 font-ui font-semibold text-deep hover:bg-sand ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {open ? "Hide contact" : "Contact info"}
      </button>
      {open && (
        <div
          className={`mt-2 rounded-lg border border-navy/12 bg-sand/30 ${
            compact ? "p-3 text-sm" : "p-3.5 text-sm"
          }`}
        >
          <p className="font-semibold text-navy">{booking.parent_name}</p>
          <p className="mt-1.5">
            <a href={`tel:${tel}`} className="font-medium text-deep underline-offset-2 hover:underline">
              {phone}
            </a>
          </p>
          <p className="mt-1">
            <a
              href={`mailto:${booking.parent_email}`}
              className="font-medium text-deep underline-offset-2 hover:underline break-all"
            >
              {booking.parent_email}
            </a>
          </p>
          {booking.notes && (
            <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-2 text-sm text-amber-950">{booking.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
