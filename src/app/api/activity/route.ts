import { NextRequest, NextResponse } from "next/server";
import { db, activityLogs } from "@/lib/db";
import { eq, desc, and, gte, lte, like, or } from "drizzle-orm";
import { getWorkspaceApi } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const result = await getWorkspaceApi();
    if ("error" in result) {
      return result.error;
    }

    const { workspace } = result;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const type = searchParams.get("type"); // Filter by activity type
    const from = searchParams.get("from"); // Start date
    const to = searchParams.get("to"); // End date
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build where conditions
    const conditions = [eq(activityLogs.workspaceId, workspace.id)];

    if (type) {
      conditions.push(eq(activityLogs.type, type));
    }

    if (from) {
      conditions.push(gte(activityLogs.createdAt, new Date(from)));
    }

    if (to) {
      conditions.push(lte(activityLogs.createdAt, new Date(to)));
    }

    // Fetch activities
    const activities = await db.query.activityLogs.findMany({
      where: and(...conditions),
      with: {
        email: true,
        draft: true,
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity", details: String(error) },
      { status: 500 }
    );
  }
}
