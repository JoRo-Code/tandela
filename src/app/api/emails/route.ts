import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import { emails } from "@/lib/db/schema";

export async function GET() {
  try {
    const allEmails = await db.query.emails.findMany({
      orderBy: [desc(emails.receivedAt)],
      limit: 100,
    });

    return NextResponse.json(allEmails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
