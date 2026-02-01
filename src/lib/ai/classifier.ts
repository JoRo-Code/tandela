import { completeJSON } from "./client";
import { ClassificationResult, BusinessContext } from "./types";

const CLASSIFICATION_SYSTEM = `You are an email classifier for a business. Analyze incoming emails and classify them by intent.

Available intents:
- booking_request: Customer wants to book/schedule an appointment
- general_inquiry: Questions about services, pricing, hours, etc.
- complaint: Customer expressing dissatisfaction
- follow_up: Response to previous conversation
- spam: Marketing, promotions, or irrelevant emails
- unknown: Cannot determine intent

Extract relevant information when applicable (dates, times, names, phone numbers).
Be conservative with confidence - only high confidence (>0.8) if intent is very clear.`;

export async function classifyEmail(
  email: { subject: string | null; body: string | null; from: string | null },
  context?: BusinessContext
): Promise<ClassificationResult> {
  const businessInfo = context
    ? `\nBusiness context: ${context.name} (${context.type}). ${context.description}`
    : "";

  const prompt = `Classify this email:${businessInfo}

From: ${email.from || "Unknown"}
Subject: ${email.subject || "(no subject)"}
Body:
${email.body || "(empty)"}

Respond with JSON:
{
  "intent": "booking_request" | "general_inquiry" | "complaint" | "follow_up" | "spam" | "unknown",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "extractedInfo": {
    "requestedDate": "if mentioned",
    "requestedTime": "if mentioned",
    "serviceType": "if mentioned",
    "customerName": "if identifiable",
    "phoneNumber": "if provided"
  }
}`;

  return completeJSON<ClassificationResult>(prompt, {
    system: CLASSIFICATION_SYSTEM,
    temperature: 0.1, // Low temp for consistent classification
  });
}
