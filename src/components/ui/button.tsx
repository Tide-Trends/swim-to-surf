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
    "bg-gradient-to-b from-white to-[#f3fcff] text-[#08384b] border border-[#08384b]/15 shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_12px_28px_rgba(6,75,96,0.16),0_22px_48px_rgba(34,211,238,0.16)] hover:-translate-y-0.5 hover:bg-gradient-to-b hover:from-white hover:to-[#e9f8ff] hover:shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_16px_34px_rgba(6,75,96,0.18),0_28px_58px_rgba(34,211,238,0.18)] active:translate-y-0 active:scale-[0.99]",
  secondary: "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]",
  outline: "border border-black/10 text-[#1D1D1F] hover:border-black/30 bg-white",
  ghost: "text-[#1D1D1F] hover:bg-[#F5F5F7]",
};

const sizes: Record<Size, string> = {
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-4 text-sm",
  lg: "px-10 py-5 text-base",
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
