"use client";

import { memo, useRef } from "react";

interface NumericCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  alert?: boolean;
  ariaLabel?: string;
}

export const NumericCell = memo(function NumericCell({
  value,
  onChange,
  min = 0,
  max = 12,
  disabled,
  alert,
  ariaLabel,
}: NumericCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      disabled={disabled}
      value={value ?? ""}
      placeholder="–"
      onFocus={() => inputRef.current?.select()}
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (raw === "") {
          onChange(null);
          return;
        }
        const num = parseInt(raw, 10);
        if (!isNaN(num) && num >= min && num <= max) {
          onChange(num);
        }
      }}
      className={`
        w-7 bg-transparent text-center font-mono text-xs
        border-b border-[var(--brand-ink-10)]
        placeholder:text-[var(--brand-ink-20)]
        focus:border-[var(--brand-ember)] focus:outline-none
        disabled:cursor-not-allowed disabled:opacity-30
        ${alert ? "text-red-600 font-semibold" : "text-[var(--brand-ink)]"}
      `}
    />
  );
});
