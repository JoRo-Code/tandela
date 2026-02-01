// ============================================
// Step 2: Determine Required Actions
// Based on assessment, identify what needs to happen
// ============================================

import { completeJSON } from "../client";
import { Assessment, RequiredAction, EmailInput, BusinessContext } from "./types";

const SYSTEM_PROMPT = `You are an action planner for a business email system.

Based on the email assessment, determine what actions are needed:

Available actions:
- create_booking: Customer wants to book an appointment
- cancel_booking: Customer wants to cancel an existing booking
- reschedule_booking: Customer wants to move their appointment
- answer_inquiry: Customer has a question that can be answered
- request_info: Need more information from customer to proceed
- escalate: Too complex, sensitive, or out of scope - needs human
- ignore: Spam, marketing, or irrelevant

You can specify multiple actions if needed (e.g., answer a question AND create a booking).
Priority 1 = most important, handle first.`;

export async function determineActions(
  email: EmailInput,
  assessment: Assessment,
  context: BusinessContext
): Promise<RequiredAction[]> {
  const prompt = `Based on this assessment, what actions are needed?

Email from: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Assessment:
- Sender: ${assessment.senderType}
- Intent: ${assessment.intent}
- Urgency: ${assessment.urgency}
- Sentiment: ${assessment.sentiment}

Business: ${context.name} (${context.type})

Respond with JSON array:
[
  {
    "type": "create_booking" | "cancel_booking" | "reschedule_booking" | "answer_inquiry" | "request_info" | "escalate" | "ignore",
    "priority": 1,
    "parameters": { "relevant": "data extracted from email" },
    "reasoning": "why this action is needed"
  }
]`;

  const result = await completeJSON<{ actions: RequiredAction[] } | RequiredAction[]>(prompt, {
    system: SYSTEM_PROMPT,
    temperature: 0.2,
  });

  // Handle both array and object responses
  return Array.isArray(result) ? result : result.actions || [];
}
