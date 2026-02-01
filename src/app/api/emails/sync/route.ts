import { NextResponse } from "next/server";
import { db, emailConnections, emails } from "@/lib/db";
import { fetchEmails, refreshAccessToken } from "@/lib/gmail";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Get the email connection
    const connection = await db.query.emailConnections.findFirst();

    if (!connection) {
      return NextResponse.json(
        { error: "No email connection found" },
        { status: 400 }
      );
    }

    let accessToken = connection.accessToken;

    // Check if token needs refresh
    if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
      console.log("[Sync] Refreshing access token...");
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
    console.log("[Sync] Fetching emails...");
    const fetchedEmails = await fetchEmails(
      accessToken,
      connection.refreshToken,
      50
    );

    // Insert new emails (skip duplicates)
    let newCount = 0;
    for (const email of fetchedEmails) {
      const result = await db
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

      if (result.length > 0) {
        newCount++;
      }
    }

    console.log(`[Sync] Synced ${newCount} new emails`);

    return NextResponse.json({
      success: true,
      totalFetched: fetchedEmails.length,
      newEmails: newCount,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync emails", details: String(error) },
      { status: 500 }
    );
  }
}
