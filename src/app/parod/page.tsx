import { PerioChart } from "@/components/perio/perio-chart";

export default function ParodPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-sand)] p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 font-display text-2xl font-semibold text-[var(--brand-ink)]">
          Parodontal undersökning
        </h1>
        <PerioChart />
      </div>
    </div>
  );
}
