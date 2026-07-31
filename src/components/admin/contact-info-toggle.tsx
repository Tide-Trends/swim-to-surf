"use client";

import { useState } from "react";
import type { Booking } from "@/lib/database.types";
import { formatPhoneDisplay } from "@/lib/admin-schedule-expand";

/** Shared styles for admin lesson action chips (Contact / Reschedule / Cancel). */
export function adminActionBtnClass(compact = false, tone: "default" | "danger" = "default") {
  const size = compact ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5";
  if (tone === "danger") {
    return `cursor-pointer rounded-md border border-red-200 bg-white font-ui font-semibold text-red-700 hover:bg-red-50 ${size}`;
  }
  return `cursor-pointer rounded-md border border-navy/15 bg-white font-ui font-semibold text-deep hover:bg-sand ${size}`;
}

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
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={adminActionBtnClass(compact)}
        aria-expanded={open}
      >
        {open ? "Hide contact" : "Contact info"}
      </button>
      {open && (
        <div
          className={`basis-full w-full min-w-0 rounded-lg border border-navy/12 bg-sand/30 ${
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
    </>
  );
}
