import Link from "next/link";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import { emails } from "@/lib/db/schema";

function formatDate(date: Date | null) {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function extractName(fromAddress: string | null): string {
  if (!fromAddress) return "Unknown";
  // Extract name from "Name <email@example.com>" format
  const match = fromAddress.match(/^([^<]+)/);
  if (match) {
    return match[1].trim().replace(/"/g, "");
  }
  return fromAddress;
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; count?: string }>;
}) {
  const params = await searchParams;
  const justConnected = params.connected === "true";
  const syncedCount = params.count ? parseInt(params.count) : 0;

  const allEmails = await db.query.emails.findMany({
    orderBy: [desc(emails.receivedAt)],
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            Tandela
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {allEmails.length} emails
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Success banner */}
        {justConnected && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-950 dark:text-green-300">
            Successfully connected! Synced {syncedCount} emails from your inbox.
          </div>
        )}

        {/* Email list */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Inbox
            </h1>
          </div>

          {allEmails.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
              No emails yet. Connect your Gmail to get started.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allEmails.map((email) => (
                <div
                  key={email.id}
                  className={`flex cursor-pointer items-start gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    !email.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  <div className="mt-2 flex-shrink-0">
                    {!email.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  {/* Email content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span
                        className={`truncate ${
                          !email.isRead
                            ? "font-semibold text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {extractName(email.fromAddress)}
                      </span>
                      <span className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(email.receivedAt)}
                      </span>
                    </div>
                    <div
                      className={`mt-1 truncate ${
                        !email.isRead
                          ? "font-medium text-zinc-900 dark:text-zinc-50"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {email.subject || "(no subject)"}
                    </div>
                    <div className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {truncate(email.bodyText, 100)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
