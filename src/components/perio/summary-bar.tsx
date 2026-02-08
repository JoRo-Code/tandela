import type { PerioSummary } from "@/lib/perio/types";

interface SummaryBarProps {
  summary: PerioSummary;
}

export function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 text-xs">
      <div className="rounded-md bg-[var(--brand-cream)] border border-[var(--brand-ink-10)] px-3 py-1.5">
        <span className="text-[var(--brand-olive)]">BVS: </span>
        <span className="font-mono font-semibold text-[var(--brand-ink)]">
          {summary.bvsPercent}%
        </span>
        <span className="ml-1 text-[var(--brand-ink-40)] font-mono">
          ({summary.bleedingSites}/{summary.totalSites})
        </span>
      </div>
      <div className="rounded-md bg-[var(--brand-cream)] border border-[var(--brand-ink-10)] px-3 py-1.5">
        <span className="text-[var(--brand-olive)]">PLI: </span>
        <span className="font-mono font-semibold text-[var(--brand-ink)]">
          {summary.pliPercent}%
        </span>
        <span className="ml-1 text-[var(--brand-ink-40)] font-mono">
          ({summary.plaqueSites}/{summary.totalSites})
        </span>
      </div>
    </div>
  );
}
