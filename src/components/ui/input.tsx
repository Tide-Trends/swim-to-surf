"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868B] font-ui">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-5 py-5 rounded-2xl border bg-[#F5F5F7] text-[#1D1D1F] font-ui text-sm transition-all duration-300 placeholder:text-[#86868B]/50 focus:outline-none focus:border-[#1D1D1F] focus:ring-1 focus:ring-[#1D1D1F] focus:bg-white shadow-sm hover:border-black/10 ${
            error ? "border-error focus:border-error focus:ring-error" : "border-black/5"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error font-ui mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
