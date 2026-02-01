// ============================================
// Step 1: Assessment
// Analyze the email to understand context
// ============================================

import { completeJSON } from "../client";
import { Assessment, EmailInput, BusinessContext } from "./types";

const SYSTEM_PROMPT = `You are an email analyzer for a business. Your job is to assess incoming emails.

Analyze:
1. WHO is writing? (new_customer, existing_customer, vendor, spam, unknown)
2. WHAT do they want? (describe their intent in plain language)
3. How URGENT is it? (high, medium, low)
4. What's their SENTIMENT? (urgent, frustrated, neutral, positive)
5. Is this part of a THREAD? If so, summarize the context.

Be concise but accurate. Confidence should reflect how certain you are about your assessment.`;

export async function assessEmail(
  email: EmailInput,
  context: BusinessContext
): Promise<Assessment> {
  const prompt = `Assess this email for ${context.name} (${context.type}):

From: ${email.from || "Unknown"}
Subject: ${email.subject || "(no subject)"}
Body:
${email.body || "(empty)"}

Respond with JSON:
{
  "senderType": "new_customer" | "existing_customer" | "vendor" | "spam" | "unknown",
  "intent": "plain language description of what they want",
  "urgency": "high" | "medium" | "low",
  "sentiment": "urgent" | "frustrated" | "neutral" | "positive",
  "threadContext": "summary if part of thread, or null",
  "confidence": 0.0-1.0
}`;

  return completeJSON<Assessment>(prompt, {
    system: SYSTEM_PROMPT,
    temperature: 0.1,
  });
}
