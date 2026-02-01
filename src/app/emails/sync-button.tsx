"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SyncResult {
  success: boolean;
  totalNewEmails: number;
  connections: Array<{
    email: string;
    newEmails: number;
    error?: string;
  }>;
}

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/emails/sync", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync");
      }

      const data = await res.json();
      setResult(data);

      // Refresh the page to show new emails
      router.refresh();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            Syncing...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync All
          </>
        )}
      </button>
      {result && (
        <span className={`text-sm ${result.totalNewEmails > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-500"}`}>
          {result.totalNewEmails > 0 ? `+${result.totalNewEmails} new` : "Up to date"}
        </span>
      )}
    </div>
  );
}
