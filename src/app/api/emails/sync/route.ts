import { NextResponse } from "next/server";
import { db, emailConnections, emails } from "@/lib/db";
import { fetchEmails, refreshAccessToken } from "@/lib/gmail";
import { eq } from "drizzle-orm";
import { getWorkspaceApi } from "@/lib/auth-helpers";

export async function POST() {
  try {
    // Get the authenticated user's workspace
    const result = await getWorkspaceApi();
    if ("error" in result) {
      return result.error;
    }

    const { workspace } = result;

    // Get email connections for this workspace only
    const connections = await db.query.emailConnections.findMany({
      where: eq(emailConnections.workspaceId, workspace.id),
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { error: "No email connections found" },
        { status: 400 }
      );
    }

    let totalNewEmails = 0;
    const results: Array<{ email: string; newEmails: number; error?: string }> = [];

    // Sync each connection
    for (const connection of connections) {
      try {
        let accessToken = connection.accessToken;

        // Check if token needs refresh
        if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
          console.log(`[Sync] Refreshing token for ${connection.emailAddress}...`);
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

        // Fetch emails from Gmail
        console.log(`[Sync] Fetching emails for ${connection.emailAddress}...`);
        const fetchedEmails = await fetchEmails(
          accessToken,
          connection.refreshToken,
          50
        );

        // Insert new emails (skip duplicates)
        let newCount = 0;
        for (const email of fetchedEmails) {
          const insertResult = await db
            .insert(emails)
            .values({
              connectionId: connection.id,
              externalId: email.id,
              threadId: email.threadId,
              subject: email.subject,
              fromAddress: email.from,
              toAddresses: email.to,
              bodyText: email.bodyText,
              bodyHtml: email.bodyHtml,
              isRead: email.isRead,
              receivedAt: email.receivedAt,
            })
            .onConflictDoNothing()
            .returning();

          if (insertResult.length > 0) {
            newCount++;
          }
        }

        totalNewEmails += newCount;
        results.push({
          email: connection.emailAddress,
          newEmails: newCount,
        });

        console.log(`[Sync] ${connection.emailAddress}: ${newCount} new emails`);
      } catch (err) {
        console.error(`[Sync] Error syncing ${connection.emailAddress}:`, err);
        results.push({
          email: connection.emailAddress,
          newEmails: 0,
          error: String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalNewEmails,
      connections: results,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync emails", details: String(error) },
      { status: 500 }
    );
  }
}
