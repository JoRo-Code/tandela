import { NextRequest, NextResponse } from "next/server";
import { db, drafts, activityLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getWorkspaceApi } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getWorkspaceApi();
    if ("error" in result) {
      return result.error;
    }

    const { workspace } = result;
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["approved", "rejected", "edited"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: approved, rejected, or edited" },
        { status: 400 }
      );
    }

    // Verify the draft belongs to this workspace
    const draft = await db.query.drafts.findFirst({
      where: and(eq(drafts.id, id), eq(drafts.workspaceId, workspace.id)),
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Update the draft
    const [updatedDraft] = await db
      .update(drafts)
      .set({
        status,
        reviewedAt: new Date(),
      })
      .where(eq(drafts.id, id))
      .returning();

    // Log the activity
    await db.insert(activityLogs).values({
      workspaceId: workspace.id,
      emailId: draft.emailId,
      draftId: draft.id,
      type: `draft_${status}`,
      data: { previousStatus: draft.status },
    });

    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Failed to update draft", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getWorkspaceApi();
    if ("error" in result) {
      return result.error;
    }

    const { workspace } = result;
    const { id } = await params;

    const draft = await db.query.drafts.findFirst({
      where: and(eq(drafts.id, id), eq(drafts.workspaceId, workspace.id)),
      with: {
        email: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft", details: String(error) },
      { status: 500 }
    );
  }
}
