import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";
import { db, workspaces } from "@/lib/db";

export async function GET() {
  // For MVP, create a default workspace if none exists
  // In production, this would come from user session
  let workspace = await db.query.workspaces.findFirst();

  if (!workspace) {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({ name: "Default Workspace" })
      .returning();
    workspace = newWorkspace;
  }

  // Store workspace ID in state for callback
  const state = JSON.stringify({ workspaceId: workspace.id });
  const authUrl = getAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
