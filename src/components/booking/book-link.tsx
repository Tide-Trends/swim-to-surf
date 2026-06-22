"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useBookingModal } from "@/components/booking/booking-modal-provider";

type Instructor = "lukaah" | "estee";

type BookLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  instructor?: Instructor;
  href?: string;
};

function parseInstructor(href?: string, instructor?: Instructor): Instructor | undefined {
  if (instructor) return instructor;
  if (!href) return undefined;
  const match = href.match(/instructor=(lukaah|estee)/);
  return match?.[1] as Instructor | undefined;
}

export function BookLink({ instructor, href = "/book", onClick, children, ...props }: BookLinkProps) {
  const { openBooking } = useBookingModal();
  const resolvedInstructor = parseInstructor(typeof href === "string" ? href : undefined, instructor);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    openBooking(resolvedInstructor ? { instructor: resolvedInstructor } : undefined);
  }

  const bookHref =
    resolvedInstructor ? `/book?instructor=${resolvedInstructor}` : "/book";

  return (
    <Link href={bookHref} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
