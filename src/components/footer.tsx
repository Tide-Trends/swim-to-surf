import Link from "next/link";
import { SITE } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ocean-deep text-white py-16 md:py-24 overflow-hidden relative">
      {/* Subtle top border/glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sunshine/40 to-transparent" />
      
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          <div className="md:col-span-2 flex flex-col items-start">
            <h3 className="text-2xl font-display font-semibold mb-6 tracking-tight">
              Swim to Surf.
            </h3>
            <p className="text-ocean-light/70 max-w-sm mb-8 leading-relaxed">
              Empowering swimmers from 0 to 99 with private, one-on-one lessons in American Fork. Water safety and confidence taught with a smile.
            </p>
            <div className="flex space-x-4">
              <Link href="/book">
                <button className="bg-sunshine/20 hover:bg-sunshine/30 transition-colors text-sunshine text-sm font-medium py-2 px-6 rounded-full border border-sunshine/30">
                  Book Now
                </button>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 tracking-wide text-sm uppercase opacity-60">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-ocean-light/60 hover:text-white transition-colors text-sm">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="text-ocean-light/60 hover:text-white transition-colors text-sm">
                  Instructors
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-ocean-light/60 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 tracking-wide text-sm uppercase opacity-60">Contact</h4>
            <ul className="space-y-4">
              <li>
                <Link href={`mailto:${SITE.email}`} className="text-ocean-light/60 hover:text-white transition-colors text-sm">
                  {SITE.email}
                </Link>
              </li>
              <li>
                <Link href={`tel:${SITE.phone}`} className="text-ocean-light/60 hover:text-white transition-colors text-sm">
                  {SITE.phone}
                </Link>
              </li>
              <li className="text-ocean-light/60 text-sm">
                American Fork, UT
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-ocean-light/50">
          <p>&copy; {currentYear} {SITE.name}. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
            <span className="opacity-40">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
