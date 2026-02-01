import { auth } from "./auth";
import { redirect } from "next/navigation";
import { db, workspaceMembers, workspaces } from "./db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Require authentication for a page. Redirects to login if not authenticated.
 * Use in server components.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Require authentication for an API route. Returns 401 if not authenticated.
 * Use in API routes.
 */
export async function requireAuthApi() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

/**
 * Get the current user's workspace.
 * Redirects to login if not authenticated.
 * Use in server components.
 */
export async function getWorkspace() {
  const session = await requireAuth();

  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, session.user.id),
    with: {
      workspace: true,
    },
  });

  if (!membership) {
    throw new Error("No workspace found for user");
  }

  return membership.workspace;
}

/**
 * Get the current user's workspace for an API route.
 * Returns error response if not authenticated or no workspace found.
 * Use in API routes.
 */
export async function getWorkspaceApi() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, session.user.id),
    with: {
      workspace: true,
    },
  });

  if (!membership) {
    return { error: NextResponse.json({ error: "No workspace found" }, { status: 400 }) };
  }

  return { workspace: membership.workspace, session };
}
