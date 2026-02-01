import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { db, emailConnections, workspaceMembers } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get user's workspace
  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, session.user.id),
    with: {
      workspace: true,
    },
  });

  if (!membership) {
    throw new Error("No workspace found for user");
  }

  const workspace = membership.workspace;

  // Get all email connections for this workspace
  const connections = await db.query.emailConnections.findMany({
    where: eq(emailConnections.workspaceId, workspace.id),
    orderBy: [desc(emailConnections.createdAt)],
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Tandela
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              AI-powered email assistant for your business
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {session.user.name}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {session.user.email}
              </div>
            </div>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-10 w-10 rounded-full"
              />
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
            {error === "oauth_failed"
              ? "Failed to connect Gmail. Please try again."
              : error === "missing_params"
              ? "Invalid OAuth response. Please try again."
              : `Error: ${error}`}
          </div>
        )}

        {/* Workspace name */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Workspace
          </h2>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {workspace.name}
          </p>
        </div>

        {/* Connected accounts */}
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Connected Inboxes
            </h2>
            <a
              href="/api/auth/gmail/connect"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Add Gmail
            </a>
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No inboxes connected yet. Connect your Gmail to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                      <svg className="h-5 w-5 text-red-600 dark:text-red-300" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                        {connection.emailAddress}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Connected {connection.createdAt?.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {connections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <Link
                href="/emails"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                View All Emails
              </Link>
            </div>
          )}
        </div>

        {/* Features preview */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">📧</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Smart Inbox
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              AI classifies and prioritizes your emails automatically
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">🤖</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Auto-Respond
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Draft or send responses for routine inquiries
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-2xl">📅</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Booking Integration
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Handle booking requests with calendar integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
