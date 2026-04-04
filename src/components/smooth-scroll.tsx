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
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      lerp: 0.08,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Stop Lenis when ANY modal/overlay is open (detected by [data-lenis-prevent] or fixed overlays)
    const observer = new MutationObserver(() => {
      const hasModal = document.querySelector('[data-lenis-prevent]');
      if (hasModal) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenisRef.current}>{children}</LenisContext.Provider>;
}
