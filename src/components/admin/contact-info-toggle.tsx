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
    <div className={compact ? "mt-1" : "mt-2"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer font-ui text-primary hover:underline ${compact ? "text-[10px]" : "text-[11px] font-medium"}`}
      >
        {open ? "Hide contact info" : "Click for contact info"}
      </button>
      {open && (
        <div
          className={`mt-1.5 rounded-md border border-black/10 bg-white/80 ${compact ? "p-2 text-[10px]" : "p-2.5 text-xs"} leading-relaxed`}
        >
          <div className="font-medium text-dark">{booking.parent_name}</div>
          <div className="mt-0.5">
            <a href={`tel:${tel}`} className="text-primary hover:underline">
              {phone}
            </a>
          </div>
          <div className="mt-0.5">
            <a href={`mailto:${booking.parent_email}`} className="text-primary hover:underline break-all">
              {booking.parent_email}
            </a>
          </div>
          {booking.notes && (
            <p className="mt-1.5 text-amber-900/80 leading-snug" title={booking.notes}>
              {booking.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
