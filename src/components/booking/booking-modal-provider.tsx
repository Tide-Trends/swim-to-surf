"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookingWizard } from "@/app/book/booking-wizard";

type OpenOptions = {
  instructor?: "lukaah" | "estee";
};

type BookingModalContextValue = {
  open: boolean;
  openBooking: (options?: OpenOptions) => void;
  closeBooking: () => void;
};

const BookingModalContext = createContext<BookingModalContextValue | null>(null);

export function useBookingModal(): BookingModalContextValue {
  const ctx = useContext(BookingModalContext);
  if (!ctx) {
    throw new Error("useBookingModal must be used within BookingModalProvider");
  }
  return ctx;
}

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [initialInstructor, setInitialInstructor] = useState<"lukaah" | "estee" | undefined>();

  const checkout = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");
  const isCheckoutReturn = checkout === "success" && Boolean(sessionId);

  const paramInstructor = searchParams.get("instructor");
  const resolvedInstructor =
    initialInstructor ??
    (paramInstructor === "lukaah" || paramInstructor === "estee" ? paramInstructor : undefined);

  const openBooking = useCallback((options?: OpenOptions) => {
    setInitialInstructor(options?.instructor);
    setModalKey((k) => k + 1);
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("book", "1");
    if (options?.instructor) {
      url.searchParams.set("instructor", options.instructor);
    } else {
      url.searchParams.delete("instructor");
    }
    window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  }, []);

  const closeBooking = useCallback(() => {
    setOpen(false);
    setInitialInstructor(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("book");
    url.searchParams.delete("instructor");
    url.searchParams.delete("checkout");
    url.searchParams.delete("session_id");
    url.searchParams.delete("canceled");
    const next = url.searchParams.toString();
    window.history.replaceState({}, "", next ? `${url.pathname}?${next}` : url.pathname);
  }, []);

  useEffect(() => {
    const onBookPath = pathname === "/book";
    const bookQuery = searchParams.get("book") === "1";
    const shouldOpen = onBookPath || bookQuery || isCheckoutReturn;

    if (!shouldOpen) {
      setOpen(false);
      return;
    }

    setOpen(true);

    if (onBookPath) {
      if (isCheckoutReturn && sessionId) {
        router.replace(`/?checkout=success&session_id=${encodeURIComponent(sessionId)}`, { scroll: false });
      } else {
        const inst = searchParams.get("instructor");
        if (inst === "lukaah" || inst === "estee") {
          setInitialInstructor(inst);
        }
        const q = new URLSearchParams({ book: "1" });
        if (inst === "lukaah" || inst === "estee") q.set("instructor", inst);
        router.replace(`/?${q.toString()}`, { scroll: false });
      }
    }
  }, [pathname, searchParams, isCheckoutReturn, sessionId, router]);

  useEffect(() => {
    const inst = searchParams.get("instructor");
    if (searchParams.get("book") === "1" && (inst === "lukaah" || inst === "estee")) {
      setInitialInstructor(inst);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBooking();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeBooking]);

  return (
    <BookingModalContext.Provider value={{ open, openBooking, closeBooking }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            key="booking-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-5"
            role="presentation"
          >
            <button
              type="button"
              aria-label="Close booking"
              className="absolute inset-0 bg-navy/55 backdrop-blur-md"
              onClick={closeBooking}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 flex h-[min(92dvh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-[#F5F5F7] shadow-2xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <BookingWizard
                key={modalKey}
                embedded
                onClose={closeBooking}
                initialInstructor={resolvedInstructor}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BookingModalContext.Provider>
  );
}
