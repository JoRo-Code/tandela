"use client";

import { memo } from "react";

const VARIANT_STYLES = {
  bleeding: {
    checked: "bg-red-500 border-red-500",
    icon: "text-white",
  },
  plaque: {
    checked: "bg-[var(--brand-olive)] border-[var(--brand-olive)]",
    icon: "text-white",
  },
  furcation: {
    checked: "bg-[var(--brand-ink)] border-[var(--brand-ink)]",
    icon: "text-[var(--brand-sand)]",
  },
} as const;

interface CheckboxCellProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  variant: keyof typeof VARIANT_STYLES;
  disabled?: boolean;
  ariaLabel?: string;
}

export const CheckboxCell = memo(function CheckboxCell({
  checked,
  onChange,
  variant,
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
        flex h-5 w-5 items-center justify-center rounded
        border transition-colors duration-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ember)] focus-visible:ring-offset-1
        disabled:cursor-not-allowed
        ${checked ? styles.checked : "border-[var(--brand-ink-20)] bg-transparent"}
      `}
    >
      {checked && (
        <svg
          className={`h-3 w-3 ${styles.icon}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6l2.5 2.5 4.5-5" />
        </svg>
      )}
    </button>
  );
});
