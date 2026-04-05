"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center font-ui font-medium rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1D1F] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0a4a5c] text-white border border-[#062f3d] shadow-[0_2px_0_rgba(255,255,255,0.12)_inset,0_8px_24px_rgba(6,47,61,0.35)] hover:bg-[#0c5a70] hover:border-[#083848] hover:shadow-[0_2px_0_rgba(255,255,255,0.14)_inset,0_12px_32px_rgba(6,47,61,0.4)] active:translate-y-px active:scale-[0.99]",
  secondary: "bg-[#E8ECF0] text-[#0f172a] border border-black/10 hover:bg-[#dce3ea]",
  outline: "border-2 border-[#1D1D1F] text-[#0f172a] bg-white hover:bg-[#f8fafc]",
  ghost: "text-[#1D1D1F] hover:bg-[#F5F5F7]",
};

const sizes: Record<Size, string> = {
  sm: "px-5 py-2.5 text-sm font-semibold",
  md: "px-8 py-3.5 text-sm font-semibold",
  lg: "px-10 py-4 text-base font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
