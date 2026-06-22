import Link from "next/link";
import { SITE, PAYMENT_OPTIONS_COPY } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-navy text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        aria-hidden
      />
      <div className="container-site section-pad !pb-12 !pt-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[1.75rem] leading-tight">
              Swim to <span className="hero-surf-word">Surf</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Private one-on-one swim lessons in American Fork. Water safety and confidence for every age.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">{PAYMENT_OPTIONS_COPY.short}</p>
            <Link href="/book" className="btn-cta-primary mt-8 inline-flex bg-water hover:bg-water/90">
              Book a lesson
            </Link>
          </div>

          <div>
            <p className="eyebrow mb-4 text-white/40">Explore</p>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/about", label: "Our Story" },
                { href: "/instructors", label: "Instructors" },
                { href: "/faq", label: "FAQ" },
                { href: "/book", label: "Book Lessons" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/65 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4 text-white/40">Contact</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`mailto:${SITE.email}`} className="text-white/65 hover:text-white">
                  {SITE.email}
                </Link>
              </li>
              <li>
                <Link href={`tel:${SITE.phone}`} className="text-white/65 hover:text-white">
                  {SITE.phone}
                </Link>
              </li>
              <li className="text-white/65">American Fork, UT</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-8 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/admin/login" className="hover:text-white/70">
              Admin
            </Link>
            <span aria-hidden>·</span>
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
