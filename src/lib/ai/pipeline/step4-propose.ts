// ============================================
// Step 4: Propose Response
// Generate draft email and list planned actions
// ============================================

import { completeJSON } from "../client";
import {
  Assessment,
  RequiredAction,
  CapabilityCheck,
  ProposedResponse,
  EmailInput,
  BusinessContext,
} from "./types";

function getSystemPrompt(context: BusinessContext): string {
  const toneGuide = {
    formal: "professional and courteous",
    friendly: "warm and approachable",
    casual: "relaxed and conversational",
  };

  return `You are drafting an email response for ${context.name}, a ${context.type}.

${context.description}
${context.services ? `Services: ${context.services.join(", ")}` : ""}
${context.hours ? `Hours: ${context.hours}` : ""}

Tone: Write in a ${toneGuide[context.tone || "friendly"]} manner.
${context.customInstructions || ""}

Guidelines:
- Address the customer's needs directly
- Be helpful and clear
- If you need more information, ask politely
- Never make up information you don't have
- Keep responses concise but complete`;
}

export async function proposeResponse(
  email: EmailInput,
  assessment: Assessment,
  actions: RequiredAction[],
  capability: CapabilityCheck,
  context: BusinessContext
): Promise<ProposedResponse> {
  // If we can't proceed, generate a clarification request
  const needsClarification = !capability.canProceed && capability.missingInfo.length > 0;

  const prompt = `Generate a response for this email.

Original Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Assessment:
- Intent: ${assessment.intent}
- Sentiment: ${assessment.sentiment}

Required Actions: ${actions.map(a => a.type).join(", ")}

${needsClarification
    ? `IMPORTANT: We need more information. Missing: ${capability.missingInfo.join(", ")}
Ask the customer for this information politely.`
    : `Capability: Can proceed with confidence ${capability.confidence}`
  }

Respond with JSON:
{
  "emailSubject": "Re: original subject or new subject",
  "emailBody": "the complete email response",
  "actions": [
    {
      "type": "action_type",
      "description": "what will be done",
      "willExecute": true/false
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "why this response is appropriate"
}`;

  return completeJSON<ProposedResponse>(prompt, {
    system: getSystemPrompt(context),
    maxTokens: 1500,
    temperature: 0.4,
  });
}
