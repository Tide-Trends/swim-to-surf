"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="eyebrow !text-[0.625rem]">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          className={`min-h-[140px] w-full resize-y rounded-xl border bg-sand/40 px-4 py-3.5 font-ui text-sm text-navy transition-colors placeholder:text-muted/50 focus:border-water focus:bg-white focus:outline-none focus:ring-2 focus:ring-water/20 ${
            error ? "border-error" : "border-navy/10"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
