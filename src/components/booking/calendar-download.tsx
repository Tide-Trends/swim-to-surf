"use client";

import { useCallback } from "react";
import type { ScheduleSelection } from "@/lib/booking-schema";
import { generateIcsContent, generateGoogleCalendarUrl } from "@/lib/calendar";
import { INSTRUCTORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface Props {
  instructor: "lukaah" | "estee";
  swimmerName: string;
  schedule: ScheduleSelection;
  duration: number;
}

export function CalendarDownload({ instructor, swimmerName, schedule, duration }: Props) {
  const instName = INSTRUCTORS[instructor].name;

  const downloadIcs = useCallback(() => {
    try {
      const content = generateIcsContent(schedule, swimmerName, instName, duration);
      const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `swim-to-surf-${swimmerName.toLowerCase().replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [schedule, swimmerName, instName, duration]);

  const googleUrl = generateGoogleCalendarUrl(schedule, swimmerName, instName, duration);

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 p-8 md:p-10 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <h3 className="font-display text-2xl font-bold text-[#1D1D1F] mb-3">Add to your calendar</h3>
        <p className="text-sm text-[#86868B] font-body max-w-sm leading-relaxed mb-6">
          Download the calendar file or add directly to Google Calendar to keep your lessons organized.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            onClick={downloadIcs}
            className="flex-1 gap-2 rounded-full border-2 border-[#062f3d] bg-[#0a4a5c] py-5 text-base font-semibold text-white shadow-md hover:bg-[#0c5a70] sm:py-6"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Download .ics (Apple / Outlook)
          </Button>
          {googleUrl && (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                variant="outline"
                className="w-full gap-2 rounded-full border-2 border-[#1D1D1F] py-5 text-base font-semibold text-[#0f172a] hover:bg-[#f1f5f9] sm:py-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Google Calendar
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
