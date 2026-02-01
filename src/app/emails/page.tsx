import Link from "next/link";
import { db, emails, emailConnections } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { EmailItem } from "./email-item";
import { SyncButton } from "./sync-button";
import { getWorkspace } from "@/lib/auth-helpers";

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; count?: string }>;
}) {
  const params = await searchParams;
  const justConnected = params.connected === "true";
  const syncedCount = params.count ? parseInt(params.count) : 0;

  // Get the authenticated user's workspace
  const workspace = await getWorkspace();

  // Fetch emails for this workspace only (via email connections)
  const allEmails = await db
    .select({
      id: emails.id,
      subject: emails.subject,
      fromAddress: emails.fromAddress,
      bodyText: emails.bodyText,
      isRead: emails.isRead,
      receivedAt: emails.receivedAt,
      accountEmail: emailConnections.emailAddress,
    })
    .from(emails)
    .innerJoin(emailConnections, eq(emails.connectionId, emailConnections.id))
    .where(eq(emailConnections.workspaceId, workspace.id))
    .orderBy(desc(emails.receivedAt))
    .limit(100);

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
            <SyncButton />
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

        {/* Instructions */}
        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Click on an email to expand it, then click &quot;Process with AI&quot; to classify and generate a draft response.
        </div>

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
            <div>
              {allEmails.map((email) => (
                <EmailItem
                  key={email.id}
                  email={{
                    id: email.id,
                    subject: email.subject,
                    fromAddress: email.fromAddress,
                    bodyText: email.bodyText,
                    isRead: email.isRead ?? false,
                    receivedAt: email.receivedAt,
                    accountEmail: email.accountEmail,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
