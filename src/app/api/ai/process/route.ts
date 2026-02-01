import { NextRequest, NextResponse } from "next/server";
import { db, emails, drafts, activityLogs, workspaces } from "@/lib/db";
import { processEmail, BusinessContext, PipelineConfig } from "@/lib/ai/pipeline";
import { eq, isNull } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailId, mode } = body;

    // Get the email
    const email = emailId
      ? await db.query.emails.findFirst({ where: eq(emails.id, emailId) })
      : null;

    if (emailId && !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Get workspace and business context
    const workspace = await db.query.workspaces.findFirst();
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    const context: BusinessContext = {
      name: workspace.name,
      type: workspace.businessType || "business",
      description: workspace.businessDescription || "A local business",
      hours: workspace.businessHours || undefined,
      tone: (workspace.businessTone as "formal" | "friendly" | "casual") || "friendly",
      customInstructions: workspace.customInstructions || undefined,
    };

    // Pipeline configuration
    const config: Partial<PipelineConfig> = {
      workspaceId: workspace.id,
      mode: mode || "draft", // default to draft mode
    };

    // If specific email, process just that one
    if (email) {
      const result = await processEmail(
        {
          id: email.id,
          subject: email.subject,
          body: email.bodyText,
          from: email.fromAddress,
          to: email.toAddresses || [],
          threadId: email.threadId,
          receivedAt: email.receivedAt,
        },
        context,
        config
      );

      // Save draft to database if we have a proposed response
      let draft = null;
      if (result.proposedResponse) {
        [draft] = await db
          .insert(drafts)
          .values({
            emailId: email.id,
            workspaceId: workspace.id,
            intent: result.assessment.intent,
            intentConfidence: result.assessment.confidence,
            responseSubject: result.proposedResponse.emailSubject,
            responseBody: result.proposedResponse.emailBody,
            responseConfidence: result.proposedResponse.confidence,
            action: result.execution.decision,
            processingTimeMs: result.processingTimeMs,
          })
          .returning();
      }

      // Log activity
      await db.insert(activityLogs).values({
        workspaceId: workspace.id,
        emailId: email.id,
        draftId: draft?.id,
        type: "pipeline_complete",
        data: {
          assessment: result.assessment,
          requiredActions: result.requiredActions.map(a => a.type),
          capabilityCheck: result.capabilityCheck,
          execution: result.execution,
          model: result.model,
          processingTimeMs: result.processingTimeMs,
        },
      });

      return NextResponse.json({ result, draft });
    }

    // Process all unprocessed emails
    const unprocessedEmails = await db.query.emails.findMany({
      where: isNull(emails.syncedAt), // Simple check - in production use a proper "processed" flag
      limit: 10,
    });

    // For now, just return a message
    return NextResponse.json({
      message: `Found ${unprocessedEmails.length} emails to process`,
      hint: "Pass emailId in body to process a specific email",
    });
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: "Failed to process email", details: String(error) },
      { status: 500 }
    );
  }
}
