"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function Nav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const forceVisible = pathname !== "/";
  const navStyleActive = isScrolled || forceVisible;

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "Our Story" },
    { href: "/instructors", label: "Instructors" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          navStyleActive
            ? "glass py-3 border-black/5"
            : "bg-transparent py-5 border-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl flex items-center justify-between">
          <Link
            href="/"
            className={`text-xl font-semibold tracking-tight transition-opacity hover:opacity-70 ${
              navStyleActive ? "text-ocean-deep" : "text-dark"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Swim to Surf.
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium tracking-wide">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors hover:text-ocean-deep ${
                    pathname === link.href ? (navStyleActive ? "text-ocean-deep" : "text-ocean-deep opacity-100") : (navStyleActive ? "text-dark/90" : "text-dark/85")
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link
              href="/book"
              className="btn-cta-primary rounded-full px-6 py-2.5 text-sm font-ui font-bold uppercase tracking-wider shadow-[0_10px_24px_rgba(6,75,96,0.16)]"
            >
              Book lesson
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden relative w-10 h-10 flex flex-col justify-center items-center group"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span
              className={`block w-6 h-[1.5px] transition-transform duration-300 ${navStyleActive ? 'bg-ocean-deep' : 'bg-dark'} ${
                mobileMenuOpen ? "rotate-45 translate-y-[1.5px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`block w-6 h-[1.5px] transition-transform duration-300 ${navStyleActive ? 'bg-ocean-deep' : 'bg-dark'} ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[1.5px]" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-40 bg-warm-white/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-6 text-2xl font-display font-medium">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={`block transition-colors ${
                      pathname === link.href ? "text-ocean-mid" : "text-dark"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: links.length * 0.05 }}
                className="pt-6 border-t border-black/10 mt-4"
              >
                <Link
                  href="/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-cta-primary flex w-full min-h-[3.5rem] items-center justify-center rounded-full text-base font-bold uppercase tracking-wider"
                >
                  Book swim lessons
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
