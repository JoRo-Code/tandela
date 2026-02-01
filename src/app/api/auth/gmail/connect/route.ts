import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";
import { getWorkspaceApi } from "@/lib/auth-helpers";

export async function GET() {
  // Get the authenticated user's workspace
  const result = await getWorkspaceApi();
  if ("error" in result) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const { workspace } = result;

  // Store workspace ID in state for callback
  const state = JSON.stringify({ workspaceId: workspace.id });
  const authUrl = getAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
