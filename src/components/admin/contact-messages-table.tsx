"use client";

import { format } from "date-fns";
import type { ContactMessage } from "@/lib/database.types";

interface Props {
  messages: ContactMessage[];
}

export function ContactMessagesTable({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-sand p-12 text-center">
        <p className="text-muted font-ui">No contact messages yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-sand overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-ui text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold text-dark">Date</th>
              <th className="px-4 py-3 font-semibold text-dark">From</th>
              <th className="px-4 py-3 font-semibold text-dark">Contact</th>
              <th className="px-4 py-3 font-semibold text-dark min-w-[240px]">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {messages.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-4 py-3 font-medium text-dark">{m.name}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${m.email}`} className="text-primary hover:underline break-all">
                    {m.email}
                  </a>
                  {m.phone ? (
                    <div className="text-xs text-muted mt-1">
                      <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="hover:underline">
                        {m.phone}
                      </a>
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-dark whitespace-pre-wrap break-words max-w-xl">
                  {m.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
