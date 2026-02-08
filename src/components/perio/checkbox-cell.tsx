"use client";

import { memo } from "react";

const VARIANT_STYLES = {
  bleeding: {
    checked: "bg-red-500 border-red-500 text-white",
    unchecked: "border-[var(--brand-ink-20)] bg-transparent text-[var(--brand-ink-20)]",
  },
  plaque: {
    checked: "bg-[var(--brand-olive)] border-[var(--brand-olive)] text-white",
    unchecked: "border-[var(--brand-ink-20)] bg-transparent text-[var(--brand-ink-20)]",
  },
  furcation: {
    checked: "bg-[var(--brand-ink)] border-[var(--brand-ink)] text-[var(--brand-sand)]",
    unchecked: "border-[var(--brand-ink-20)] bg-transparent text-[var(--brand-ink-20)]",
  },
} as const;

interface CheckboxCellProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  variant: keyof typeof VARIANT_STYLES;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export const CheckboxCell = memo(function CheckboxCell({
  checked,
  onChange,
  variant,
  label,
  disabled,
  ariaLabel,
}: CheckboxCellProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        flex h-4 w-4 items-center justify-center rounded-sm
        border transition-colors duration-100
        text-[8px] font-bold leading-none select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ember)] focus-visible:ring-offset-1
        disabled:cursor-not-allowed
        ${checked ? styles.checked : styles.unchecked}
      `}
    >
      {label}
    </button>
  );
});
