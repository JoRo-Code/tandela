import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { db, drafts, activityLogs, emails, emailConnections, workspaceMembers } from "@/lib/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ReviewQueue } from "@/components/dashboard/review-queue";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default async function Dashboard() {
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

  // Get pending drafts for review
  const pendingDrafts = await db.query.drafts.findMany({
    where: and(
      eq(drafts.workspaceId, workspace.id),
      eq(drafts.status, "pending")
    ),
    with: {
      email: true,
    },
    orderBy: [desc(drafts.createdAt)],
  });

  // Get today's start for stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Count sent today
  const sentToday = await db.query.drafts.findMany({
    where: and(
      eq(drafts.workspaceId, workspace.id),
      eq(drafts.status, "sent"),
      gte(drafts.sentAt, todayStart)
    ),
  });

  // Get activity logs
  const activities = await db.query.activityLogs.findMany({
    where: eq(activityLogs.workspaceId, workspace.id),
    with: {
      email: true,
      draft: true,
    },
    orderBy: [desc(activityLogs.createdAt)],
    limit: 50,
  });

  // Check if workspace has any email connections
  const connections = await db.query.emailConnections.findMany({
    where: eq(emailConnections.workspaceId, workspace.id),
  });

  const hasConnections = connections.length > 0;

  // Transform drafts for the component
  const draftsForReview = pendingDrafts.map((draft) => ({
    id: draft.id,
    intent: draft.intent,
    intentConfidence: draft.intentConfidence,
    responseSubject: draft.responseSubject,
    responseBody: draft.responseBody,
    responseConfidence: draft.responseConfidence,
    createdAt: draft.createdAt,
    email: {
      id: draft.email.id,
      subject: draft.email.subject,
      fromAddress: draft.email.fromAddress,
      bodyText: draft.email.bodyText,
      receivedAt: draft.email.receivedAt,
    },
  }));

  // Transform activities for the component
  const activitiesForFeed = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    data: activity.data as Record<string, unknown> | null,
    createdAt: activity.createdAt,
    email: activity.email
      ? {
          subject: activity.email.subject,
          fromAddress: activity.email.fromAddress,
        }
      : null,
    draft: activity.draft
      ? {
          responseSubject: activity.draft.responseSubject,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Tandela
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/emails"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                All Emails
              </Link>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {workspace.name}
              </div>
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* No connections banner */}
        {!hasConnections && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-amber-900 dark:text-amber-100">
                  Connect your inbox to get started
                </h2>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Connect a Gmail account to start processing emails with AI
                </p>
              </div>
              <a
                href="/api/auth/gmail/connect"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Connect Gmail
              </a>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards
            toReview={pendingDrafts.length}
            sentToday={sentToday.length}
            bookings={0}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Review Queue */}
          <div>
            <ReviewQueue drafts={draftsForReview} />
          </div>

          {/* Right: Activity Feed */}
          <div>
            <ActivityFeed activities={activitiesForFeed} />
          </div>
        </div>
      </main>
    </div>
  );
}
