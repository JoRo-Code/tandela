import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode, getUserEmail, fetchEmails } from "@/lib/gmail";
import { db, emailConnections, emails } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", request.url));
  }

  try {
    // Parse state to get workspace ID
    const { workspaceId } = JSON.parse(state);

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to get tokens");
    }

    // Get user's email address
    const emailAddress = await getUserEmail(tokens.access_token);

    if (!emailAddress) {
      throw new Error("Failed to get email address");
    }

    // Store connection in database
    const [connection] = await db
      .insert(emailConnections)
      .values({
        workspaceId,
        provider: "gmail",
        emailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      })
      .returning();

    // Fetch and store initial emails
    const fetchedEmails = await fetchEmails(
      tokens.access_token,
      tokens.refresh_token,
      50
    );

    for (const email of fetchedEmails) {
      await db
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
        .onConflictDoNothing();
    }

    return NextResponse.redirect(
      new URL(`/emails?connected=true&count=${fetchedEmails.length}`, request.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/?error=oauth_failed`, request.url)
    );
  }
}
