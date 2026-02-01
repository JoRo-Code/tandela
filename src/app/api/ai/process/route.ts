import { NextRequest, NextResponse } from "next/server";
import { db, emails, drafts, activityLogs } from "@/lib/db";
import { processEmail, BusinessContext, PipelineConfig } from "@/lib/ai/pipeline";
import { eq, isNull } from "drizzle-orm";
import { getWorkspaceApi } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's workspace
    const result = await getWorkspaceApi();
    if ("error" in result) {
      return result.error;
    }

    const { workspace } = result;

    const body = await request.json();
    const { emailId, mode } = body;

    // Get the email
    const email = emailId
      ? await db.query.emails.findFirst({ where: eq(emails.id, emailId) })
      : null;

    if (emailId && !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Build business context from workspace
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
      const pipelineResult = await processEmail(
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
      if (pipelineResult.proposedResponse) {
        [draft] = await db
          .insert(drafts)
          .values({
            emailId: email.id,
            workspaceId: workspace.id,
            intent: pipelineResult.assessment.intent,
            intentConfidence: pipelineResult.assessment.confidence,
            responseSubject: pipelineResult.proposedResponse.emailSubject,
            responseBody: pipelineResult.proposedResponse.emailBody,
            responseConfidence: pipelineResult.proposedResponse.confidence,
            action: pipelineResult.execution.decision,
            processingTimeMs: pipelineResult.processingTimeMs,
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
          assessment: pipelineResult.assessment,
          requiredActions: pipelineResult.requiredActions.map(a => a.type),
          capabilityCheck: pipelineResult.capabilityCheck,
          execution: pipelineResult.execution,
          model: pipelineResult.model,
          processingTimeMs: pipelineResult.processingTimeMs,
        },
      });

      return NextResponse.json({ result: pipelineResult, draft });
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
