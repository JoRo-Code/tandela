import { completeJSON } from "./client";
import {
  ClassificationResult,
  GeneratedResponse,
  BusinessContext,
} from "./types";

function getSystemPrompt(context: BusinessContext): string {
  const toneGuide = {
    formal: "professional and courteous",
    friendly: "warm and approachable",
    casual: "relaxed and conversational",
  };

  return `You are responding to emails on behalf of ${context.name}, a ${context.type}.

Business description: ${context.description}
${context.services ? `Services: ${context.services.join(", ")}` : ""}
${context.hours ? `Hours: ${context.hours}` : ""}

Tone: Write in a ${toneGuide[context.tone || "friendly"]} manner.
${context.customInstructions ? `Special instructions: ${context.customInstructions}` : ""}

Guidelines:
- Be helpful and address the customer's needs
- Keep responses concise but complete
- If you cannot fully answer, acknowledge and offer to help further
- Never make up information you don't have
- Sign off appropriately for the business`;
}

export async function generateResponse(
  email: { subject: string | null; body: string | null; from: string | null },
  classification: ClassificationResult,
  context: BusinessContext
): Promise<GeneratedResponse> {
  const prompt = `Generate a response to this email.

Original email:
From: ${email.from || "Unknown"}
Subject: ${email.subject || "(no subject)"}
Body:
${email.body || "(empty)"}

Classification:
- Intent: ${classification.intent}
- Extracted info: ${JSON.stringify(classification.extractedInfo || {})}

Generate an appropriate response. Respond with JSON:
{
  "subject": "Re: original subject or new subject",
  "body": "the email response body",
  "confidence": 0.0-1.0,
  "reasoning": "why this response is appropriate"
}

Confidence should be:
- High (>0.8): You have enough context to fully address the request
- Medium (0.5-0.8): Partial answer, may need human review
- Low (<0.5): Uncertain, definitely needs human review`;

  return completeJSON<GeneratedResponse>(prompt, {
    system: getSystemPrompt(context),
    maxTokens: 1500,
    temperature: 0.4,
  });
}
