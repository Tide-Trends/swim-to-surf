"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-center gap-4 cursor-pointer group">
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-14 h-8 rounded-full transition-colors duration-300 ${
          checked ? "bg-[#34C759]" : "bg-[#E8E8ED]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
      <div className="flex flex-col">
        <span className="font-ui font-medium text-lg text-[#1D1D1F] tracking-tight">{label}</span>
        {description && <span className="text-sm text-[#86868B] font-ui">{description}</span>}
      </div>
    </label>
  );
}
