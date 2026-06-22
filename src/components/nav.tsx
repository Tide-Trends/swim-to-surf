"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookLink } from "@/components/booking/book-link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "Our Story" },
  { href: "/instructors", label: "Instructors" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const solid = scrolled || !onHome;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          solid
            ? "border-b border-navy/8 bg-cream/96 shadow-[0_1px_0_rgba(12,45,67,0.04)] backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-navy/40 to-transparent"
        }`}
      >
        <div className="container-site flex h-[4.25rem] items-center justify-between md:h-[4.5rem]">
          <Link
            href="/"
            className={`font-display text-[1.35rem] tracking-tight transition-opacity hover:opacity-85 ${
              solid ? "text-navy" : "text-white"
            }`}
          >
            Swim to <span className={solid ? "text-water" : "hero-surf-word"}>Surf</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? solid
                        ? "text-deep"
                        : "text-white"
                      : solid
                        ? "text-navy/70 hover:text-navy"
                        : "text-white/75 hover:text-white"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full ${
                        solid ? "bg-water" : "bg-gold"
                      }`}
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
            <BookLink
              className={`ml-3 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px ${
                solid
                  ? "bg-deep text-white hover:bg-navy hover:shadow-md"
                  : "bg-white text-navy hover:bg-white/95 hover:shadow-lg"
              }`}
            >
              Book lesson
            </BookLink>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span
              className={`block h-0.5 w-6 transition-transform ${solid ? "bg-navy" : "bg-white"} ${
                mobileOpen ? "translate-y-[1px] rotate-45" : "-translate-y-1"
              }`}
            />
            <span
              className={`block h-0.5 w-6 transition-transform ${solid ? "bg-navy" : "bg-white"} ${
                mobileOpen ? "-translate-y-[1px] -rotate-45" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-cream px-6 pb-8 pt-24 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mobile"
            >
              <div className="flex flex-col gap-0.5">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-3.5 text-lg font-medium transition-colors ${
                      pathname === link.href ? "bg-sand text-deep" : "text-navy hover:bg-sand/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <BookLink className="btn-cta-primary mt-8 w-full py-3.5 text-center">
                Book a lesson
              </BookLink>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
