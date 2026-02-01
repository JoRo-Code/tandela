import { NextRequest, NextResponse } from "next/server";
import { db, drafts, activityLogs, emails, emailConnections } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getWorkspaceApi } from "@/lib/auth-helpers";
import { sendEmail, refreshAccessToken } from "@/lib/gmail";

export async function POST(
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

    // Get the draft with email and connection info
    const draft = await db.query.drafts.findFirst({
      where: and(eq(drafts.id, id), eq(drafts.workspaceId, workspace.id)),
      with: {
        email: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (draft.status === "sent") {
      return NextResponse.json(
        { error: "Draft has already been sent" },
        { status: 400 }
      );
    }

    if (!draft.responseBody) {
      return NextResponse.json(
        { error: "Draft has no response body" },
        { status: 400 }
      );
    }

    // Get the email connection to send from
    const connection = await db.query.emailConnections.findFirst({
      where: eq(emailConnections.id, draft.email.connectionId),
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Email connection not found" },
        { status: 404 }
      );
    }

    // Refresh token if needed
    let accessToken = connection.accessToken;
    if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
      const newCredentials = await refreshAccessToken(connection.refreshToken);
      if (newCredentials.access_token) {
        accessToken = newCredentials.access_token;

        // Update stored token
        await db
          .update(emailConnections)
          .set({
            accessToken: newCredentials.access_token,
            tokenExpiresAt: newCredentials.expiry_date
              ? new Date(newCredentials.expiry_date)
              : null,
          })
          .where(eq(emailConnections.id, connection.id));
      }
    }

    // Determine the recipient (reply to the original sender)
    const replyTo = draft.email.fromAddress;
    if (!replyTo) {
      return NextResponse.json(
        { error: "Cannot determine recipient from original email" },
        { status: 400 }
      );
    }

    // Send the email
    const sentResult = await sendEmail(accessToken, connection.refreshToken, {
      to: replyTo,
      subject: draft.responseSubject || `Re: ${draft.email.subject || ""}`,
      body: draft.responseBody,
      threadId: draft.email.threadId,
    });

    // Update the draft status
    const [updatedDraft] = await db
      .update(drafts)
      .set({
        status: "sent",
        sentAt: new Date(),
        reviewedAt: new Date(),
      })
      .where(eq(drafts.id, id))
      .returning();

    // Log the activity
    await db.insert(activityLogs).values({
      workspaceId: workspace.id,
      emailId: draft.emailId,
      draftId: draft.id,
      type: "draft_sent",
      data: {
        sentMessageId: sentResult.id,
        sentThreadId: sentResult.threadId,
        to: replyTo,
        subject: draft.responseSubject,
      },
    });

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
      sentMessageId: sentResult.id,
    });
  } catch (error) {
    console.error("Error sending draft:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: String(error) },
      { status: 500 }
    );
  }
}
