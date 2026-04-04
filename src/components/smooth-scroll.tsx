"use client";

import { useEffect } from "react";

/**
 * Lightweight smooth scroll wrapper.
 * Uses native CSS scroll-behavior: smooth (GPU-accelerated, 60fps).
 * No JavaScript scroll interception = no jank.
 * 
 * Handles the data-lenis-prevent attribute for backwards compatibility
 * with modal components that used it.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enable smooth scrolling via CSS (handled in globals.css)
    document.documentElement.style.scrollBehavior = "smooth";
    
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return <>{children}</>;
}
