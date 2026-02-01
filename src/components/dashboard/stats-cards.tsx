"use client";

interface StatsCardsProps {
  toReview: number;
  sentToday: number;
  bookings: number;
}

export function StatsCards({ toReview, sentToday, bookings }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">To Review</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{toReview}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📧</span>
          <div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Sent Today</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{sentToday}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Bookings</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{bookings}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
