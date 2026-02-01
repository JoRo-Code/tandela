// ============================================
// Step 3: Capability Check
// Can we perform the required actions?
// ============================================

import { completeJSON } from "../client";
import { RequiredAction, CapabilityCheck, EmailInput, BusinessContext } from "./types";

const SYSTEM_PROMPT = `You are a capability assessor for a business email AI system.

For each required action, check:
1. Do we have enough INFORMATION from the email to proceed?
   - For bookings: date, time, service type, customer contact info
   - For cancellations: which booking to cancel
   - For inquiries: enough context to answer

2. Can the AI PERFORM the action?
   - For now, assume: booking system IS connected, email sending IS available
   - Assume: NO access to patient records, NO payment processing

List any missing information or blocked actions clearly.`;

export async function checkCapability(
  email: EmailInput,
  actions: RequiredAction[],
  context: BusinessContext
): Promise<CapabilityCheck> {
  if (actions.length === 0 || actions.every(a => a.type === "ignore")) {
    return {
      canProceed: true,
      missingInfo: [],
      blockedActions: [],
      confidence: 1.0,
    };
  }

  const prompt = `Check if we can perform these actions:

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Required Actions:
${actions.map((a, i) => `${i + 1}. ${a.type}: ${a.reasoning}`).join("\n")}

Business: ${context.name}

Check:
1. Is all required information present in the email?
2. Can these actions be performed by an AI system?

Respond with JSON:
{
  "canProceed": true/false,
  "missingInfo": ["list of missing information needed from customer"],
  "blockedActions": ["list of actions that cannot be performed and why"],
  "confidence": 0.0-1.0
}`;

  return completeJSON<CapabilityCheck>(prompt, {
    system: SYSTEM_PROMPT,
    temperature: 0.1,
  });
}
