"use client";

import { useEffect, useRef, createContext, useContext } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0, 
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Standard buttery easing
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // More efficient check for modals: only check when visibility changes or on clicks/keys
    // instead of a full subtree mutation observer on every attribute change.
    const checkModal = () => {
      const hasModal = document.querySelector('[data-lenis-prevent]');
      if (hasModal) lenis.stop();
      else lenis.start();
    };

    // Use a lighter observer that only looks at direct children of body (where modals are usually appended)
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true });
    
    // Also check on click events as a fallback
    window.addEventListener('click', checkModal);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('click', checkModal);
      lenis.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenisRef.current}>{children}</LenisContext.Provider>;
}
