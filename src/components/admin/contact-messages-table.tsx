"use client";

import { format } from "date-fns";
import type { ContactMessage } from "@/lib/database.types";

interface Props {
  messages: ContactMessage[];
}

export function ContactMessagesTable({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="admin-panel p-12 text-center">
        <p className="font-ui text-body">No contact messages yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left font-ui">
          <thead className="border-b border-navy/10 bg-navy text-white">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Date</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">From</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Contact</th>
              <th className="min-w-[280px] px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Message</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m, i) => (
              <tr key={m.id} className={`border-b border-navy/8 align-top ${i % 2 === 0 ? "bg-white" : "bg-[#f8fafb]"}`}>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-body">
                  {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-5 py-4 font-semibold text-navy">{m.name}</td>
                <td className="px-5 py-4 text-sm">
                  <a href={`mailto:${m.email}`} className="font-medium text-deep underline-offset-2 hover:underline break-all">
                    {m.email}
                  </a>
                  {m.phone ? (
                    <div className="mt-1 text-body">
                      <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="hover:underline">
                        {m.phone}
                      </a>
                    </div>
                  ) : null}
                </td>
                <td className="max-w-xl whitespace-pre-wrap break-words px-5 py-4 text-sm text-body">{m.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
